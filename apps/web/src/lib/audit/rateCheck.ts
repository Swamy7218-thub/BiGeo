import { normalizeKey } from "./normalize"
import type { AuditFlag, RateLine, TripLineInput } from "./types"

export function findMatchingRateLine(
  trip: Pick<TripLineInput, "origin" | "destination" | "vehicle_type">,
  rateLines: RateLine[]
): RateLine | undefined {
  if (!trip.origin || !trip.destination || !trip.vehicle_type) return undefined
  const origin = normalizeKey(trip.origin)
  const destination = normalizeKey(trip.destination)
  const vehicleType = normalizeKey(trip.vehicle_type)
  return rateLines.find(
    (rl) =>
      normalizeKey(rl.origin) === origin &&
      normalizeKey(rl.destination) === destination &&
      normalizeKey(rl.vehicle_type) === vehicleType
  )
}

/**
 * FR-8 rate check: compare the billed base amount against the matching
 * rate-master entry. Tolerance is the larger of ₹1 or 1%, so rounding
 * noise doesn't generate flags (Section 41 acceptance criteria).
 *
 * Known MVP limitation: `trip_lines` does not currently capture distance
 * or tonnage, so only `per_trip` rate lines can be verified automatically.
 * `per_km` / `per_ton` lanes are intentionally left unflagged here rather
 * than guessed — see Section 27 "never silently guess."
 */
export function rateCheck(trip: TripLineInput, rateLines: RateLine[]): AuditFlag | null {
  const match = findMatchingRateLine(trip, rateLines)
  if (!match) return null // unknownLaneCheck owns this case
  if (match.rate_basis !== "per_trip") return null

  const claimed = trip.base_amount
  const expected = match.rate
  const tolerance = Math.max(1, Math.abs(expected) * 0.01)

  if (Math.abs(claimed - expected) <= tolerance) return null

  return {
    trip_line_id: trip.id,
    flag_type: "rate_mismatch",
    reason: `Billed ₹${claimed.toLocaleString("en-IN")} vs contracted ₹${expected.toLocaleString(
      "en-IN"
    )} for ${trip.origin} → ${trip.destination} (${trip.vehicle_type}).`,
    expected_amount: expected,
    claimed_amount: claimed,
  }
}
