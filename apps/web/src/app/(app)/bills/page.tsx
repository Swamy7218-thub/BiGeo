import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Badge, Button, Card } from "@/components/ui"

const STATUS_TONE: Record<string, "slate" | "amber" | "green" | "red" | "blue"> = {
  processing: "amber",
  ready: "blue",
  reviewed: "green",
  failed: "red",
}

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = await createClient()

  let query = supabase.from("bills").select("*, transporters(name)").order("created_at", { ascending: false })
  if (status) query = query.eq("status", status)
  const { data: bills } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Bills</h1>
          <p className="text-sm text-slate-500">Every bill uploaded, its processing status, and flagged value.</p>
        </div>
        <Link href="/bills/new">
          <Button>Upload bill</Button>
        </Link>
      </div>

      <div className="flex gap-2 text-sm">
        {["", "processing", "ready", "reviewed", "failed"].map((s) => (
          <Link
            key={s || "all"}
            href={s ? `/bills?status=${s}` : "/bills"}
            className={`rounded-full px-3 py-1 ${
              (status ?? "") === s ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {s || "All"}
          </Link>
        ))}
      </div>

      <Card>
        <table className="w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Bill</th>
              <th className="px-4 py-2">Transporter</th>
              <th className="px-4 py-2">Claimed</th>
              <th className="px-4 py-2">Flagged</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(bills ?? []).map((bill) => (
              <tr key={bill.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/bills/${bill.id}`} className="font-medium text-slate-900 hover:underline">
                    {bill.bill_number ?? "Untitled bill"}
                  </Link>
                  <p className="text-xs text-slate-500">{bill.bill_date ?? "date pending"}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {(bill as unknown as { transporters: { name: string } | null }).transporters?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">₹{bill.total_claimed.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">
                  {bill.total_flagged > 0 ? (
                    <span className="font-medium text-red-600">₹{bill.total_flagged.toLocaleString("en-IN")}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[bill.status] ?? "slate"}>{bill.status}</Badge>
                </td>
              </tr>
            ))}
            {(bills ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                  No bills yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
