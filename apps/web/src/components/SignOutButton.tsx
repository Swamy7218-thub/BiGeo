"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui"

export function SignOutButton() {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      onClick={async () => {
        await createClient().auth.signOut()
        router.push("/login")
        router.refresh()
      }}
    >
      Sign out
    </Button>
  )
}
