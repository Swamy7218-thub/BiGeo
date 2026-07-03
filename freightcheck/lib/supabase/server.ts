import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serviceClient: SupabaseClient | null = null;

/**
 * Server-only client using the service role key. Used by API routes to read
 * and write across companies — there is no per-request user session yet
 * (MVP is single-tenant per deployment; see supabase/migrations/0001_init.sql).
 * Never import this from a client component.
 */
export function supabaseAdmin(): SupabaseClient {
  if (!serviceClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.example)."
      );
    }
    serviceClient = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return serviceClient;
}
