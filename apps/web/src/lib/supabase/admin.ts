import "server-only"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { supabaseServiceRoleKey, supabaseUrl } from "./env"

/**
 * Service-role client that bypasses Row-Level Security entirely.
 *
 * Use ONLY for trusted, narrowly-scoped server operations where RLS
 * cannot apply yet (e.g. provisioning a company + users row right after
 * signup, before the caller has a `users` row of their own) or genuine
 * cross-company admin/ops-queue reads (Section 8.7 / FR-22, FR-23).
 * Never expose this client, or data fetched with it, directly to the
 * browser without an explicit authorization check first.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
