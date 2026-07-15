import { isCloseToInteger } from "./normalize"
import type { AuditFlag, PodInput, RateLine, TripLineInput } from "./types"

const DETENTION_TYPE_PATTERN = /detention/i

/**
 * FR-10: flags detention/extra charges that exceed contract terms or lack
 * supporting evidence. Checks are applied in order of specificity:
 *
 * 1. `detention_date_mismatch` — a POD exists but its date disagrees with
 *    the billed trip date (Section 28 edge case, distinct from generic
 *    missing-POD).
 * 2. `missing_pod` — no POD at all backs the detention charge.
 * 3. `detention_invalid` — the contract has no detention provision for
 *    this lane, or the charged amount isn't a plausible whole number of
 *    detention days at the contracted per-day rate.
 */
export function detentionCheck(
  trip: TripLineInput,
  rateLine: RateLine | undefined,
  pod: PodInput | undefined
): AuditFlag | null {
  const detentionCharges = trip.extra_charges.filter((c) => DETENTION_TYPE_PATTERN.test(c.type))
  if (detentionCharges.length === 0) return null

  const totalDetention = detentionCharges.reduce((sum, c) => sum + c.amount, 0)
  const claimed = trip.base_amount + totalDetention

  if (pod?.pod_date && trip.trip_date && pod.pod_date !== trip.trip_date) {
    return {
      trip_line_id: trip.id,
      flag_type: "detention_date_mismatch",
      reason: `POD date (${pod.pod_date}) differs from the billed trip date (${trip.trip_date}) for a ₹${totalDetention.toLocaleString(
        "en-IN"
      )} detention charge.`,
      expected_amount: null,
      claimed_amount: claimed,
    }
  }

  if (!pod) {
    return {
      trip_line_id: trip.id,
      flag_type: "missing_pod",
      reason: `Detention charge of ₹${totalDetention.toLocaleString("en-IN")} has no supporting POD.`,
      expected_amount: null,
      claimed_amount: claimed,
    }
  }

  if (!rateLine || (rateLine.detention_rate === 0 && rateLine.detention_free_days === 0)) {
    return {
      trip_line_id: trip.id,
      flag_type: "detention_invalid",
      reason: `Contract has no detention terms for this lane, but ₹${totalDetention.toLocaleString(
        "en-IN"
      )} was charged as detention.`,
      expected_amount: 0,
      claimed_amount: totalDetention,
    }
  }

  if (rateLine.detention_rate > 0) {
    const impliedDays = totalDetention / rateLine.detention_rate
    if (!isCloseToInteger(impliedDays)) {
      return {
        trip_line_id: trip.id,
        flag_type: "detention_invalid",
        reason: `₹${totalDetention.toLocaleString(
          "en-IN"
        )} detention doesn't match the contract's ₹${rateLine.detention_rate}/day rate (${rateLine.detention_free_days} free days).`,
        expected_amount: null,
        claimed_amount: totalDetention,
      }
    }
  }

  return null
}
