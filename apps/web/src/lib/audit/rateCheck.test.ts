import { describe, expect, it } from "vitest"
import { rateCheck } from "./rateCheck"
import type { RateLine, TripLineInput } from "./types"

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
    extra_charges: [],
    ...overrides,
  }
}

function rateLine(overrides: Partial<RateLine> = {}): RateLine {
  return {
    id: "rl-1",
    origin: "Mumbai",
    destination: "Pune",
    vehicle_type: "32ft SXL",
    rate: 10000,
    rate_basis: "per_trip",
    detention_free_days: 1,
    detention_rate: 500,
    ...overrides,
  }
}

describe("rateCheck", () => {
  it("does not flag an exact match", () => {
    expect(rateCheck(trip(), [rateLine()])).toBeNull()
  })

  it("does not flag a difference within the ₹1-or-1% tolerance", () => {
    // 1% of 10000 = 100, so 10090 is within tolerance
    expect(rateCheck(trip({ base_amount: 10090 }), [rateLine()])).toBeNull()
  })

  it("flags a difference beyond tolerance with expected vs claimed amounts", () => {
    const flag = rateCheck(trip({ base_amount: 12000 }), [rateLine()])
    expect(flag).not.toBeNull()
    expect(flag?.flag_type).toBe("rate_mismatch")
    expect(flag?.expected_amount).toBe(10000)
    expect(flag?.claimed_amount).toBe(12000)
  })

  it("matches lanes case- and whitespace-insensitively", () => {
    const flag = rateCheck(
      trip({ origin: "  mumbai ", destination: "PUNE", vehicle_type: "32ft sxl" }),
      [rateLine()]
    )
    expect(flag).toBeNull()
  })

  it("is a no-op when no rate line matches (unknownLaneCheck's job)", () => {
    expect(rateCheck(trip({ destination: "Nagpur" }), [rateLine()])).toBeNull()
  })

  it("never guesses at per_km or per_ton lanes without distance/tonnage data", () => {
    const flag = rateCheck(trip({ base_amount: 999999 }), [
      rateLine({ rate_basis: "per_km", rate: 20 }),
    ])
    expect(flag).toBeNull()
  })
})
