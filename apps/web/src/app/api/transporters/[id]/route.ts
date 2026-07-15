import { NextResponse } from "next/server"
import { apiErrorResponse, requireUser } from "@/lib/authz"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { supabase } = await requireUser()

    const { data: transporter, error } = await supabase.from("transporters").select("*").eq("id", id).single()
    if (error) throw error

    const [{ data: rateContracts }, { data: bills }] = await Promise.all([
      supabase
        .from("rate_contracts")
        .select("*, rate_lines(*)")
        .eq("transporter_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("bills").select("*").eq("transporter_id", id).order("created_at", { ascending: false }),
    ])

    return NextResponse.json({ transporter, rate_contracts: rateContracts ?? [], bills: bills ?? [] })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
