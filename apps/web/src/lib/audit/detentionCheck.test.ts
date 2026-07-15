import { describe, expect, it } from "vitest"
import { detentionCheck } from "./detentionCheck"
import type { PodInput, RateLine, TripLineInput } from "./types"

function trip(overrides: Partial<TripLineInput> = {}): TripLineInput {
  return {
    id: "trip-1",
    bill_id: "bill-1",
    lr_number: "LR100",
    trip_date: "2026-06-01",
    origin: "Mumbai",
    destination: "Pune",
    vehicle_number: "MH12AB1234",
    vehicle_type: "32ft SXL",
    base_amount: 10000,
    extra_charges: [{ type: "detention", amount: 1000 }],
    ...overrides,
  }
}

const rateLineWithDetention: RateLine = {
  id: "rl-1",
  origin: "Mumbai",
  destination: "Pune",
  vehicle_type: "32ft SXL",
  rate: 10000,
  rate_basis: "per_trip",
  detention_free_days: 1,
  detention_rate: 500,
}

const rateLineNoDetention: RateLine = { ...rateLineWithDetention, detention_rate: 0, detention_free_days: 0 }

const pod: PodInput = { trip_line_id: "trip-1", pod_date: "2026-06-01" }

describe("detentionCheck", () => {
  it("ignores trip lines with no detention charge", () => {
    expect(detentionCheck(trip({ extra_charges: [] }), rateLineWithDetention, pod)).toBeNull()
  })

  it("does not flag a detention charge that is a whole number of contract days and has a matching POD", () => {
    // 1000 / 500 per day = 2 days, a plausible whole number
    expect(detentionCheck(trip(), rateLineWithDetention, pod)).toBeNull()
  })

  it("flags detention_date_mismatch when the POD date disagrees with the billed trip date", () => {
    const mismatchedPod: PodInput = { trip_line_id: "trip-1", pod_date: "2026-06-05" }
    const flag = detentionCheck(trip(), rateLineWithDetention, mismatchedPod)
    expect(flag?.flag_type).toBe("detention_date_mismatch")
  })

  it("flags missing_pod when no POD backs the detention charge", () => {
    const flag = detentionCheck(trip(), rateLineWithDetention, undefined)
    expect(flag?.flag_type).toBe("missing_pod")
  })

  it("flags detention_invalid when the contract has no detention terms for the lane", () => {
    const flag = detentionCheck(trip(), rateLineNoDetention, pod)
    expect(flag?.flag_type).toBe("detention_invalid")
    expect(flag?.expected_amount).toBe(0)
  })

  it("flags detention_invalid when the charge isn't a plausible whole number of contract days", () => {
    const flag = detentionCheck(trip({ extra_charges: [{ type: "detention", amount: 733 }] }), rateLineWithDetention, pod)
    expect(flag?.flag_type).toBe("detention_invalid")
  })

  it("matches detention charge types case-insensitively and among multiple extras", () => {
    const flag = detentionCheck(
      trip({ extra_charges: [{ type: "Loading", amount: 200 }, { type: "Detention Charges", amount: 1000 }] }),
      rateLineWithDetention,
      pod
    )
    expect(flag).toBeNull() // 1000/500 = 2 days, valid — proves the loading charge didn't interfere
  })
})
