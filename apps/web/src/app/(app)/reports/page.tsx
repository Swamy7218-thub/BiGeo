"use client"

import { useState } from "react"
import { Button, Card, Input, Label } from "@/components/ui"

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export default function ReportsPage() {
  const [month, setMonth] = useState(currentMonth())
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<{
    total_claimed: number
    total_approved: number
    total_flagged: number
    bill_count: number
  } | null>(null)

  async function loadSummary() {
    setLoading(true)
    const res = await fetch(`/api/reports/monthly?month=${month}`)
    setLoading(false)
    if (res.ok) {
      const body = await res.json()
      setSummary(body.summary)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monthly audit report, formatted to export and send back to the transporter (FR-17).
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-end gap-3">
          <div>
            <Label htmlFor="month">Month</Label>
            <Input id="month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <Button variant="secondary" onClick={loadSummary} disabled={loading}>
            {loading ? "Loading…" : "Preview"}
          </Button>
          <a href={`/api/reports/export?month=${month}`}>
            <Button>Export Excel</Button>
          </a>
        </div>

        {summary && (
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Bills</dt>
              <dd className="text-lg font-semibold text-slate-900">{summary.bill_count}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Total claimed</dt>
              <dd className="text-lg font-semibold text-slate-900">₹{summary.total_claimed.toLocaleString("en-IN")}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Total approved</dt>
              <dd className="text-lg font-semibold text-emerald-600">₹{summary.total_approved.toLocaleString("en-IN")}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Total flagged</dt>
              <dd className="text-lg font-semibold text-red-600">₹{summary.total_flagged.toLocaleString("en-IN")}</dd>
            </div>
          </dl>
        )}
      </Card>
    </div>
  )
}
