import { NextResponse } from "next/server";
import { uploadDocument } from "@/lib/db/storage";
import { supabaseAdmin } from "@/lib/supabase/server";

// One POD per request; the dashboard loops over a bulk photo upload and
// calls this once per file so each can be matched to its LR number independently.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: billId } = await params;
  const form = await request.formData();
  const file = form.get("file");
  const lrNumber = form.get("lr_number");

  if (!(file instanceof File) || typeof lrNumber !== "string" || !lrNumber.trim()) {
    return NextResponse.json({ error: "Provide a POD file and lr_number." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileUrl = await uploadDocument(
    `pods/${billId}/${Date.now()}-${file.name}`,
    buffer,
    file.type || "application/octet-stream"
  );

  const db = supabaseAdmin();
  const normalizedLr = lrNumber.trim().toUpperCase().replace(/\s+/g, "");

  const { data: tripLine, error: tripError } = await db
    .from("trip_lines")
    .select("id")
    .eq("bill_id", billId)
    .ilike("lr_number", normalizedLr)
    .maybeSingle();
  if (tripError) return NextResponse.json({ error: tripError.message }, { status: 500 });

  const { error: podError } = await db.from("pods").insert({
    trip_line_id: tripLine?.id ?? null,
    file_url: fileUrl,
    matched_by: tripLine ? "lr_number" : null,
  });
  if (podError) return NextResponse.json({ error: podError.message }, { status: 500 });

  if (tripLine) {
    const { error: flagUpdateError } = await db
      .from("flags")
      .update({ status: "waived" })
      .eq("trip_line_id", tripLine.id)
      .eq("flag_type", "missing_pod")
      .eq("status", "open");
    if (flagUpdateError) return NextResponse.json({ error: flagUpdateError.message }, { status: 500 });
  }

  return NextResponse.json({ matched: Boolean(tripLine), trip_line_id: tripLine?.id ?? null });
}
