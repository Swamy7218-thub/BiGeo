"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge, Button, Input, Select } from "@/components/ui"
import type { Tables } from "@/types/database"

type RateLine = Tables<"rate_lines">
type RateContract = Tables<"rate_contracts"> & { rate_lines: RateLine[] }

const RATE_BASIS_OPTIONS = ["per_trip", "per_km", "per_ton"] as const

export function RateMasterReview({ contract }: { contract: RateContract }) {
  const router = useRouter()
  const [lines, setLines] = useState<RateLine[]>(contract.rate_lines)
  const [dirty, setDirty] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isConfirmed = contract.status === "confirmed"

  function updateLine(id: string, patch: Partial<RateLine>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
    setDirty((prev) => ({ ...prev, [id]: true }))
  }

  async function saveLine(line: RateLine) {
    setSaving((prev) => ({ ...prev, [line.id]: true }))
    const res = await fetch(`/api/rate-lines/${line.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: line.origin,
        destination: line.destination,
        vehicle_type: line.vehicle_type,
        rate: Number(line.rate),
        rate_basis: line.rate_basis,
        detention_free_days: Number(line.detention_free_days),
        detention_rate: Number(line.detention_rate),
      }),
    })
    setSaving((prev) => ({ ...prev, [line.id]: false }))
    if (res.ok) {
      setDirty((prev) => ({ ...prev, [line.id]: false }))
    }
  }

  async function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id))
    await fetch(`/api/rate-lines/${id}`, { method: "DELETE" })
  }

  async function addLine() {
    const res = await fetch("/api/rate-lines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contract_id: contract.id,
        origin: "",
        destination: "",
        vehicle_type: "",
        rate: 0,
        rate_basis: "per_trip",
        detention_free_days: 0,
        detention_rate: 0,
      }),
    })
    if (res.ok) {
      const body = await res.json()
      setLines((prev) => [...prev, body.rate_line])
    }
  }

  async function handleConfirm() {
    setConfirming(true)
    setError(null)
    const res = await fetch(`/api/rate-contracts/${contract.id}/confirm`, { method: "PATCH" })
    setConfirming(false)
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(body?.error?.message ?? "Could not confirm this rate contract.")
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {!isConfirmed && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Extracted from contract — please review every lane rate before confirming. This becomes the active rate
          master for every future bill from this transporter (FR-3).
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Origin</th>
              <th className="px-3 py-2">Destination</th>
              <th className="px-3 py-2">Vehicle type</th>
              <th className="px-3 py-2">Rate</th>
              <th className="px-3 py-2">Basis</th>
              <th className="px-3 py-2">Free days</th>
              <th className="px-3 py-2">Detention/day</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line) => (
              <tr key={line.id}>
                <td className="px-3 py-2">
                  <Input
                    disabled={isConfirmed}
                    value={line.origin}
                    onChange={(e) => updateLine(line.id, { origin: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    disabled={isConfirmed}
                    value={line.destination}
                    onChange={(e) => updateLine(line.id, { destination: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    disabled={isConfirmed}
                    value={line.vehicle_type}
                    onChange={(e) => updateLine(line.id, { vehicle_type: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    disabled={isConfirmed}
                    value={line.rate}
                    onChange={(e) => updateLine(line.id, { rate: Number(e.target.value) })}
                  />
                </td>
                <td className="px-3 py-2">
                  <Select
                    disabled={isConfirmed}
                    value={line.rate_basis}
                    onChange={(e) => updateLine(line.id, { rate_basis: e.target.value })}
                  >
                    {RATE_BASIS_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    disabled={isConfirmed}
                    value={line.detention_free_days}
                    onChange={(e) => updateLine(line.id, { detention_free_days: Number(e.target.value) })}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    disabled={isConfirmed}
                    value={line.detention_rate}
                    onChange={(e) => updateLine(line.id, { detention_rate: Number(e.target.value) })}
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {!isConfirmed && (
                    <div className="flex gap-2">
                      {dirty[line.id] && (
                        <Button variant="secondary" onClick={() => saveLine(line)} disabled={saving[line.id]}>
                          {saving[line.id] ? "Saving…" : "Save"}
                        </Button>
                      )}
                      <Button variant="ghost" onClick={() => removeLine(line.id)}>
                        Remove
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {lines.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm text-slate-500">
                  No lane rates extracted. Add one manually below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!isConfirmed && (
        <Button variant="secondary" onClick={addLine}>
          + Add lane rate
        </Button>
      )}

      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
        <div>
          {contract.extraction_confidence != null && (
            <Badge tone={contract.extraction_confidence >= 0.85 ? "green" : "amber"}>
              Extraction confidence: {Math.round(contract.extraction_confidence * 100)}%
            </Badge>
          )}
        </div>
        {isConfirmed ? (
          <Badge tone="green">Confirmed — active rate master</Badge>
        ) : (
          <div className="flex items-center gap-3">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={handleConfirm} disabled={confirming || lines.length === 0}>
              {confirming ? "Confirming…" : "Confirm rate master"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
