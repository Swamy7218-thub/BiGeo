import { describe, it, expect } from 'vitest'
import { duplicateCheck } from '../duplicate-check'
import type { TripLine } from '@freightcheck/shared'

const makeTrip = (id: string, overrides: Partial<TripLine> = {}): TripLine => ({
  id,
  bill_id: 'bill-1',
  company_id: 'co-1',
  lr_number: 'VRL240601',
  lr_number_confidence: 'high',
  trip_date: '2025-06-01',
  trip_date_confidence: 'high',
  origin: 'Mumbai',
  destination: 'Pune',
  vehicle_number: 'MH01AB1234',
  vehicle_type: '14ft',
  base_amount: 12500,
  extra_charges_json: {},
  overall_confidence: 0.95,
  status: 'pending',
  created_at: '2025-06-01T00:00:00Z',
  updated_at: '2025-06-01T00:00:00Z',
  ...overrides,
})

describe('duplicateCheck', () => {
  it('returns null when no existing trips', () => {
    expect(duplicateCheck(makeTrip('trip-1'), [])).toBeNull()
  })

  it('flags exact duplicate (same LR, vehicle, date)', () => {
    const trip = makeTrip('trip-2')
    const existing = [makeTrip('trip-1')]
    expect(duplicateCheck(trip, existing)?.flag_type).toBe('duplicate')
  })

  it('flags duplicate with date off by 1 day', () => {
    const trip = makeTrip('trip-2', { trip_date: '2025-06-02' })
    const existing = [makeTrip('trip-1')]
    expect(duplicateCheck(trip, existing)?.flag_type).toBe('duplicate')
  })

  it('does not flag when date is off by 2 days', () => {
    const trip = makeTrip('trip-2', { trip_date: '2025-06-03' })
    const existing = [makeTrip('trip-1')]
    expect(duplicateCheck(trip, existing)).toBeNull()
  })

  it('does not flag different LR numbers', () => {
    const trip = makeTrip('trip-2', { lr_number: 'VRL240602' })
    const existing = [makeTrip('trip-1')]
    expect(duplicateCheck(trip, existing)).toBeNull()
  })

  it('normalizes LR formatting (removes hyphens)', () => {
    const trip = makeTrip('trip-2', { lr_number: 'VRL-240601' })
    const existing = [makeTrip('trip-1')]
    expect(duplicateCheck(trip, existing)?.flag_type).toBe('duplicate')
  })
})
