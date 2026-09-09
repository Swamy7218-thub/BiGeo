import type { TripLine, Flag } from '@freightcheck/shared'

// Fuzzy date tolerance: same LR + vehicle but date off by ≤1 day = likely duplicate
const DATE_TOLERANCE_MS = 86400000

export function duplicateCheck(
  tripLine: TripLine,
  existingTrips: TripLine[], // all previous trip lines for same transporter
): Omit<Flag, 'id' | 'updated_at' | 'created_at' | 'updated_by' | 'status'> | null {
  if (tripLine.id === undefined) return null

  const candidate = existingTrips.find(t => {
    if (t.id === tripLine.id) return false
    if (normalizeLR(t.lr_number) !== normalizeLR(tripLine.lr_number)) return false
    if (normalize(t.vehicle_number) !== normalize(tripLine.vehicle_number)) return false
    const dateDiff = Math.abs(new Date(t.trip_date).getTime() - new Date(tripLine.trip_date).getTime())
    return dateDiff <= DATE_TOLERANCE_MS
  })

  if (!candidate) return null

  return {
    trip_line_id: tripLine.id,
    flag_type: 'duplicate',
    expected_amount: candidate.base_amount,
    claimed_amount: tripLine.base_amount,
    description: `Duplicate of LR# ${candidate.lr_number} (bill ${candidate.bill_id}). Same transporter, LR, vehicle${candidate.trip_date !== tripLine.trip_date ? ', date off by 1 day' : ', same date'}.`,
  }
}

const normalize = (s: string) => s.trim().toUpperCase().replace(/\s+/g, '')
const normalizeLR = (s: string) => s.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
