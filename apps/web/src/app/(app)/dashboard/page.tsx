import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { buildDashboardSummary } from "@/lib/dashboard"
import { Badge, Card } from "@/components/ui"

const STATUS_TONE: Record<string, "slate" | "amber" | "green" | "red" | "blue"> = {
  processing: "amber",
  ready: "blue",
  reviewed: "green",
  failed: "red",
}

function money(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  const { data: me } = await supabase.from("users").select("company_id").eq("id", authUser!.id).single()

  const summary = await buildDashboardSummary(supabase, me!.company_id)

  const { data: recentBills } = await supabase
    .from("bills")
    .select("*, transporters(name)")
    .order("created_at", { ascending: false })
    .limit(8)

  const maxTrend = Math.max(1, ...summary.trend.map((t) => t.total_claimed))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Where you&apos;re overpaying, at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total claimed</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{money(summary.total_claimed)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total approved</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">{money(summary.total_approved)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total flagged (₹)</p>
          <p className="mt-1 text-2xl font-semibold text-red-600">{money(summary.total_flagged)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Open flags</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.open_flag_count}</p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-700">Last 6 months</h2>
        <div className="mt-4 flex items-end gap-4">
          {summary.trend.map((t) => (
            <div key={t.month} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-32 w-full items-end justify-center gap-1">
                <div
                  className="w-3 rounded-t bg-slate-800"
                  style={{ height: `${Math.max(2, (t.total_claimed / maxTrend) * 100)}%` }}
                  title={`Claimed ${money(t.total_claimed)}`}
                />
                <div
                  className="w-3 rounded-t bg-red-400"
                  style={{ height: `${Math.max(2, (t.total_flagged / maxTrend) * 100)}%` }}
                  title={`Flagged ${money(t.total_flagged)}`}
                />
              </div>
              <span className="text-xs text-slate-500">{t.month.slice(5)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-slate-800" /> Claimed
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400" /> Flagged
          </span>
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent bills</h2>
        <Card>
          <ul className="divide-y divide-slate-200">
            {(recentBills ?? []).map((bill) => (
              <li key={bill.id}>
                <Link href={`/bills/${bill.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900">{bill.bill_number ?? "Untitled bill"}</p>
                    <p className="text-xs text-slate-500">
                      {(bill as unknown as { transporters: { name: string } | null }).transporters?.name ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">{money(bill.total_claimed)}</span>
                    <Badge tone={STATUS_TONE[bill.status] ?? "slate"}>{bill.status}</Badge>
                  </div>
                </Link>
              </li>
            ))}
            {(recentBills ?? []).length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-slate-500">
                No bills yet.{" "}
                <Link href="/bills/new" className="font-medium text-slate-900 underline">
                  Upload your first one
                </Link>
                .
              </li>
            )}
          </ul>
        </Card>
      </section>
    </div>
  )
}
