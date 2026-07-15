import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSignedDocumentUrl } from "@/lib/storage"
import { Badge, Button, Card } from "@/components/ui"
import { BillReview } from "@/components/BillReview"

const STATUS_TONE: Record<string, "slate" | "amber" | "green" | "red" | "blue"> = {
  processing: "amber",
  ready: "blue",
  reviewed: "green",
  failed: "red",
}

export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: bill } = await supabase.from("bills").select("*, transporters(id, name)").eq("id", id).single()
  if (!bill) notFound()

  const [{ data: tripLines }, { data: auditLog }] = await Promise.all([
    supabase.from("trip_lines").select("*, flags(*)").eq("bill_id", id).order("created_at"),
    supabase
      .from("audit_log")
      .select("*, users(email)")
      .eq("entity_type", "bill")
      .eq("entity_id", id)
      .order("created_at", { ascending: false }),
  ])

  const fileUrl = await getSignedDocumentUrl(supabase, bill.raw_file_url).catch(() => null)
  const transporter = (bill as unknown as { transporters: { id: string; name: string } }).transporters

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/transporters/${transporter.id}`} className="text-sm text-slate-500 hover:underline">
            ← {transporter.name}
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{bill.bill_number ?? "Untitled bill"}</h1>
          <p className="text-sm text-slate-500">{bill.bill_date ?? "date pending"}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={STATUS_TONE[bill.status] ?? "slate"}>{bill.status}</Badge>
          <a href={`/api/reports/export?bill_id=${bill.id}`}>
            <Button variant="secondary">Export Excel</Button>
          </a>
        </div>
      </div>

      {bill.status === "failed" && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-medium">This bill could not be processed automatically.</p>
          <p className="mt-1">{bill.processing_error ?? "Unknown error."} The document is safely stored — contact support for manual entry.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <BillReview bill={bill} tripLines={(tripLines as never) ?? []} />

          <details className="rounded-lg border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700">Activity log</summary>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {(auditLog ?? []).map((entry) => (
                <li key={entry.id} className="border-b border-slate-100 pb-2 last:border-0">
                  <span className="font-medium text-slate-900">{entry.action}</span>{" "}
                  <span className="text-slate-400">
                    by {(entry as unknown as { users: { email: string } | null }).users?.email ?? "system"} ·{" "}
                    {new Date(entry.created_at).toLocaleString("en-IN")}
                  </span>
                </li>
              ))}
              {(auditLog ?? []).length === 0 && <li className="text-slate-400">No activity yet.</li>}
            </ul>
          </details>
        </div>

        <Card className="h-fit lg:sticky lg:top-6">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Original document</h2>
          </div>
          {fileUrl ? (
            <div className="p-2">
              <iframe src={fileUrl} className="h-[600px] w-full rounded" title="Original bill" />
              <a href={fileUrl} target="_blank" rel="noreferrer" className="mt-2 block text-center text-sm text-slate-500 hover:underline">
                Open in new tab
              </a>
            </div>
          ) : (
            <p className="p-4 text-sm text-slate-500">Document preview unavailable.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
