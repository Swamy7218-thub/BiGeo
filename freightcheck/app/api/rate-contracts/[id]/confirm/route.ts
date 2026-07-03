import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLineSchema } from "@/lib/extraction/schema";
import { supabaseAdmin } from "@/lib/supabase/server";

const bodySchema = z.object({ rate_lines: z.array(rateLineSchema) });

// One-time human confirmation of the parsed rate master (MVP build item #1):
// the clerk reviews and corrects the AI's extraction once per contract, then
// this becomes the source of truth every future bill is audited against.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contractId } = await params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const db = supabaseAdmin();

  const { error: deleteError } = await db.from("rate_lines").delete().eq("contract_id", contractId);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  if (parsed.data.rate_lines.length > 0) {
    const { error: insertError } = await db.from("rate_lines").insert(
      parsed.data.rate_lines.map((line) => ({ contract_id: contractId, ...line }))
    );
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { error: updateError } = await db
    .from("rate_contracts")
    .update({ status: "confirmed" })
    .eq("id", contractId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ contract_id: contractId, status: "confirmed" });
}
