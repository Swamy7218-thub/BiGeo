import { NextResponse } from "next/server";
import { extractRateContract } from "@/lib/extraction/rateContract";
import { prepareSourceDocument } from "@/lib/extraction/prepareDocument";
import { getOrCreateTransporter } from "@/lib/db/transporters";
import { uploadDocument } from "@/lib/db/storage";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("rate_contracts")
    .select("id, status, valid_from, valid_to, created_at, transporters(name)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contracts: data });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const transporterName = form.get("transporter_name");

  if (!(file instanceof File) || typeof transporterName !== "string" || !transporterName.trim()) {
    return NextResponse.json(
      { error: "Provide a rate contract file and transporter_name." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const transporterId = await getOrCreateTransporter(transporterName);

  const rawFileUrl = await uploadDocument(
    `rate-contracts/${transporterId}/${Date.now()}-${file.name}`,
    buffer,
    file.type || "application/octet-stream"
  );

  const doc = await prepareSourceDocument(file.name, buffer);
  const extraction = await extractRateContract(doc);

  const db = supabaseAdmin();
  const { data: contract, error: contractError } = await db
    .from("rate_contracts")
    .insert({
      transporter_id: transporterId,
      raw_file_url: rawFileUrl,
      parsed_json: extraction,
      valid_from: extraction.valid_from,
      valid_to: extraction.valid_to,
      status: "pending_review",
    })
    .select("id")
    .single();
  if (contractError) {
    return NextResponse.json({ error: contractError.message }, { status: 500 });
  }

  if (extraction.rate_lines.length > 0) {
    const { error: rateLineError } = await db.from("rate_lines").insert(
      extraction.rate_lines.map((line) => ({
        contract_id: contract.id,
        origin: line.origin,
        destination: line.destination,
        vehicle_type: line.vehicle_type,
        rate: line.rate,
        rate_basis: line.rate_basis,
        detention_free_days: line.detention_free_days,
        detention_rate_per_day: line.detention_rate_per_day,
        diesel_escalation_clause: line.diesel_escalation_clause,
      }))
    );
    if (rateLineError) {
      return NextResponse.json({ error: rateLineError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    contract_id: contract.id,
    transporter_id: transporterId,
    extraction,
  });
}
