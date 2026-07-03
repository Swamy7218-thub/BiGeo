import { NextResponse } from "next/server";
import { extractBillTrips } from "@/lib/extraction/bill";
import { prepareSourceDocument } from "@/lib/extraction/prepareDocument";
import { getOrCreateTransporter } from "@/lib/db/transporters";
import { uploadDocument } from "@/lib/db/storage";
import {
  applyAuditResult,
  getConfirmedRateLines,
  getLrNumbersWithPod,
  getPriorTrips,
  insertBillWithTrips,
} from "@/lib/db/bills";
import { runAudit } from "@/lib/audit/engine";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("bills")
    .select("id, bill_number, bill_date, status, total_claimed, total_approved, total_flagged, created_at, transporters(name)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bills: data });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const transporterName = form.get("transporter_name");

  if (!(file instanceof File) || typeof transporterName !== "string" || !transporterName.trim()) {
    return NextResponse.json(
      { error: "Provide a bill file and transporter_name." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const transporterId = await getOrCreateTransporter(transporterName);

  const rawFileUrl = await uploadDocument(
    `bills/${transporterId}/${Date.now()}-${file.name}`,
    buffer,
    file.type || "application/octet-stream"
  );

  const doc = await prepareSourceDocument(file.name, buffer);
  const extraction = await extractBillTrips(doc);

  const { billId, tripLineIds } = await insertBillWithTrips({
    transporterId,
    rawFileUrl,
    extraction,
  });

  const [rateLines, priorTrips, lrNumbersWithPod] = await Promise.all([
    getConfirmedRateLines(transporterId),
    getPriorTrips(transporterId, billId),
    getLrNumbersWithPod(transporterId),
  ]);

  const result = runAudit({
    trips: extraction.trips,
    rateLines,
    priorTrips,
    lrNumbersWithPod,
  });

  await applyAuditResult({ billId, tripLineIds, result });

  return NextResponse.json({
    bill_id: billId,
    extraction,
    audit: result,
    rate_lines_used: rateLines.length,
  });
}
