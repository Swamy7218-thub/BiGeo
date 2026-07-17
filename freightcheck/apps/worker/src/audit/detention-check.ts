import type { TripLine, RateLine, POD, Flag } from '@freightcheck/shared'

export function detentionCheck(
  tripLine: TripLine,
  rateLine: RateLine | null,
  pod?: POD | null,
): Omit<Flag, 'id' | 'updated_at' | 'created_at' | 'updated_by' | 'status'> | null {
  const charges = tripLine.extra_charges_json as Record<string, number>
  const detentionCharged = charges?.detention ?? 0

  if (detentionCharged === 0) return null // no detention claimed, nothing to check

  // No POD attached at all
  if (!pod) {
    return {
      trip_line_id: tripLine.id,
      flag_type: 'detention_invalid',
      expected_amount: 0,
      claimed_amount: detentionCharged,
      description: `Detention ₹${detentionCharged.toLocaleString('en-IN')} claimed but no POD attached. Cannot verify delivery date or free-day window.`,
    }
  }

  // Contract-based detention check
  if (rateLine) {
    const freeDays = rateLine.detention_free_days
    const ratePerDay = rateLine.detention_rate
    // We don't have gate-in/gate-out timestamps in MVP; flag if charge exceeds max reasonable detention
    const maxReasonableDetention = freeDays * 2 * ratePerDay // more than 2x free days is suspicious
    if (detentionCharged > maxReasonableDetention && maxReasonableDetention > 0) {
      return {
        trip_line_id: tripLine.id,
        flag_type: 'detention_invalid',
        expected_amount: maxReasonableDetention,
        claimed_amount: detentionCharged,
        description: `Detention ₹${detentionCharged.toLocaleString('en-IN')} exceeds maximum expected (${freeDays} free days, ₹${ratePerDay}/day after). Expected max: ₹${maxReasonableDetention.toLocaleString('en-IN')}.`,
      }
    }
  }

  return null
}
