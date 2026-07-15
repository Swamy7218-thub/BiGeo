import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { calcBillTotals, runAuditForBill } from "./runAudit"
import type { RateContractWindow } from "./activeContract"
import type { AuditFlag, ExtraCharge, PodInput, TripLineInput } from "./types"

/**
 * Runs the deterministic audit engine (FR-8–FR-11) over a bill's trip
 * lines, persists the resulting flags, and updates the bill's totals.
 * Called once, synchronously, right after a bill's trip lines are
 * inserted (Section 15.3: audit decisions are deterministic, never AI).
 */
export async function auditAndPersistBill(
  supabase: SupabaseClient<Database>,
  companyId: string,
  transporterId: string,
  billId: string
) {
  const [{ data: tripLineRows }, { data: contractRows }, { data: otherBillRows }] = await Promise.all([
    supabase.from("trip_lines").select("*").eq("bill_id", billId),
    supabase
      .from("rate_contracts")
      .select("*, rate_lines(*)")
      .eq("transporter_id", transporterId),
    supabase.from("bills").select("id, bill_number").eq("transporter_id", transporterId).neq("id", billId),
  ])

  const tripLines: TripLineInput[] = (tripLineRows ?? []).map(toTripLineInput)

  const otherBillIds = (otherBillRows ?? []).map((b) => b.id)
  const billNumberById = new Map((otherBillRows ?? []).map((b) => [b.id, b.bill_number]))
  const { data: otherTripLineRows } =
    otherBillIds.length > 0
      ? await supabase.from("trip_lines").select("*").in("bill_id", otherBillIds)
      : { data: [] as Database["public"]["Tables"]["trip_lines"]["Row"][] }

  const otherTransporterTripLines: TripLineInput[] = (otherTripLineRows ?? []).map((row) => ({
    ...toTripLineInput(row),
    bill_number: billNumberById.get(row.bill_id) ?? null,
  }))

  const rateContracts: RateContractWindow[] = (contractRows ?? []).map((c) => ({
    id: c.id,
    valid_from: c.valid_from,
    valid_to: c.valid_to,
    status: c.status as "draft" | "confirmed",
    rate_lines: (c as unknown as { rate_lines: Database["public"]["Tables"]["rate_lines"]["Row"][] }).rate_lines.map(
      (rl) => ({
        id: rl.id,
        origin: rl.origin,
        destination: rl.destination,
        vehicle_type: rl.vehicle_type,
        rate: rl.rate,
        rate_basis: rl.rate_basis as "per_trip" | "per_km" | "per_ton",
        detention_free_days: rl.detention_free_days,
        detention_rate: rl.detention_rate,
      })
    ),
  }))

  const tripLineIds = tripLines.map((t) => t.id)
  const { data: podRows } =
    tripLineIds.length > 0
      ? await supabase.from("pods").select("trip_line_id, pod_date").in("trip_line_id", tripLineIds)
      : { data: [] as { trip_line_id: string | null; pod_date: string | null }[] }
  const pods: PodInput[] = (podRows ?? [])
    .filter((p): p is { trip_line_id: string; pod_date: string | null } => p.trip_line_id != null)
    .map((p) => ({ trip_line_id: p.trip_line_id, pod_date: p.pod_date }))

  const flags = runAuditForBill({ tripLines, otherTransporterTripLines, rateContracts, pods })

  if (flags.length > 0) {
    const { error: flagsError } = await supabase.from("flags").insert(
      flags.map((f) => ({
        trip_line_id: f.trip_line_id,
        flag_type: f.flag_type,
        reason: f.reason,
        expected_amount: f.expected_amount,
        claimed_amount: f.claimed_amount,
        related_bill_id: f.related_bill_id ?? null,
        status: "open" as const,
      }))
    )
    if (flagsError) throw flagsError
  }

  const totals = calcBillTotals(tripLines, flags)

  const { error: billUpdateError } = await supabase
    .from("bills")
    .update({
      status: "ready",
      total_claimed: totals.total_claimed,
      total_flagged: totals.total_flagged,
      total_approved: totals.total_approved,
    })
    .eq("id", billId)
  if (billUpdateError) throw billUpdateError

  return { flagCount: flags.length, totals }
}

/**
 * Recomputes bill totals from current trip lines and currently-OPEN
 * flags. Called after a flag's status changes (FR-12: Accept / Waive /
 * Dispute), since accepting or waiving a flag moves its amount from
 * "flagged" back into "approved."
 */
export async function recalcBillTotals(supabase: SupabaseClient<Database>, billId: string) {
  const [{ data: tripLineRows }, { data: openFlagRows }] = await Promise.all([
    supabase.from("trip_lines").select("*").eq("bill_id", billId),
    supabase.from("flags").select("*, trip_lines!inner(bill_id)").eq("trip_lines.bill_id", billId).eq("status", "open"),
  ])

  const tripLines = (tripLineRows ?? []).map(toTripLineInput)
  const openFlags: AuditFlag[] = (openFlagRows ?? []).map((f) => ({
    trip_line_id: f.trip_line_id,
    flag_type: f.flag_type as AuditFlag["flag_type"],
    reason: f.reason,
    expected_amount: f.expected_amount,
    claimed_amount: f.claimed_amount,
    related_bill_id: f.related_bill_id,
  }))

  const totals = calcBillTotals(tripLines, openFlags)

  const { error } = await supabase
    .from("bills")
    .update({
      total_claimed: totals.total_claimed,
      total_flagged: totals.total_flagged,
      total_approved: totals.total_approved,
    })
    .eq("id", billId)
  if (error) throw error

  return totals
}

function toTripLineInput(row: Database["public"]["Tables"]["trip_lines"]["Row"]): TripLineInput {
  return {
    id: row.id,
    bill_id: row.bill_id,
    lr_number: row.lr_number,
    trip_date: row.trip_date,
    origin: row.origin,
    destination: row.destination,
    vehicle_number: row.vehicle_number,
    vehicle_type: row.vehicle_type,
    base_amount: row.base_amount,
    extra_charges: (row.extra_charges_json as unknown as ExtraCharge[]) ?? [],
  }
}
