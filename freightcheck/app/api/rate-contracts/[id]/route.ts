import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = supabaseAdmin();

  const { data: contract, error: contractError } = await db
    .from("rate_contracts")
    .select("*, transporters(name)")
    .eq("id", id)
    .single();
  if (contractError) return NextResponse.json({ error: contractError.message }, { status: 404 });

  const { data: rateLines, error: rateLineError } = await db
    .from("rate_lines")
    .select("*")
    .eq("contract_id", id);
  if (rateLineError) return NextResponse.json({ error: rateLineError.message }, { status: 500 });

  return NextResponse.json({ contract, rate_lines: rateLines });
}
