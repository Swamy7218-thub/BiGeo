import type { TripLine, RateLine, Flag } from '@freightcheck/shared'

export function unknownLaneCheck(
  tripLine: TripLine,
  rateLines: RateLine[],
): Omit<Flag, 'id' | 'updated_at' | 'created_at' | 'updated_by' | 'status'> | null {
  const match = rateLines.find(
    l => normalize(l.origin) === normalize(tripLine.origin) &&
         normalize(l.destination) === normalize(tripLine.destination)
  )

  if (match) return null // lane exists in contract

  return {
    trip_line_id: tripLine.id,
    flag_type: 'unknown_lane',
    expected_amount: 0,
    claimed_amount: tripLine.base_amount,
    description: `Lane ${tripLine.origin}→${tripLine.destination} not in any active rate contract for this transporter. Manual approval required.`,
  }
}

const normalize = (s: string) => s.trim().toLowerCase()
