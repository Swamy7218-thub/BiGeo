import "server-only"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"

export class ApiError extends Error {
  status: number
  code: string
  field?: string

  constructor(status: number, code: string, message: string, field?: string) {
    super(message)
    this.status = status
    this.code = code
    this.field = field
  }
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, field: error.field } },
      { status: error.status }
    )
  }
  console.error(error)
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } },
    { status: 500 }
  )
}

export type AuthContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  authUserId: string
  user: Tables<"users">
}

/**
 * Resolves the signed-in user's `users` row (company_id + role). Throws a
 * 401 if unauthenticated, or 403 if the auth user has no company yet
 * (onboarding incomplete — see /api/auth/bootstrap).
 */
export async function requireUser(): Promise<AuthContext> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    throw new ApiError(401, "UNAUTHENTICATED", "Sign in required.")
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single()

  if (error || !user) {
    throw new ApiError(403, "ONBOARDING_INCOMPLETE", "Company profile not set up yet.")
  }

  return { supabase, authUserId: authUser.id, user }
}

export function requireRole(ctx: AuthContext, ...roles: Array<Tables<"users">["role"]>) {
  if (!roles.includes(ctx.user.role)) {
    throw new ApiError(403, "FORBIDDEN", `Requires role: ${roles.join(" or ")}.`)
  }
}
