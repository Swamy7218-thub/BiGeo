import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, Json } from "@/types/database"

export async function recordAuditLog(
  supabase: SupabaseClient<Database>,
  entry: {
    companyId: string
    actorId: string | null
    entityType: string
    entityId: string
    action: string
    before?: Json | null
    after?: Json | null
  }
) {
  const { error } = await supabase.from("audit_log").insert({
    company_id: entry.companyId,
    actor_id: entry.actorId,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    action: entry.action,
    before_state: entry.before ?? null,
    after_state: entry.after ?? null,
  })
  if (error) {
    console.error("Failed to write audit_log entry", error)
  }
}
