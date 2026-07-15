import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { apiErrorResponse, ApiError, requireUser } from "@/lib/authz"
import { recordAuditLog } from "@/lib/auditLog"

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  gstin: z.string().trim().max(20).optional().nullable(),
})

export async function GET() {
  try {
    const { supabase } = await requireUser()
    const { data, error } = await supabase.from("transporters").select("*").order("name")
    if (error) throw error
    return NextResponse.json({ transporters: data })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireUser()
    const json = await req.json().catch(() => null)
    const parsed = createSchema.safeParse(json)
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", "name")
    }

    const { data, error } = await supabase
      .from("transporters")
      .insert({ company_id: user.company_id, name: parsed.data.name, gstin: parsed.data.gstin || null })
      .select()
      .single()
    if (error) throw error

    await recordAuditLog(supabase, {
      companyId: user.company_id,
      actorId: user.id,
      entityType: "transporter",
      entityId: data.id,
      action: "transporter_created",
      after: { name: data.name, gstin: data.gstin },
    })

    return NextResponse.json({ transporter: data }, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
