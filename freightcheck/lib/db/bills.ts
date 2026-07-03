import { supabaseAdmin } from "@/lib/supabase/server";
import type { BillExtraction } from "@/lib/extraction/schema";
import type { AuditInput, AuditResult, PriorTripRef } from "@/lib/audit/types";

export async function insertBillWithTrips(params: {
  transporterId: string;
  rawFileUrl: string;
  extraction: BillExtraction;
}): Promise<{ billId: string; tripLineIds: string[] }> {
  const db = supabaseAdmin();

  const { data: bill, error: billError } = await db
    .from("bills")
    .insert({
      transporter_id: params.transporterId,
      bill_number: params.extraction.bill_number,
      bill_date: params.extraction.bill_date,
      raw_file_url: params.rawFileUrl,
      status: "processing",
    })
    .select("id")
    .single();
  if (billError) throw billError;

  if (params.extraction.trips.length === 0) {
    return { billId: bill.id, tripLineIds: [] };
  }

  const { data: tripLines, error: tripError } = await db
    .from("trip_lines")
    .insert(
      params.extraction.trips.map((trip) => ({
        bill_id: bill.id,
        lr_number: trip.lr_number,
        trip_date: trip.trip_date,
        origin: trip.origin,
        destination: trip.destination,
        vehicle_number: trip.vehicle_number,
        vehicle_type: trip.vehicle_type,
        base_amount: trip.base_amount,
        extra_charges_json: trip.extra_charges,
        extraction_confidence: trip.extraction_confidence,
      }))
    )
    .select("id");
  if (tripError) throw tripError;

  return { billId: bill.id, tripLineIds: tripLines.map((t) => t.id) };
}

export async function getConfirmedRateLines(transporterId: string): Promise<AuditInput["rateLines"]> {
  const db = supabaseAdmin();
  const { data: contracts, error: contractError } = await db
    .from("rate_contracts")
    .select("id")
    .eq("transporter_id", transporterId)
    .eq("status", "confirmed");
  if (contractError) throw contractError;
  if (!contracts || contracts.length === 0) return [];

  const { data: rateLines, error: rateLineError } = await db
    .from("rate_lines")
    .select("origin, destination, vehicle_type, rate, rate_basis, detention_free_days, detention_rate_per_day, diesel_escalation_clause")
    .in(
      "contract_id",
      contracts.map((c) => c.id)
    );
  if (rateLineError) throw rateLineError;
  return rateLines ?? [];
}

export async function getPriorTrips(
  transporterId: string,
  excludeBillId: string
): Promise<PriorTripRef[]> {
  const db = supabaseAdmin();
  const { data: bills, error: billsError } = await db
    .from("bills")
    .select("id")
    .eq("transporter_id", transporterId)
    .neq("id", excludeBillId);
  if (billsError) throw billsError;
  if (!bills || bills.length === 0) return [];

  const { data: tripLines, error: tripError } = await db
    .from("trip_lines")
    .select("lr_number, vehicle_number, trip_date, destination, bill_id")
    .in(
      "bill_id",
      bills.map((b) => b.id)
    );
  if (tripError) throw tripError;
  return tripLines ?? [];
}

export async function getLrNumbersWithPod(transporterId: string): Promise<Set<string>> {
  const db = supabaseAdmin();
  const { data: bills, error: billsError } = await db
    .from("bills")
    .select("id")
    .eq("transporter_id", transporterId);
  if (billsError) throw billsError;
  if (!bills || bills.length === 0) return new Set();

  const { data: tripLines, error: tripError } = await db
    .from("trip_lines")
    .select("id, lr_number")
    .in(
      "bill_id",
      bills.map((b) => b.id)
    );
  if (tripError) throw tripError;
  if (!tripLines || tripLines.length === 0) return new Set();

  const { data: pods, error: podError } = await db
    .from("pods")
    .select("trip_line_id")
    .in(
      "trip_line_id",
      tripLines.map((t) => t.id)
    );
  if (podError) throw podError;
  const tripLineIdsWithPod = new Set((pods ?? []).map((p) => p.trip_line_id));

  const lrNumbers = new Set<string>();
  for (const trip of tripLines) {
    if (trip.lr_number && tripLineIdsWithPod.has(trip.id)) {
      lrNumbers.add(trip.lr_number.trim().toUpperCase().replace(/\s+/g, ""));
    }
  }
  return lrNumbers;
}

export async function applyAuditResult(params: {
  billId: string;
  tripLineIds: string[];
  result: AuditResult;
}): Promise<void> {
  const db = supabaseAdmin();

  if (params.result.flags.length > 0) {
    const { error: flagError } = await db.from("flags").insert(
      params.result.flags.map((flag) => ({
        trip_line_id: params.tripLineIds[flag.trip_index],
        flag_type: flag.flag_type,
        expected_amount: flag.expected_amount,
        claimed_amount: flag.claimed_amount,
        status: flag.status,
        message: flag.message,
      }))
    );
    if (flagError) throw flagError;
  }

  const { error: billError } = await db
    .from("bills")
    .update({
      status: "audited",
      total_claimed: params.result.total_claimed,
      total_approved: params.result.total_approved,
      total_flagged: params.result.total_flagged,
    })
    .eq("id", params.billId);
  if (billError) throw billError;
}
