import { NextResponse } from "next/server"
import { apiErrorResponse, requireUser } from "@/lib/authz"
import { buildDashboardSummary } from "@/lib/dashboard"

export async function GET() {
  try {
    const { supabase, user } = await requireUser()
    const summary = await buildDashboardSummary(supabase, user.company_id)
    return NextResponse.json(summary)
  } catch (error) {
    return apiErrorResponse(error)
  }
}
