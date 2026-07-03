import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = supabaseAdmin();

  const { data: bill, error: billError } = await db
    .from("bills")
    .select("*, transporters(name)")
    .eq("id", id)
    .single();
  if (billError) return NextResponse.json({ error: billError.message }, { status: 404 });

  const { data: tripLines, error: tripError } = await db
    .from("trip_lines")
    .select("*, flags(*)")
    .eq("bill_id", id)
    .order("trip_date", { ascending: true });
  if (tripError) return NextResponse.json({ error: tripError.message }, { status: 500 });

  return NextResponse.json({ bill, trip_lines: tripLines });
}
