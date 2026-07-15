import { describe, expect, it } from "vitest"
import { duplicateCheck } from "./duplicateCheck"
import type { TripLineInput } from "./types"

function trip(overrides: Partial<TripLineInput> = {}): TripLineInput {
  return {
    id: "trip-1",
    bill_id: "bill-1",
    bill_number: "BILL-001",
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

describe("duplicateCheck", () => {
  it("flags an exact repeat of LR + vehicle + date + amount", () => {
    const original = trip({ id: "trip-orig", bill_id: "bill-orig" })
    const repeat = trip({ id: "trip-2", bill_id: "bill-2" })
    const flag = duplicateCheck(repeat, [original])
    expect(flag?.flag_type).toBe("duplicate")
    expect(flag?.related_bill_id).toBe("bill-orig")
  })

  it("flags a near-duplicate where the date shifted by clerical error", () => {
    const original = trip({ id: "trip-orig", bill_id: "bill-orig", trip_date: "2026-06-01" })
    const shifted = trip({ id: "trip-2", bill_id: "bill-2", trip_date: "2026-06-03" })
    const flag = duplicateCheck(shifted, [original])
    expect(flag?.flag_type).toBe("duplicate")
  })

  it("does not flag when the date shift is beyond the tolerance window", () => {
    const original = trip({ id: "trip-orig", bill_id: "bill-orig", trip_date: "2026-06-01" })
    const farShifted = trip({ id: "trip-2", bill_id: "bill-2", trip_date: "2026-06-20" })
    expect(duplicateCheck(farShifted, [original])).toBeNull()
  })

  it("does not flag a different vehicle or amount even with the same LR number", () => {
    const original = trip({ id: "trip-orig", bill_id: "bill-orig" })
    const differentVehicle = trip({ id: "trip-2", bill_id: "bill-2", vehicle_number: "KA01ZZ9999" })
    const differentAmount = trip({ id: "trip-3", bill_id: "bill-3", base_amount: 15000 })
    expect(duplicateCheck(differentVehicle, [original])).toBeNull()
    expect(duplicateCheck(differentAmount, [original])).toBeNull()
  })

  it("never compares against another line on the same bill", () => {
    const sameBillLine = trip({ id: "trip-2", bill_id: "bill-1" })
    expect(duplicateCheck(trip(), [sameBillLine])).toBeNull()
  })

  it("does not flag when there is no LR number to key off of", () => {
    expect(duplicateCheck(trip({ lr_number: null }), [trip({ id: "trip-2", bill_id: "bill-2" })])).toBeNull()
  })

  it("is scoped by the caller to one transporter (two transporters may legitimately reuse the same LR)", () => {
    // The function trusts its caller to pre-scope `otherTrips` to one transporter (Section 28).
    // An empty list (as if the other transporter's trips were filtered out) means no flag.
    expect(duplicateCheck(trip(), [])).toBeNull()
  })
})
