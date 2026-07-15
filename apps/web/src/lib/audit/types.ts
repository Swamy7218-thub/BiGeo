export type RateBasis = "per_trip" | "per_km" | "per_ton"

export interface RateLine {
  id: string
  origin: string
  destination: string
  vehicle_type: string
  rate: number
  rate_basis: RateBasis
  detention_free_days: number
  detention_rate: number
}

export interface ExtraCharge {
  type: string
  amount: number
}

export interface TripLineInput {
  id: string
  bill_id: string
  bill_number?: string | null
  lr_number: string | null
  trip_date: string | null // ISO date YYYY-MM-DD
  origin: string | null
  destination: string | null
  vehicle_number: string | null
  vehicle_type: string | null
  base_amount: number
  extra_charges: ExtraCharge[]
}

export interface PodInput {
  trip_line_id: string
  pod_date: string | null
}

export type FlagType =
  | "rate_mismatch"
  | "duplicate"
  | "detention_invalid"
  | "missing_pod"
  | "unknown_lane"
  | "detention_date_mismatch"
  | "no_active_contract"

export type FlagStatus = "open" | "accepted" | "waived" | "disputed"

export interface AuditFlag {
  trip_line_id: string
  flag_type: FlagType
  reason: string
  expected_amount: number | null
  claimed_amount: number | null
  related_bill_id?: string | null
}

/** Total value the trip line carries, used for bill totals and "amount at risk". */
export function tripLineTotal(trip: TripLineInput): number {
  const extras = trip.extra_charges.reduce((sum, c) => sum + c.amount, 0)
  return trip.base_amount + extras
}
