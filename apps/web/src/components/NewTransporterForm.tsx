"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Input, Label } from "@/components/ui"

export function NewTransporterForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [gstin, setGstin] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch("/api/transporters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, gstin: gstin || null }),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(body?.error?.message ?? "Could not add transporter.")
      return
    }
    setName("")
    setGstin("")
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Add transporter</Button>
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="min-w-[200px]">
        <Label htmlFor="t-name">Transporter name</Label>
        <Input id="t-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="min-w-[160px]">
        <Label htmlFor="t-gstin">GSTIN (optional)</Label>
        <Input id="t-gstin" value={gstin} onChange={(e) => setGstin(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
