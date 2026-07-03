import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

type FlagRow = {
  flag_type: string;
  expected_amount: number | null;
  claimed_amount: number | null;
  status: string;
  message: string | null;
};

type TripLineRow = {
  lr_number: string | null;
  trip_date: string | null;
  origin: string;
  destination: string;
  vehicle_number: string | null;
  vehicle_type: string | null;
  base_amount: number;
  extra_charges_json: unknown;
  flags: FlagRow[];
};

// The audit report an ops person hands to their finance team, or sends to
// the transporter as the basis for a dispute — this Excel file is the deliverable.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = supabaseAdmin();

  const { data: bill, error: billError } = await db
    .from("bills")
    .select("bill_number, bill_date, total_claimed, total_approved, total_flagged, transporters(name)")
    .eq("id", id)
    .single<{
      bill_number: string | null;
      bill_date: string | null;
      total_claimed: number;
      total_approved: number;
      total_flagged: number;
      transporters: { name: string } | null;
    }>();
  if (billError) return NextResponse.json({ error: billError.message }, { status: 404 });

  const { data: tripLines, error: tripError } = await db
    .from("trip_lines")
    .select("lr_number, trip_date, origin, destination, vehicle_number, vehicle_type, base_amount, extra_charges_json, flags(flag_type, expected_amount, claimed_amount, status, message)")
    .eq("bill_id", id)
    .order("trip_date", { ascending: true });
  if (tripError) return NextResponse.json({ error: tripError.message }, { status: 500 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Audit Report");

  sheet.addRow([`Transporter: ${bill.transporters?.name ?? "-"}`]);
  sheet.addRow([`Bill: ${bill.bill_number ?? "-"} (${bill.bill_date ?? "-"})`]);
  sheet.addRow([
    `Claimed: ₹${bill.total_claimed}`,
    `Approved: ₹${bill.total_approved}`,
    `Flagged: ₹${bill.total_flagged}`,
  ]);
  sheet.addRow([]);

  sheet.addRow([
    "LR Number",
    "Trip Date",
    "Origin",
    "Destination",
    "Vehicle Number",
    "Vehicle Type",
    "Base Amount",
    "Extra Charges",
    "Flags",
  ]).font = { bold: true };

  for (const trip of (tripLines ?? []) as TripLineRow[]) {
    const flagSummary = trip.flags
      .map((f) => `${f.flag_type} (${f.status}): ${f.message ?? ""}`)
      .join(" | ");
    sheet.addRow([
      trip.lr_number ?? "",
      trip.trip_date ?? "",
      trip.origin,
      trip.destination,
      trip.vehicle_number ?? "",
      trip.vehicle_type ?? "",
      trip.base_amount,
      JSON.stringify(trip.extra_charges_json ?? []),
      flagSummary,
    ]);
  }

  sheet.columns.forEach((col) => (col.width = 20));

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="audit-report-${bill.bill_number ?? id}.xlsx"`,
    },
  });
}
