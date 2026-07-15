"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button, Card, Input, Label } from "@/components/ui"

function VerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""
  const companyName = searchParams.get("company_name") ?? ""
  const mode = searchParams.get("mode") ?? "login"

  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: "email" })

    if (verifyError) {
      setLoading(false)
      setError(verifyError.message)
      return
    }

    if (mode === "signup") {
      const res = await fetch("/api/auth/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: companyName }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setLoading(false)
        setError(body?.error?.message ?? "Could not set up your company. Please try again.")
        return
      }
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <Card className="w-full max-w-sm p-8">
      <h1 className="text-xl font-semibold text-slate-900">Enter your code</h1>
      <p className="mt-1 text-sm text-slate-500">
        We sent a 6-digit code to <span className="font-medium">{email}</span>.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="token">One-time code</Label>
          <Input
            id="token"
            inputMode="numeric"
            required
            autoFocus
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="123456"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Verifying…" : "Verify & continue"}
        </Button>
      </form>
    </Card>
  )
}

export default function VerifyPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12">
      <Suspense>
        <VerifyForm />
      </Suspense>
    </div>
  )
}
