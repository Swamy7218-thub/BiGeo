import { NextResponse } from "next/server"
import { apiErrorResponse, ApiError, requireUser } from "@/lib/authz"
import { recordAuditLog } from "@/lib/auditLog"

/**
 * FR-3: the single highest-leverage human-in-the-loop checkpoint in the
 * product (Section 15.2) — a rate contract only prices bills once a human
 * has reviewed and confirmed the extracted rate master.
 */
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { supabase, user } = await requireUser()

    const { data: existing } = await supabase.from("rate_contracts").select("*").eq("id", id).single()
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Rate contract not found.")
    if (existing.status === "confirmed") {
      return NextResponse.json({ rate_contract: existing })
    }

    const { data: rateLines } = await supabase.from("rate_lines").select("id").eq("contract_id", id)
    if (!rateLines || rateLines.length === 0) {
      throw new ApiError(
        422,
        "NO_RATE_LINES",
        "This rate contract has no lane rates to confirm. Add at least one before confirming."
      )
    }

    const { data: updated, error } = await supabase
      .from("rate_contracts")
      .update({ status: "confirmed" })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error

    await recordAuditLog(supabase, {
      companyId: user.company_id,
      actorId: user.id,
      entityType: "rate_contract",
      entityId: id,
      action: "rate_contract_confirmed",
      before: { status: existing.status },
      after: { status: "confirmed" },
    })

    return NextResponse.json({ rate_contract: updated })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
