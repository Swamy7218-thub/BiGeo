import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

export const DOCUMENTS_BUCKET = "documents"
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024 // 25MB (Section 27 client/server validation)

/** Storage object path convention: {company_id}/{category}/{transporter_id}/{uuid}-{filename} — see storage RLS policies. */
export function documentPath(companyId: string, category: string, transporterId: string, filename: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9_.-]/g, "_")
  return `${companyId}/${category}/${transporterId}/${crypto.randomUUID()}-${safeName}`
}

export async function uploadDocument(
  supabase: SupabaseClient<Database>,
  path: string,
  file: File
): Promise<void> {
  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error
}

export async function getSignedDocumentUrl(
  supabase: SupabaseClient<Database>,
  path: string,
  expiresInSeconds = 3600
): Promise<string> {
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(path, expiresInSeconds)
  if (error || !data) throw error ?? new Error("Failed to sign document URL")
  return data.signedUrl
}
