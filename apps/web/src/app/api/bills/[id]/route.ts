import { NextResponse } from "next/server"
import { apiErrorResponse, requireUser } from "@/lib/authz"
import { getSignedDocumentUrl } from "@/lib/storage"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { supabase } = await requireUser()

    const { data: bill, error } = await supabase
      .from("bills")
      .select("*, transporters(id, name)")
      .eq("id", id)
      .single()
    if (error) throw error

    const [{ data: tripLines }, { data: auditLog }] = await Promise.all([
      supabase.from("trip_lines").select("*, flags(*)").eq("bill_id", id).order("created_at"),
      supabase
        .from("audit_log")
        .select("*, users(email)")
        .eq("entity_type", "bill")
        .eq("entity_id", id)
        .order("created_at", { ascending: false }),
    ])

    const fileUrl = await getSignedDocumentUrl(supabase, bill.raw_file_url).catch(() => null)

    return NextResponse.json({ bill, trip_lines: tripLines ?? [], file_url: fileUrl, audit_log: auditLog ?? [] })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
