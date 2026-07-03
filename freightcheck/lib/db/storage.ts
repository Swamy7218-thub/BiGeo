import { supabaseAdmin } from "@/lib/supabase/server";

const BUCKET = "documents";

/**
 * Requires a private "documents" bucket to exist in Supabase Storage —
 * create it once from the dashboard or `supabase storage create documents`.
 */
export async function uploadDocument(
  path: string,
  data: Buffer,
  contentType: string
): Promise<string> {
  const db = supabaseAdmin();
  const { error } = await db.storage.from(BUCKET).upload(path, data, {
    contentType,
    upsert: false,
  });
  if (error) throw error;

  const { data: signed, error: signError } = await db.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signError) throw signError;
  return signed.signedUrl;
}
