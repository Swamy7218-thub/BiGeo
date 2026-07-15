import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { apiErrorResponse, ApiError, requireUser } from "@/lib/authz"
import { recordAuditLog } from "@/lib/auditLog"
import { recalcBillTotals } from "@/lib/audit/persist"

const updateSchema = z.object({
  status: z.enum(["open", "accepted", "waived", "disputed"]),
})

/**
 * FR-12: Accept / Waive / Dispute. Updates immediately, records the
 * actor + timestamp in audit_log (Section 20/FR-18), and recalculates the
 * bill's totals so "amount at risk" always reflects only OPEN flags.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { supabase, user } = await requireUser()

    const json = await req.json().catch(() => null)
    const parsed = updateSchema.safeParse(json)
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", "status must be one of open, accepted, waived, disputed.", "status")
    }

    const { data: existing } = await supabase
      .from("flags")
      .select("*, trip_lines!inner(bill_id)")
      .eq("id", id)
      .single()
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Flag not found.")

    const billId = (existing as unknown as { trip_lines: { bill_id: string } }).trip_lines.bill_id

    const { data: updated, error } = await supabase
      .from("flags")
      .update({ status: parsed.data.status, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error

    await recordAuditLog(supabase, {
      companyId: user.company_id,
      actorId: user.id,
      entityType: "flag",
      entityId: id,
      action: "flag_status_changed",
      before: { status: existing.status },
      after: { status: updated.status },
    })

    const totals = await recalcBillTotals(supabase, billId)

    return NextResponse.json({ flag: updated, bill_totals: totals })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
