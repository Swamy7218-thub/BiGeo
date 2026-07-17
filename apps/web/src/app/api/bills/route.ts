import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import { randomUUID } from 'crypto'

const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'ap-south-1' })
const sqs = new SQSClient({ region: process.env.AWS_REGION ?? 'ap-south-1' })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('company_id, companies(bills_used_this_month, bills_limit, plan)')
    .eq('auth_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 })

  const company = (profile as any).companies
  if (company.bills_used_this_month >= company.bills_limit) {
    return NextResponse.json({ error: 'Monthly bill limit reached. Upgrade your plan.' }, { status: 402 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const transporterId = formData.get('transporter_id') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!transporterId) return NextResponse.json({ error: 'transporter_id required' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf'
  const s3Key = `${(profile as any).company_id}/bills/${randomUUID()}.${ext}`

  // Upload to S3
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: s3Key,
    Body: buffer,
    ContentType: file.type,
  }))

  // Create bill record
  const { data: bill, error: billError } = await supabase
    .from('bills')
    .insert({
      company_id: (profile as any).company_id,
      transporter_id: transporterId,
      s3_key: s3Key,
      mime_type: file.type,
      original_filename: file.name,
      status: 'uploaded',
      uploaded_by: user.id,
    })
    .select('id')
    .single()

  if (billError) return NextResponse.json({ error: billError.message }, { status: 500 })

  // Enqueue for processing
  await sqs.send(new SendMessageCommand({
    QueueUrl: process.env.SQS_QUEUE_URL!,
    MessageBody: JSON.stringify({
      bill_id: bill.id,
      company_id: (profile as any).company_id,
      s3_key: s3Key,
      mime_type: file.type,
    }),
  }))

  // Update bill counter
  await supabase.from('companies')
    .update({ bills_used_this_month: company.bills_used_this_month + 1 })
    .eq('id', (profile as any).company_id)

  return NextResponse.json({ bill_id: bill.id }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: bills } = await supabase
    .from('bills')
    .select('*, transporters(name)')
    .order('created_at', { ascending: false })
    .limit(100)

  return NextResponse.json({ bills })
}
