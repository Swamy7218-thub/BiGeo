"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button, Card, Input, Label } from "@/components/ui"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { data: { company_name: companyName }, shouldCreateUser: true },
    })

    setLoading(false)
    if (otpError) {
      setError(otpError.message)
      return
    }

    const params = new URLSearchParams({ email, company_name: companyName, mode: "signup" })
    router.push(`/verify?${params.toString()}`)
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-sm p-8">
        <h1 className="text-xl font-semibold text-slate-900">Start your free audit</h1>
        <p className="mt-1 text-sm text-slate-500">
          No password — we&apos;ll email you a one-time code (FR-1).
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="company_name">Company name</Label>
            <Input
              id="company_name"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Pharma Distributors"
            />
          </div>
          <div>
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending code…" : "Send me a code"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-slate-900 underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  )
}
