import { supabaseAdmin } from "@/lib/supabase/server";

const DEFAULT_COMPANY_NAME = "Default Company";

/**
 * MVP is single-tenant per deployment (see supabase/migrations/0001_init.sql).
 * Every upload belongs to one auto-created company until real auth/onboarding ships.
 */
export async function getOrCreateDefaultCompany(): Promise<string> {
  const db = supabaseAdmin();

  const { data: existing, error: selectError } = await db
    .from("companies")
    .select("id")
    .eq("name", DEFAULT_COMPANY_NAME)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) return existing.id;

  const { data: created, error: insertError } = await db
    .from("companies")
    .insert({ name: DEFAULT_COMPANY_NAME })
    .select("id")
    .single();
  if (insertError) throw insertError;
  return created.id;
}
