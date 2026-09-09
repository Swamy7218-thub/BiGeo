import { describe, it, expect } from 'vitest'
import { rateCheck } from '../rate-check'
import type { TripLine, RateLine } from '@freightcheck/shared'

const baseTrip: TripLine = {
  id: 'trip-1',
  bill_id: 'bill-1',
  company_id: 'co-1',
  lr_number: 'VRL001',
  lr_number_confidence: 'high',
  trip_date: '2025-06-01',
  trip_date_confidence: 'high',
  origin: 'Mumbai',
  destination: 'Pune',
  vehicle_number: 'MH01AB1234',
  vehicle_type: '14ft',
  base_amount: 14200,
  extra_charges_json: {},
  overall_confidence: 0.95,
  status: 'pending',
  created_at: '2025-06-01T00:00:00Z',
  updated_at: '2025-06-01T00:00:00Z',
}

const baseRate: RateLine = {
  id: 'rate-1',
  contract_id: 'contract-1',
  origin: 'Mumbai',
  destination: 'Pune',
  vehicle_type: '14ft',
  rate: 12500,
  rate_basis: 'per_trip',
  detention_free_days: 2,
  detention_rate: 500,
}

describe('rateCheck', () => {
  it('returns null when no rate mismatch', () => {
    expect(rateCheck({ ...baseTrip, base_amount: 12500 }, [baseRate])).toBeNull()
  })

  it('flags when amount exceeds contract rate beyond tolerance', () => {
    const flag = rateCheck(baseTrip, [baseRate])
    expect(flag).not.toBeNull()
    expect(flag?.flag_type).toBe('rate_mismatch')
    expect(flag?.expected_amount).toBe(12500)
    expect(flag?.claimed_amount).toBe(14200)
  })

  it('returns null when no matching rate line', () => {
    expect(rateCheck(baseTrip, [])).toBeNull()
  })

  it('handles fuzzy vehicle type (spaces)', () => {
    const flag = rateCheck(
      { ...baseTrip, vehicle_type: '14 ft', base_amount: 14200 },
      [{ ...baseRate, vehicle_type: '14ft' }]
    )
    expect(flag?.flag_type).toBe('rate_mismatch')
  })

  it('ignores differences within ₹1 tolerance', () => {
    expect(rateCheck({ ...baseTrip, base_amount: 12501 }, [baseRate])).toBeNull()
  })
})
