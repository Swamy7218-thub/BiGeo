import { findMatchingRateLine } from "./rateCheck"
import type { AuditFlag, RateLine, TripLineInput } from "./types"

/**
 * FR-11: a trip whose origin-destination-vehicle_type has no rate-master
 * entry is routed for manual pricing — never silently approved or
 * silently rejected (Section 28 edge case).
 */
export function unknownLaneCheck(trip: TripLineInput, rateLines: RateLine[]): AuditFlag | null {
  if (!trip.origin || !trip.destination || !trip.vehicle_type) {
    return {
      trip_line_id: trip.id,
      flag_type: "unknown_lane",
      reason: "Trip is missing origin, destination, or vehicle type and cannot be priced automatically.",
      expected_amount: null,
      claimed_amount: trip.base_amount,
    }
  }

  const match = findMatchingRateLine(trip, rateLines)
  if (match) return null

  return {
    trip_line_id: trip.id,
    flag_type: "unknown_lane",
    reason: `No rate contract entry for ${trip.origin} → ${trip.destination} (${trip.vehicle_type}). Needs manual pricing.`,
    expected_amount: null,
    claimed_amount: trip.base_amount,
  }
}
