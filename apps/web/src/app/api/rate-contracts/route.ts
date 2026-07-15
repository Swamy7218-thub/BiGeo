import { NextRequest, NextResponse } from "next/server"
import { apiErrorResponse, ApiError, requireUser } from "@/lib/authz"
import { recordAuditLog } from "@/lib/auditLog"
import { documentPath, MAX_UPLOAD_BYTES, uploadDocument } from "@/lib/storage"
import { extractRateContractFromDocument, ExtractionFailedError } from "@/lib/ai/extract"
import { LEVEL_SCORE } from "@/lib/ai/confidence"

/**
 * FR-2: upload a rate contract (PDF/Excel) and extract lane rates,
 * vehicle-type rates, detention rules into a structured draft rate
 * master. Never activated automatically — FR-3 requires human
 * confirmation before it can price a single bill.
 */
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireUser()

    const form = await req.formData()
    const file = form.get("file")
    const transporterId = form.get("transporter_id")

    if (!(file instanceof File) || file.size === 0) {
      throw new ApiError(400, "VALIDATION_ERROR", "A file is required.", "file")
    }
    if (typeof transporterId !== "string" || !transporterId) {
      throw new ApiError(400, "VALIDATION_ERROR", "transporter_id is required.", "transporter_id")
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new ApiError(400, "VALIDATION_ERROR", "File exceeds the 25MB upload limit.", "file")
    }

    const { data: transporter } = await supabase
      .from("transporters")
      .select("id")
      .eq("id", transporterId)
      .single()
    if (!transporter) throw new ApiError(404, "NOT_FOUND", "Transporter not found.")

    const path = documentPath(user.company_id, "rate-contracts", transporterId, file.name)
    await uploadDocument(supabase, path, file)

    const bytes = Buffer.from(await file.arrayBuffer())

    let extraction
    try {
      extraction = await extractRateContractFromDocument({ bytes, mediaType: file.type, filename: file.name })
    } catch (err) {
      if (err instanceof ExtractionFailedError) {
        throw new ApiError(
          422,
          "EXTRACTION_FAILED",
          "Could not read this rate contract automatically. Please check the file and try again, or contact support for manual entry."
        )
      }
      throw err
    }

    const avgConfidence =
      extraction.rate_lines.length === 0
        ? 0
        : extraction.rate_lines.reduce((sum, rl) => sum + LEVEL_SCORE[rl.confidence], 0) / extraction.rate_lines.length

    const { data: contract, error: contractError } = await supabase
      .from("rate_contracts")
      .insert({
        transporter_id: transporterId,
        company_id: user.company_id,
        raw_file_url: path,
        parsed_json: extraction,
        valid_from: extraction.valid_from,
        valid_to: extraction.valid_to,
        status: "draft",
        extraction_confidence: avgConfidence,
      })
      .select()
      .single()
    if (contractError || !contract) throw contractError ?? new Error("Failed to save rate contract")

    if (extraction.rate_lines.length > 0) {
      const { error: linesError } = await supabase.from("rate_lines").insert(
        extraction.rate_lines.map((rl) => ({
          contract_id: contract.id,
          origin: rl.origin,
          destination: rl.destination,
          vehicle_type: rl.vehicle_type,
          rate: rl.rate,
          rate_basis: rl.rate_basis,
          detention_free_days: rl.detention_free_days,
          detention_rate: rl.detention_rate,
        }))
      )
      if (linesError) throw linesError
    }

    await recordAuditLog(supabase, {
      companyId: user.company_id,
      actorId: user.id,
      entityType: "rate_contract",
      entityId: contract.id,
      action: "rate_contract_uploaded",
      after: { transporter_id: transporterId, line_count: extraction.rate_lines.length },
    })

    return NextResponse.json({ rate_contract_id: contract.id, status: "draft" }, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
