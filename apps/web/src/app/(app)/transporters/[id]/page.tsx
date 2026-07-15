import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Badge, Button, Card } from "@/components/ui"

const STATUS_TONE: Record<string, "slate" | "amber" | "green" | "red" | "blue"> = {
  processing: "amber",
  ready: "blue",
  reviewed: "green",
  failed: "red",
}

export default async function TransporterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: transporter } = await supabase.from("transporters").select("*").eq("id", id).single()
  if (!transporter) notFound()

  const [{ data: rateContracts }, { data: bills }] = await Promise.all([
    supabase
      .from("rate_contracts")
      .select("*, rate_lines(count)")
      .eq("transporter_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("bills").select("*").eq("transporter_id", id).order("created_at", { ascending: false }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <Link href="/transporters" className="text-sm text-slate-500 hover:underline">
          ← Transporters
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">{transporter.name}</h1>
        {transporter.gstin && <p className="text-sm text-slate-500">GSTIN: {transporter.gstin}</p>}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Rate contracts</h2>
          <Link href={`/transporters/${id}/rate-contracts/new`}>
            <Button>Upload rate contract</Button>
          </Link>
        </div>
        <Card>
          <ul className="divide-y divide-slate-200">
            {(rateContracts ?? []).map((rc) => (
              <li key={rc.id}>
                <Link href={`/rate-contracts/${rc.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900">
                      {rc.valid_from ?? "?"} → {rc.valid_to ?? "open-ended"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(rc as unknown as { rate_lines: { count: number }[] }).rate_lines?.[0]?.count ?? 0} lane rates
                    </p>
                  </div>
                  <Badge tone={rc.status === "confirmed" ? "green" : "amber"}>{rc.status}</Badge>
                </Link>
              </li>
            ))}
            {(rateContracts ?? []).length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-slate-500">
                No rate contract uploaded yet. Bills for this transporter will flag as &ldquo;no active contract&rdquo; until one is confirmed.
              </li>
            )}
          </ul>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Bills</h2>
          <Link href={`/bills/new?transporter_id=${id}`}>
            <Button>Upload bill</Button>
          </Link>
        </div>
        <Card>
          <ul className="divide-y divide-slate-200">
            {(bills ?? []).map((bill) => (
              <li key={bill.id}>
                <Link href={`/bills/${bill.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900">{bill.bill_number ?? "Untitled bill"}</p>
                    <p className="text-xs text-slate-500">{bill.bill_date ?? "date pending"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">₹{bill.total_claimed.toLocaleString("en-IN")}</span>
                    <Badge tone={STATUS_TONE[bill.status] ?? "slate"}>{bill.status}</Badge>
                  </div>
                </Link>
              </li>
            ))}
            {(bills ?? []).length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-slate-500">No bills uploaded yet.</li>
            )}
          </ul>
        </Card>
      </section>
    </div>
  )
}
