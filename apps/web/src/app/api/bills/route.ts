import { createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { apiErrorResponse, ApiError, requireUser } from "@/lib/authz"
import { recordAuditLog } from "@/lib/auditLog"
import { documentPath, MAX_UPLOAD_BYTES, uploadDocument } from "@/lib/storage"
import { extractBillFromDocument, ExtractionFailedError } from "@/lib/ai/extract"
import { billArithmeticReconciles, lineArithmeticReconciles, resolveFieldConfidence, DEFAULT_REVIEW_THRESHOLD } from "@/lib/ai/confidence"
import { auditAndPersistBill } from "@/lib/audit/persist"

export async function GET(req: NextRequest) {
  try {
    const { supabase } = await requireUser()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const transporterId = searchParams.get("transporter_id")

    let query = supabase.from("bills").select("*, transporters(name)").order("created_at", { ascending: false })
    if (status) query = query.eq("status", status)
    if (transporterId) query = query.eq("transporter_id", transporterId)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ bills: data })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

/**
 * FR-5/FR-6: upload a bill and extract every trip line. Runs the
 * extraction and audit engine synchronously in the request (a documented
 * MVP simplification of Section 14's queue-based worker — see README —
 * fine at pilot volume, revisit before scaling past a handful of large
 * concurrent uploads).
 */
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireUser()

    const form = await req.formData()
    const file = form.get("file")
    const transporterId = form.get("transporter_id")
    const force = form.get("force") === "true"

    if (!(file instanceof File) || file.size === 0) {
      throw new ApiError(400, "VALIDATION_ERROR", "A file is required.", "file")
    }
    if (typeof transporterId !== "string" || !transporterId) {
      throw new ApiError(400, "VALIDATION_ERROR", "transporter_id is required.", "transporter_id")
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new ApiError(400, "VALIDATION_ERROR", "File exceeds the 25MB upload limit.", "file")
    }

    const { data: transporter } = await supabase.from("transporters").select("id").eq("id", transporterId).single()
    if (!transporter) throw new ApiError(404, "NOT_FOUND", "Transporter not found.")

    const bytes = Buffer.from(await file.arrayBuffer())
    const fileHash = createHash("sha256").update(bytes).digest("hex")

    if (!force) {
      const { data: dupe } = await supabase
        .from("bills")
        .select("id, bill_number, created_at")
        .eq("transporter_id", transporterId)
        .eq("file_hash", fileHash)
        .maybeSingle()
      if (dupe) {
        throw new ApiError(
          409,
          "DUPLICATE_UPLOAD",
          `This exact file was already uploaded as bill ${dupe.bill_number ?? dupe.id} on ${new Date(
            dupe.created_at
          ).toLocaleDateString("en-IN")}. Resubmit with force=true to upload anyway.`
        )
      }
    }

    const path = documentPath(user.company_id, "bills", transporterId, file.name)
    await uploadDocument(supabase, path, file)

    const { data: bill, error: billError } = await supabase
      .from("bills")
      .insert({
        company_id: user.company_id,
        transporter_id: transporterId,
        raw_file_url: path,
        file_hash: fileHash,
        status: "processing",
      })
      .select()
      .single()
    if (billError || !bill) throw billError ?? new Error("Failed to create bill")

    await recordAuditLog(supabase, {
      companyId: user.company_id,
      actorId: user.id,
      entityType: "bill",
      entityId: bill.id,
      action: "bill_uploaded",
      after: { transporter_id: transporterId, filename: file.name },
    })

    try {
      const extraction = await extractBillFromDocument({ bytes, mediaType: file.type, filename: file.name })
      const billReconciles = billArithmeticReconciles(extraction)

      if (extraction.trip_lines.length > 0) {
        const { error: linesError } = await supabase.from("trip_lines").insert(
          extraction.trip_lines.map((line) => {
            const confidence = resolveFieldConfidence(
              line.confidence,
              lineArithmeticReconciles(line) && billReconciles
            )
            return {
              bill_id: bill.id,
              lr_number: line.lr_number,
              trip_date: line.trip_date,
              origin: line.origin,
              destination: line.destination,
              vehicle_number: line.vehicle_number,
              vehicle_type: line.vehicle_type,
              base_amount: line.base_amount,
              extra_charges_json: line.extra_charges,
              extraction_confidence: confidence,
              needs_review: confidence < DEFAULT_REVIEW_THRESHOLD,
            }
          })
        )
        if (linesError) throw linesError
      }

      await supabase
        .from("bills")
        .update({ bill_number: extraction.bill_number, bill_date: extraction.bill_date })
        .eq("id", bill.id)

      await auditAndPersistBill(supabase, user.company_id, transporterId, bill.id)

      await recordAuditLog(supabase, {
        companyId: user.company_id,
        actorId: user.id,
        entityType: "bill",
        entityId: bill.id,
        action: "bill_processed",
        after: { trip_count: extraction.trip_lines.length },
      })
    } catch (err) {
      const message =
        err instanceof ExtractionFailedError
          ? "Could not read this bill automatically after retrying. Marked for manual entry."
          : err instanceof Error
            ? err.message
            : "Unknown processing error."
      await supabase.from("bills").update({ status: "failed", processing_error: message }).eq("id", bill.id)
    }

    return NextResponse.json({ bill_id: bill.id }, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
