import { resolveActiveContract, type RateContractWindow } from "./activeContract"
import { detentionCheck } from "./detentionCheck"
import { duplicateCheck } from "./duplicateCheck"
import { rateCheck } from "./rateCheck"
import { tripLineTotal, type AuditFlag, type PodInput, type TripLineInput } from "./types"
import { unknownLaneCheck } from "./unknownLaneCheck"

export interface RunAuditInput {
  /** Trip lines on the bill currently being audited. */
  tripLines: TripLineInput[]
  /** All other trip lines ever billed by this transporter, for duplicate detection (Section 28: scoped per transporter). */
  otherTransporterTripLines: TripLineInput[]
  /** Every rate contract (draft and confirmed) on file for this transporter. */
  rateContracts: RateContractWindow[]
  /** PODs already matched to any of this bill's trip lines. */
  pods: PodInput[]
}

export interface BillTotals {
  total_claimed: number
  total_flagged: number
  total_approved: number
}

/**
 * Runs every deterministic audit rule (FR-8 to FR-11) over one bill's trip
 * lines and returns the flags that should exist. Pure function — no I/O —
 * so it can be exercised directly in unit tests (Section 32).
 */
export function runAuditForBill(input: RunAuditInput): AuditFlag[] {
  const flags: AuditFlag[] = []
  const podByTripLine = new Map(input.pods.map((p) => [p.trip_line_id, p]))

  for (const trip of input.tripLines) {
    const { activeContract } = resolveActiveContract(input.rateContracts, trip.trip_date)

    if (!activeContract) {
      flags.push({
        trip_line_id: trip.id,
        flag_type: "no_active_contract",
        reason: trip.trip_date
          ? `No confirmed rate contract covers ${trip.trip_date}. Bill priced against a stale or missing rate table.`
          : "No confirmed rate contract on file for this transporter.",
        expected_amount: null,
        claimed_amount: tripLineTotal(trip),
      })
    } else {
      const rateFlag = rateCheck(trip, activeContract.rate_lines)
      if (rateFlag) flags.push(rateFlag)

      const laneFlag = unknownLaneCheck(trip, activeContract.rate_lines)
      if (laneFlag) flags.push(laneFlag)

      const rateLine = activeContract.rate_lines.find(
        (rl) =>
          rl.origin.trim().toLowerCase() === (trip.origin ?? "").trim().toLowerCase() &&
          rl.destination.trim().toLowerCase() === (trip.destination ?? "").trim().toLowerCase() &&
          rl.vehicle_type.trim().toLowerCase() === (trip.vehicle_type ?? "").trim().toLowerCase()
      )
      const detentionFlag = detentionCheck(trip, rateLine, podByTripLine.get(trip.id))
      if (detentionFlag) flags.push(detentionFlag)
    }

    const dupFlag = duplicateCheck(trip, input.otherTransporterTripLines)
    if (dupFlag) flags.push(dupFlag)
  }

  return flags
}

/**
 * Computes bill-level totals from trip lines and currently-open flags.
 * "Amount at risk" per trip line is capped once even if multiple flags
 * land on the same line, so totals never double-count.
 */
export function calcBillTotals(tripLines: TripLineInput[], openFlags: AuditFlag[]): BillTotals {
  const totalClaimed = tripLines.reduce((sum, t) => sum + tripLineTotal(t), 0)

  const atRiskByTripLine = new Map<string, number>()
  for (const flag of openFlags) {
    const trip = tripLines.find((t) => t.id === flag.trip_line_id)
    if (!trip) continue
    const atRisk =
      flag.flag_type === "rate_mismatch" && flag.expected_amount != null && flag.claimed_amount != null
        ? Math.abs(flag.claimed_amount - flag.expected_amount)
        : (flag.claimed_amount ?? tripLineTotal(trip))
    const existing = atRiskByTripLine.get(flag.trip_line_id) ?? 0
    atRiskByTripLine.set(flag.trip_line_id, Math.max(existing, atRisk))
  }

  const totalFlagged = [...atRiskByTripLine.values()].reduce((sum, v) => sum + v, 0)

  return {
    total_claimed: totalClaimed,
    total_flagged: totalFlagged,
    total_approved: totalClaimed - totalFlagged,
  }
}
