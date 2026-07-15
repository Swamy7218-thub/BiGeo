import { NextResponse } from "next/server"
import { apiErrorResponse, requireUser } from "@/lib/authz"
import { getSignedDocumentUrl } from "@/lib/storage"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { supabase } = await requireUser()

    const { data: contract, error } = await supabase
      .from("rate_contracts")
      .select("*, rate_lines(*), transporters(id, name)")
      .eq("id", id)
      .single()
    if (error) throw error

    const fileUrl = await getSignedDocumentUrl(supabase, contract.raw_file_url).catch(() => null)

    return NextResponse.json({ rate_contract: contract, file_url: fileUrl })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
