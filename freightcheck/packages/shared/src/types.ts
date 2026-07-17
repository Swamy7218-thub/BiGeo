// ── Enums ────────────────────────────────────────────────────────────────

export type UserRole = 'clerk' | 'finance_head' | 'admin'
export type BillStatus = 'processing' | 'ready' | 'reviewed'
export type RateBasis = 'per_trip' | 'per_km' | 'per_ton'
export type FlagType = 'rate_mismatch' | 'duplicate' | 'detention_invalid' | 'missing_pod' | 'unknown_lane'
export type FlagStatus = 'open' | 'accepted' | 'waived' | 'disputed'
export type MatchedBy = 'auto' | 'manual'
export type ContractStatus = 'draft' | 'confirmed'

// ── Database entities ─────────────────────────────────────────────────────

export interface Company {
  id: string
  name: string
  industry: string | null
  plan: string
  email_domain: string | null
  created_at: string
}

export interface User {
  id: string
  company_id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
}

export interface Transporter {
  id: string
  company_id: string
  name: string
  gstin: string | null
  email: string | null
  created_at: string
}

export interface RateContract {
  id: string
  transporter_id: string
  raw_file_url: string
  parsed_json: Record<string, unknown> | null
  valid_from: string
  valid_to: string
  status: ContractStatus
  created_at: string
}

export interface RateLine {
  id: string
  contract_id: string
  origin: string
  destination: string
  vehicle_type: string
  rate: number
  rate_basis: RateBasis
  detention_free_days: number
  detention_rate: number
}

export interface Bill {
  id: string
  transporter_id: string
  bill_number: string
  bill_date: string
  raw_file_url: string
  status: BillStatus
  total_claimed: number
  total_approved: number
  total_flagged: number
  created_at: string
}

export interface ExtraCharges {
  detention?: number
  loading?: number
  unloading?: number
  toll?: number
  other?: number
}

export interface TripLine {
  id: string
  bill_id: string
  lr_number: string
  trip_date: string
  origin: string
  destination: string
  vehicle_number: string
  vehicle_type: string
  base_amount: number
  extra_charges_json: ExtraCharges
  extraction_confidence: number
}

export interface Flag {
  id: string
  trip_line_id: string
  flag_type: FlagType
  expected_amount: number | null
  claimed_amount: number | null
  description: string
  status: FlagStatus
  updated_by: string | null
  updated_at: string
}

export interface POD {
  id: string
  trip_line_id: string | null
  file_url: string
  extracted_lr_number: string | null
  matched_by: MatchedBy | null
  created_at: string
}

export interface AuditLog {
  id: string
  company_id: string
  actor_id: string
  entity_type: string
  entity_id: string
  action: string
  before_state: Record<string, unknown> | null
  after_state: Record<string, unknown> | null
  created_at: string
}

// ── API types ─────────────────────────────────────────────────────────────

export interface DashboardSummary {
  total_claimed: number
  total_approved: number
  total_flagged: number
  flag_count: number
  trend: Array<{
    month: string
    claimed: number
    approved: number
    flagged: number
  }>
  top_flag_types: Array<{ type: FlagType; count: number; amount: number }>
}

export interface TransporterScorecard {
  transporter: Transporter
  total_bills: number
  total_claimed: number
  total_flagged: number
  error_rate: number
  top_flag_reasons: Array<{ type: FlagType; count: number }>
  monthly_trend: Array<{ month: string; error_rate: number }>
}

export interface BillWithDetails extends Bill {
  transporter: Transporter
  trip_lines: TripLineWithFlags[]
  flag_summary: { total: number; open: number; accepted: number; waived: number; disputed: number }
}

export interface TripLineWithFlags extends TripLine {
  flags: Flag[]
  pod: POD | null
}

// ── Extraction types ──────────────────────────────────────────────────────

export type FieldConfidence = 'high' | 'medium' | 'low'

export interface ExtractedTripLine {
  lr_number: string
  lr_number_confidence: FieldConfidence
  trip_date: string
  trip_date_confidence: FieldConfidence
  origin: string
  destination: string
  vehicle_number: string
  vehicle_type: string
  base_amount: number
  extra_charges: ExtraCharges
  overall_confidence: number
}

export interface ExtractionResult {
  bill_number: string
  bill_date: string
  transporter_name: string
  total_amount: number
  trips: ExtractedTripLine[]
  arithmetic_check_passed: boolean
  overall_confidence: number
  low_confidence_fields: string[]
}

export interface ExtractedRateLine {
  origin: string
  destination: string
  vehicle_type: string
  rate: number
  rate_basis: RateBasis
  detention_free_days: number
  detention_rate: number
}

export interface RateContractExtractionResult {
  transporter_name: string
  valid_from: string
  valid_to: string
  lanes: ExtractedRateLine[]
  overall_confidence: number
}

// ── Report types ──────────────────────────────────────────────────────────

export interface MonthlyReportSummary {
  period: string
  company_id: string
  total_bills: number
  total_trips: number
  total_claimed: number
  total_approved: number
  total_flagged: number
  total_recovered: number
  by_transporter: Array<{
    transporter: Transporter
    bills: number
    claimed: number
    flagged: number
    error_rate: number
  }>
  by_flag_type: Array<{ type: FlagType; count: number; amount: number }>
}

// ── API request/response ──────────────────────────────────────────────────

export interface ApiError {
  error: { code: string; message: string; field?: string }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}
