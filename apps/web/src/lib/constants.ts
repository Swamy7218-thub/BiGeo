export const APP_NAME = 'FreightCheck'
export const APP_TAGLINE = 'AI-Native Freight Bill Audit'

export const FLAG_TYPES = ['rate_mismatch', 'duplicate', 'detention_invalid', 'missing_pod', 'unknown_lane'] as const
export const BILL_STATUSES = ['uploaded', 'processing', 'audited', 'needs_review', 'approved', 'failed'] as const

export const PLANS = {
  starter: { name: 'Starter', bills: 50, price: 999 },
  growth: { name: 'Growth', bills: 500, price: 3999 },
  enterprise: { name: 'Enterprise', bills: Infinity, price: 0 },
} as const

export const MAX_FILE_SIZE_MB = 10
export const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.9,
  MEDIUM: 0.75,
  LOW: 0,
} as const
