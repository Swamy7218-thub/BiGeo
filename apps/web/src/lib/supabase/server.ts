import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"
import { supabaseAnonKey, supabaseUrl } from "./env"

/**
 * Server-side Supabase client bound to the current request's session.
 * All queries go through Postgres RLS as the signed-in user.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // setAll is called from a Server Component where cookies can't be
          // written; the middleware refresh path handles session renewal.
        }
      },
    },
  })
}
