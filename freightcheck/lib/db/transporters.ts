import { supabaseAdmin } from "@/lib/supabase/server";
import { getOrCreateDefaultCompany } from "./companies";

export async function getOrCreateTransporter(name: string): Promise<string> {
  const db = supabaseAdmin();
  const companyId = await getOrCreateDefaultCompany();
  const trimmedName = name.trim();

  const { data: existing, error: selectError } = await db
    .from("transporters")
    .select("id")
    .eq("company_id", companyId)
    .ilike("name", trimmedName)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) return existing.id;

  const { data: created, error: insertError } = await db
    .from("transporters")
    .insert({ company_id: companyId, name: trimmedName })
    .select("id")
    .single();
  if (insertError) throw insertError;
  return created.id;
}
