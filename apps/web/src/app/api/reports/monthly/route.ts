import { NextRequest, NextResponse } from "next/server"
import { apiErrorResponse, ApiError, requireUser } from "@/lib/authz"

export async function GET(req: NextRequest) {
  try {
    const { supabase } = await requireUser()
    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month")
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new ApiError(400, "VALIDATION_ERROR", "month must be in YYYY-MM format.", "month")
    }

    const from = `${month}-01`
    const [y, m] = month.split("-").map(Number)
    const to = new Date(y, m, 1).toISOString().slice(0, 10)

    const { data: bills } = await supabase
      .from("bills")
      .select("total_claimed, total_approved, total_flagged, status")
      .gte("created_at", from)
      .lt("created_at", to)

    const summary = (bills ?? []).reduce(
      (acc, b) => {
        acc.total_claimed += b.total_claimed
        acc.total_approved += b.total_approved
        acc.total_flagged += b.total_flagged
        acc.bill_count += 1
        return acc
      },
      { total_claimed: 0, total_approved: 0, total_flagged: 0, bill_count: 0 }
    )

    return NextResponse.json({ summary, export_url: `/api/reports/export?month=${month}` })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
