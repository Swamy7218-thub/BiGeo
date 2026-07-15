"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button, Card, Input, Label } from "@/components/ui"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })

    setLoading(false)
    if (otpError) {
      setError(otpError.message)
      return
    }

    const params = new URLSearchParams({ email, mode: "login" })
    router.push(`/verify?${params.toString()}`)
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-sm p-8">
        <h1 className="text-xl font-semibold text-slate-900">Log in to FreightCheck</h1>
        <p className="mt-1 text-sm text-slate-500">We&apos;ll email you a one-time code.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
          New here?{" "}
          <Link href="/signup" className="font-medium text-slate-900 underline">
            Start a free audit
          </Link>
        </p>
      </Card>
    </div>
  )
}
