"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Card, Label } from "@/components/ui"

export function RateContractUploadForm({ transporterId }: { transporterId: string }) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)

    const form = new FormData()
    form.set("file", file)
    form.set("transporter_id", transporterId)

    const res = await fetch("/api/rate-contracts", { method: "POST", body: form })
    const body = await res.json().catch(() => null)

    setLoading(false)
    if (!res.ok) {
      setError(body?.error?.message ?? "Something went wrong extracting this contract.")
      return
    }

    router.push(`/rate-contracts/${body.rate_contract_id}`)
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="file">Rate contract file</Label>
          <input
            id="file"
            type="file"
            required
            accept=".pdf,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-3.5 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
          />
        </div>
        {loading && (
          <p className="text-sm text-slate-500">
            Reading the contract with Claude — this can take up to a minute for long documents…
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading || !file} className="w-full">
          {loading ? "Extracting…" : "Upload & extract"}
        </Button>
      </form>
    </Card>
  )
}
