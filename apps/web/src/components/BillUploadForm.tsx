"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Card, Label, Select } from "@/components/ui"

export function BillUploadForm({
  transporters,
  defaultTransporterId,
}: {
  transporters: { id: string; name: string }[]
  defaultTransporterId?: string
}) {
  const router = useRouter()
  const [transporterId, setTransporterId] = useState(defaultTransporterId ?? transporters[0]?.id ?? "")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)

  async function submit(force: boolean) {
    if (!file || !transporterId) return
    setLoading(true)
    setError(null)

    const form = new FormData()
    form.set("file", file)
    form.set("transporter_id", transporterId)
    if (force) form.set("force", "true")

    const res = await fetch("/api/bills", { method: "POST", body: form })
    const body = await res.json().catch(() => null)
    setLoading(false)

    if (res.status === 409) {
      setDuplicateWarning(body?.error?.message ?? "This file looks like a duplicate upload.")
      return
    }
    if (!res.ok) {
      setError(body?.error?.message ?? "Something went wrong uploading this bill.")
      return
    }

    router.push(`/bills/${body.bill_id}`)
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="transporter">Transporter</Label>
          <Select id="transporter" value={transporterId} onChange={(e) => setTransporterId(e.target.value)}>
            {transporters.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="file">Bill file</Label>
          <input
            id="file"
            type="file"
            required
            accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setDuplicateWarning(null)
            }}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-3.5 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
          />
        </div>

        {loading && (
          <p className="text-sm text-slate-500">
            Reading the bill and running the audit — this can take up to a few minutes for large bills…
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {duplicateWarning && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p>{duplicateWarning}</p>
            <div className="mt-2 flex gap-2">
              <Button variant="secondary" onClick={() => submit(true)}>
                Upload anyway
              </Button>
              <Button variant="ghost" onClick={() => setDuplicateWarning(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!duplicateWarning && (
          <Button onClick={() => submit(false)} disabled={loading || !file || !transporterId} className="w-full">
            {loading ? "Processing…" : "Upload & audit"}
          </Button>
        )}
      </div>
    </Card>
  )
}
