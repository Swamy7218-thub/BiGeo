import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { apiErrorResponse, ApiError, requireUser } from "@/lib/authz"
import { recordAuditLog } from "@/lib/auditLog"

const updateSchema = z.object({
  origin: z.string().trim().min(1).optional(),
  destination: z.string().trim().min(1).optional(),
  vehicle_type: z.string().trim().min(1).optional(),
  rate: z.number().nonnegative().optional(),
  rate_basis: z.enum(["per_trip", "per_km", "per_ton"]).optional(),
  detention_free_days: z.number().int().nonnegative().optional(),
  detention_rate: z.number().nonnegative().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { supabase, user } = await requireUser()

    const json = await req.json().catch(() => null)
    const parsed = updateSchema.safeParse(json)
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
    }

    const { data: existing } = await supabase
      .from("rate_lines")
      .select("*, rate_contracts!inner(id, status)")
      .eq("id", id)
      .single()
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Rate line not found.")

    const { data: updated, error } = await supabase
      .from("rate_lines")
      .update(parsed.data)
      .eq("id", id)
      .select()
      .single()
    if (error) throw error

    await recordAuditLog(supabase, {
      companyId: user.company_id,
      actorId: user.id,
      entityType: "rate_line",
      entityId: id,
      action: "rate_line_corrected",
      before: existing,
      after: updated,
    })

    return NextResponse.json({ rate_line: updated })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { supabase, user } = await requireUser()

    const { data: existing } = await supabase.from("rate_lines").select("*").eq("id", id).single()
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Rate line not found.")

    const { error } = await supabase.from("rate_lines").delete().eq("id", id)
    if (error) throw error

    await recordAuditLog(supabase, {
      companyId: user.company_id,
      actorId: user.id,
      entityType: "rate_line",
      entityId: id,
      action: "rate_line_removed",
      before: existing,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
