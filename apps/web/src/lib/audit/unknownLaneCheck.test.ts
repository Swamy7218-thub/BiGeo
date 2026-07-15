import { describe, expect, it } from "vitest"
import { unknownLaneCheck } from "./unknownLaneCheck"
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

const knownRateLine: RateLine = {
  id: "rl-1",
  origin: "Mumbai",
  destination: "Pune",
  vehicle_type: "32ft SXL",
  rate: 10000,
  rate_basis: "per_trip",
  detention_free_days: 1,
  detention_rate: 500,
}

describe("unknownLaneCheck", () => {
  it("does not flag a lane present in the rate master", () => {
    expect(unknownLaneCheck(trip(), [knownRateLine])).toBeNull()
  })

  it("flags a lane absent from the rate master for manual pricing", () => {
    const flag = unknownLaneCheck(trip({ destination: "Nagpur" }), [knownRateLine])
    expect(flag?.flag_type).toBe("unknown_lane")
    expect(flag?.expected_amount).toBeNull()
  })

  it("flags a trip missing route fields rather than crashing", () => {
    const flag = unknownLaneCheck(trip({ origin: null }), [knownRateLine])
    expect(flag?.flag_type).toBe("unknown_lane")
  })
})
