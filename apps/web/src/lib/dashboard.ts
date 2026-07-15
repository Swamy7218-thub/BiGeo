import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

export interface MonthlyTrendPoint {
  month: string // YYYY-MM
  total_claimed: number
  total_flagged: number
}

export interface DashboardSummary {
  total_claimed: number
  total_approved: number
  total_flagged: number
  open_flag_count: number
  bill_count: number
  trend: MonthlyTrendPoint[]
}

/** FR-15: company-level dashboard totals + a 6-month trend (Section 12 wireframe). */
export async function buildDashboardSummary(
  supabase: SupabaseClient<Database>,
  companyId: string
): Promise<DashboardSummary> {
  const { data: bills } = await supabase
    .from("bills")
    .select("total_claimed, total_approved, total_flagged, created_at")
    .eq("company_id", companyId)

  const { count: openFlagCount } = await supabase
    .from("flags")
    .select("id, trip_lines!inner(bill_id, bills!inner(company_id))", { count: "exact", head: true })
    .eq("status", "open")
    .eq("trip_lines.bills.company_id", companyId)

  const totals = (bills ?? []).reduce(
    (acc, b) => {
      acc.total_claimed += b.total_claimed
      acc.total_approved += b.total_approved
      acc.total_flagged += b.total_flagged
      return acc
    },
    { total_claimed: 0, total_approved: 0, total_flagged: 0 }
  )

  const now = new Date()
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }

  const byMonth = new Map<string, { total_claimed: number; total_flagged: number }>()
  for (const month of months) byMonth.set(month, { total_claimed: 0, total_flagged: 0 })

  for (const b of bills ?? []) {
    const key = b.created_at.slice(0, 7)
    const bucket = byMonth.get(key)
    if (bucket) {
      bucket.total_claimed += b.total_claimed
      bucket.total_flagged += b.total_flagged
    }
  }

  const trend: MonthlyTrendPoint[] = months.map((month) => ({ month, ...byMonth.get(month)! }))

  return {
    ...totals,
    open_flag_count: openFlagCount ?? 0,
    bill_count: (bills ?? []).length,
    trend,
  }
}
