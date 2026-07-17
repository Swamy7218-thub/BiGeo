import type { TripLine, RateLine, Flag } from '@freightcheck/shared'

const TOLERANCE_AMOUNT = 1     // ₹1 minimum difference
const TOLERANCE_PERCENT = 0.01 // 1% minimum difference

export function rateCheck(
  tripLine: TripLine,
  rateLines: RateLine[],
): Omit<Flag, 'id' | 'updated_at' | 'created_at' | 'updated_by' | 'status'> | null {
  // Find matching rate line: exact origin+destination+vehicle_type
  const match = findRateLine(tripLine, rateLines)

  if (!match) return null // handled by unknown-lane check

  const expected = match.rate // rate_basis normalization would go here for per_km/per_ton
  const claimed = tripLine.base_amount
  const diff = claimed - expected
  const pctDiff = Math.abs(diff) / expected

  if (Math.abs(diff) > TOLERANCE_AMOUNT && pctDiff > TOLERANCE_PERCENT) {
    return {
      trip_line_id: tripLine.id,
      flag_type: 'rate_mismatch',
      expected_amount: expected,
      claimed_amount: claimed,
      description: `${tripLine.origin}→${tripLine.destination} ${tripLine.vehicle_type}: contract rate ₹${expected.toLocaleString('en-IN')} | billed ₹${claimed.toLocaleString('en-IN')} | excess ₹${diff.toLocaleString('en-IN')}`,
    }
  }

  return null
}

function findRateLine(trip: TripLine, lines: RateLine[]): RateLine | null {
  // 1. Exact match
  const exact = lines.find(
    l => normalize(l.origin) === normalize(trip.origin) &&
         normalize(l.destination) === normalize(trip.destination) &&
         normalize(l.vehicle_type) === normalize(trip.vehicle_type)
  )
  if (exact) return exact

  // 2. Fuzzy vehicle type (e.g. "14 ft" vs "14ft")
  return lines.find(
    l => normalize(l.origin) === normalize(trip.origin) &&
         normalize(l.destination) === normalize(trip.destination) &&
         normalizeVehicle(l.vehicle_type) === normalizeVehicle(trip.vehicle_type)
  ) ?? null
}

const normalize = (s: string) => s.trim().toLowerCase()
const normalizeVehicle = (s: string) => s.replace(/\s+/g, '').toLowerCase()
