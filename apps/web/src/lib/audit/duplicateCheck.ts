import { daysBetween, normalizeKey } from "./normalize"
import type { AuditFlag, TripLineInput } from "./types"

const NEAR_DUPLICATE_DAY_TOLERANCE = 3
const AMOUNT_TOLERANCE = 0.01

/**
 * FR-9 duplicate check: flags a trip whose (LR number, vehicle number,
 * date, amount) matches another trip already on file for the SAME
 * transporter (never scoped globally — Section 28: two different
 * transporters can legitimately reuse LR numbers). Includes fuzzy
 * tolerance for a clerical date shift of a few days on an otherwise
 * identical line.
 *
 * `otherTrips` must already be scoped to the same transporter and should
 * exclude `trip` itself.
 */
export function duplicateCheck(trip: TripLineInput, otherTrips: TripLineInput[]): AuditFlag | null {
  if (!trip.lr_number) return null // nothing to key off of

  const lr = normalizeKey(trip.lr_number)
  const vehicle = normalizeKey(trip.vehicle_number)

  for (const other of otherTrips) {
    if (other.id === trip.id || other.bill_id === trip.bill_id) continue
    if (normalizeKey(other.lr_number) !== lr) continue

    const sameVehicle = normalizeKey(other.vehicle_number) === vehicle
    const sameAmount = Math.abs(other.base_amount - trip.base_amount) <= AMOUNT_TOLERANCE
    if (!sameVehicle || !sameAmount) continue

    const sameDate = !!trip.trip_date && !!other.trip_date && trip.trip_date === other.trip_date
    const nearDate =
      !sameDate &&
      !!trip.trip_date &&
      !!other.trip_date &&
      Math.abs(daysBetween(trip.trip_date, other.trip_date)) <= NEAR_DUPLICATE_DAY_TOLERANCE

    if (sameDate || nearDate) {
      const sourceBill = other.bill_number ?? other.bill_id
      return {
        trip_line_id: trip.id,
        flag_type: "duplicate",
        reason: sameDate
          ? `Duplicate of LR ${trip.lr_number} already billed on ${sourceBill}.`
          : `Likely duplicate of LR ${trip.lr_number} on ${sourceBill} — same vehicle and amount, date shifted by a few days.`,
        expected_amount: 0,
        claimed_amount: trip.base_amount,
        related_bill_id: other.bill_id,
      }
    }
  }

  return null
}
