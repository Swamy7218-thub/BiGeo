import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { apiErrorResponse, ApiError, requireUser } from "@/lib/authz"
import { recordAuditLog } from "@/lib/auditLog"

const createSchema = z.object({
  contract_id: z.string().uuid(),
  origin: z.string().trim().min(1),
  destination: z.string().trim().min(1),
  vehicle_type: z.string().trim().min(1),
  rate: z.number().nonnegative(),
  rate_basis: z.enum(["per_trip", "per_km", "per_ton"]),
  detention_free_days: z.number().int().nonnegative().default(0),
  detention_rate: z.number().nonnegative().default(0),
})

/** Lets a reviewer add a rate line the extraction missed, before confirming (FR-3). */
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireUser()
    const json = await req.json().catch(() => null)
    const parsed = createSchema.safeParse(json)
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
    }

    const { data: contract } = await supabase
      .from("rate_contracts")
      .select("id")
      .eq("id", parsed.data.contract_id)
      .single()
    if (!contract) throw new ApiError(404, "NOT_FOUND", "Rate contract not found.")

    const { data: rateLine, error } = await supabase.from("rate_lines").insert(parsed.data).select().single()
    if (error) throw error

    await recordAuditLog(supabase, {
      companyId: user.company_id,
      actorId: user.id,
      entityType: "rate_line",
      entityId: rateLine.id,
      action: "rate_line_added_manually",
      after: rateLine,
    })

    return NextResponse.json({ rate_line: rateLine }, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
