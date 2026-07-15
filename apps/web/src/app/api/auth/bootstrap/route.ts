import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { apiErrorResponse, ApiError } from "@/lib/authz"
import { recordAuditLog } from "@/lib/auditLog"

const bodySchema = z.object({
  company_name: z.string().trim().min(1).max(200),
})

/**
 * FR-1: called once, right after OTP verification on first signup. Creates
 * the company + users row for a brand-new auth user. Uses the service-role
 * client because at this instant the caller has no `users` row yet, so
 * ordinary RLS-scoped inserts have nothing to scope against.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser || !authUser.email) {
      throw new ApiError(401, "UNAUTHENTICATED", "Sign in required.")
    }

    const admin = createAdminClient()

    const { data: existing } = await admin.from("users").select("*").eq("id", authUser.id).maybeSingle()
    if (existing) {
      return NextResponse.json({ company_id: existing.company_id, already_onboarded: true })
    }

    const json = await req.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", "Company name is required.", "company_name")
    }

    const { data: company, error: companyError } = await admin
      .from("companies")
      .insert({ name: parsed.data.company_name })
      .select()
      .single()
    if (companyError || !company) throw companyError ?? new Error("Failed to create company")

    const { data: user, error: userError } = await admin
      .from("users")
      .insert({ id: authUser.id, company_id: company.id, email: authUser.email, role: "finance_head" })
      .select()
      .single()
    if (userError || !user) throw userError ?? new Error("Failed to create user")

    await recordAuditLog(admin, {
      companyId: company.id,
      actorId: user.id,
      entityType: "company",
      entityId: company.id,
      action: "company_created",
      after: { name: company.name },
    })

    return NextResponse.json({ company_id: company.id, already_onboarded: false })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
