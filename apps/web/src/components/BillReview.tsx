"use client"

import { Fragment, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge, Button } from "@/components/ui"
import type { Tables } from "@/types/database"

type Flag = Tables<"flags">
type TripLine = Tables<"trip_lines"> & { flags: Flag[] }
type Bill = Tables<"bills">

const FLAG_LABEL: Record<string, string> = {
  rate_mismatch: "Rate mismatch",
  duplicate: "Duplicate",
  detention_invalid: "Invalid detention",
  missing_pod: "Missing POD",
  unknown_lane: "Unknown lane",
  detention_date_mismatch: "Detention date mismatch",
  no_active_contract: "No active contract",
}

const STATUS_TONE: Record<string, "amber" | "green" | "slate" | "red"> = {
  open: "amber",
  accepted: "green",
  waived: "slate",
  disputed: "red",
}

function money(n: number | null) {
  if (n == null) return "—"
  return `₹${n.toLocaleString("en-IN")}`
}

export function BillReview({ bill: initialBill, tripLines: initialTripLines }: { bill: Bill; tripLines: TripLine[] }) {
  const router = useRouter()
  const [bill, setBill] = useState(initialBill)
  const [tripLines, setTripLines] = useState(initialTripLines)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  async function updateFlag(flagId: string, status: Flag["status"]) {
    setUpdating(flagId)
    const res = await fetch(`/api/flags/${flagId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setUpdating(null)
    if (!res.ok) return

    const body = await res.json()
    setTripLines((prev) =>
      prev.map((t) => ({ ...t, flags: t.flags.map((f) => (f.id === flagId ? body.flag : f)) }))
    )
    setBill((prev) => ({ ...prev, ...body.bill_totals }))
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total claimed" value={money(bill.total_claimed)} />
        <StatCard label="Total approved" value={money(bill.total_approved)} tone="green" />
        <StatCard label="Total flagged" value={money(bill.total_flagged)} tone={bill.total_flagged > 0 ? "red" : undefined} />
        <StatCard label="Trip lines" value={String(tripLines.length)} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[820px] divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">LR / Date</th>
              <th className="px-3 py-2">Route</th>
              <th className="px-3 py-2">Vehicle</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tripLines.map((line) => {
              const extras = ((line.extra_charges_json as { type: string; amount: number }[] | null) ?? []).reduce(
                (s, c) => s + c.amount,
                0
              )
              const total = line.base_amount + extras
              const isExpanded = expanded === line.id
              return (
                <Fragment key={line.id}>
                  <tr
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setExpanded(isExpanded ? null : line.id)}
                  >
                    <td className="px-3 py-2">
                      <p className="font-medium text-slate-900">{line.lr_number ?? "—"}</p>
                      <p className="text-xs text-slate-500">{line.trip_date ?? "—"}</p>
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {line.origin ?? "?"} → {line.destination ?? "?"}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {line.vehicle_number ?? "—"}
                      <p className="text-xs text-slate-400">{line.vehicle_type ?? ""}</p>
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-900">{money(total)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {line.needs_review && <Badge tone="amber">Low confidence</Badge>}
                        {line.flags.map((f) => (
                          <Badge key={f.id} tone={STATUS_TONE[f.status]}>
                            {FLAG_LABEL[f.flag_type] ?? f.flag_type}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} className="bg-slate-50 px-4 py-3">
                        {line.flags.length === 0 ? (
                          <p className="text-sm text-slate-500">No flags on this trip.</p>
                        ) : (
                          <ul className="space-y-3">
                            {line.flags.map((f) => (
                              <li key={f.id} className="rounded-md border border-slate-200 bg-white p-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">
                                      {FLAG_LABEL[f.flag_type] ?? f.flag_type}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">{f.reason}</p>
                                    <p className="mt-1 text-xs text-slate-400">
                                      Expected {money(f.expected_amount)} · Claimed {money(f.claimed_amount)}
                                    </p>
                                  </div>
                                  <Badge tone={STATUS_TONE[f.status]}>{f.status}</Badge>
                                </div>
                                {f.status === "open" && (
                                  <div className="mt-3 flex gap-2">
                                    <Button
                                      variant="secondary"
                                      disabled={updating === f.id}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        updateFlag(f.id, "accepted")
                                      }}
                                    >
                                      Accept
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      disabled={updating === f.id}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        updateFlag(f.id, "waived")
                                      }}
                                    >
                                      Waive
                                    </Button>
                                    <Button
                                      variant="danger"
                                      disabled={updating === f.id}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        updateFlag(f.id, "disputed")
                                      }}
                                    >
                                      Dispute
                                    </Button>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
            {tripLines.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                  No trip lines extracted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "green" | "red" }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold ${
          tone === "green" ? "text-emerald-600" : tone === "red" ? "text-red-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  )
}
