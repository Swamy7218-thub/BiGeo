import { SQSEvent } from 'aws-lambda'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'
import { extractBill } from '../extraction/extract-bill'
import { runAudit } from '../audit/run-audit'
import type { TripLine, RateLine, POD } from '@freightcheck/shared'

const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'ap-south-1' })

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface BillJobPayload {
  bill_id: string
  company_id: string
  s3_key: string
  mime_type: string
}

export async function handler(event: SQSEvent) {
  for (const record of event.Records) {
    const payload: BillJobPayload = JSON.parse(record.body)
    await processBill(payload).catch(err => {
      console.error(`Failed to process bill ${payload.bill_id}:`, err)
      // Re-throw so SQS retries (DLQ catches after maxReceiveCount)
      throw err
    })
  }
}

async function processBill(payload: BillJobPayload) {
  const { bill_id, company_id, s3_key, mime_type } = payload

  // 1. Fetch file from S3
  const s3Resp = await s3.send(new GetObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: s3_key,
  }))
  const chunks: Buffer[] = []
  for await (const chunk of s3Resp.Body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk))
  }
  const fileBuffer = Buffer.concat(chunks)

  // 2. Mark bill as processing
  await supabase.from('bills').update({ status: 'processing' }).eq('id', bill_id)

  try {
    // 3. Extract trip lines via Claude
    const extraction = await extractBill(fileBuffer, mime_type)

    // 4. Upsert bill-level metadata
    await supabase.from('bills').update({
      bill_number: extraction.bill_number,
      bill_date: extraction.bill_date,
      total_amount: extraction.total_amount,
      extraction_confidence: extraction.overall_confidence,
      arithmetic_check_passed: extraction.arithmetic_check_passed,
      low_confidence_fields: extraction.low_confidence_fields,
    }).eq('id', bill_id)

    // 5. Route low-confidence to human review
    if (extraction.overall_confidence < 0.75 || !extraction.arithmetic_check_passed) {
      await supabase.from('bills').update({ status: 'needs_review' }).eq('id', bill_id)
      return
    }

    // 6. Fetch context needed for audit
    const { data: bill } = await supabase.from('bills').select('transporter_id').eq('id', bill_id).single()
    const transporterId = bill?.transporter_id

    const { data: rateLines } = await supabase
      .from('rate_lines')
      .select('*, rate_contracts!inner(transporter_id, company_id, status)')
      .eq('rate_contracts.company_id', company_id)
      .eq('rate_contracts.transporter_id', transporterId)
      .eq('rate_contracts.status', 'confirmed')
      .returns<RateLine[]>()

    const { data: existingTrips } = await supabase
      .from('trip_lines')
      .select('*, bills!inner(transporter_id, company_id)')
      .eq('bills.company_id', company_id)
      .eq('bills.transporter_id', transporterId)
      .neq('bills.id', bill_id)
      .returns<TripLine[]>()

    // 7. Insert trip lines and run audit for each
    for (const extracted of extraction.trips) {
      // Insert trip line
      const { data: tripLine } = await supabase.from('trip_lines').insert({
        bill_id,
        company_id,
        ...extracted,
        extra_charges_json: extracted.extra_charges,
        status: 'pending',
      }).select().single()

      if (!tripLine) continue

      // Fetch matching POD if any
      const { data: pod } = await supabase
        .from('pods')
        .select('*')
        .eq('company_id', company_id)
        .ilike('lr_number', extracted.lr_number)
        .maybeSingle<POD>()

      // Run all audit checks
      const flags = runAudit({
        tripLine: tripLine as TripLine,
        rateLines: rateLines ?? [],
        existingTrips: existingTrips ?? [],
        pod,
      })

      // Insert flags
      if (flags.length > 0) {
        await supabase.from('flags').insert(
          flags.map(f => ({ ...f, status: 'open' }))
        )
      }

      // Update trip line status
      const tripStatus = flags.length === 0 ? 'approved' : 'flagged'
      await supabase.from('trip_lines').update({ status: tripStatus }).eq('id', tripLine.id)
    }

    // 8. Mark bill as audited (bill totals updated by DB trigger)
    await supabase.from('bills').update({ status: 'audited' }).eq('id', bill_id)

  } catch (err) {
    await supabase.from('bills').update({ status: 'failed' }).eq('id', bill_id)
    throw err
  }
}
