import { describe, expect, it } from "vitest"
import type { RateContractWindow } from "./activeContract"
import { calcBillTotals, runAuditForBill } from "./runAudit"
import type { AuditFlag, TripLineInput } from "./types"

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

const confirmedContract: RateContractWindow = {
  id: "c-1",
  valid_from: "2026-01-01",
  valid_to: "2026-12-31",
  status: "confirmed",
  rate_lines: [
    {
      id: "rl-1",
      origin: "Mumbai",
      destination: "Pune",
      vehicle_type: "32ft SXL",
      rate: 10000,
      rate_basis: "per_trip",
      detention_free_days: 1,
      detention_rate: 500,
    },
  ],
}

describe("runAuditForBill", () => {
  it("produces no flags for a clean trip line against an active contract", () => {
    const flags = runAuditForBill({
      tripLines: [trip()],
      otherTransporterTripLines: [],
      rateContracts: [confirmedContract],
      pods: [],
    })
    expect(flags).toEqual([])
  })

  it("flags no_active_contract instead of pricing against a stale/missing rate table", () => {
    const flags = runAuditForBill({
      tripLines: [trip({ trip_date: "2027-01-15" })],
      otherTransporterTripLines: [],
      rateContracts: [confirmedContract],
      pods: [],
    })
    expect(flags).toHaveLength(1)
    expect(flags[0].flag_type).toBe("no_active_contract")
  })

  it("can raise multiple independent flags on the same trip line", () => {
    const dupOriginal = trip({ id: "trip-orig", bill_id: "bill-orig", base_amount: 20000 })
    const flags = runAuditForBill({
      tripLines: [trip({ base_amount: 20000 })], // rate mismatch
      otherTransporterTripLines: [dupOriginal], // + duplicate
      rateContracts: [confirmedContract],
      pods: [],
    })
    const types = flags.map((f) => f.flag_type).sort()
    expect(types).toEqual(["duplicate", "rate_mismatch"])
  })
})

describe("calcBillTotals", () => {
  const trips = [trip({ id: "t1", base_amount: 10000 }), trip({ id: "t2", base_amount: 5000, lr_number: "LR200" })]

  it("sums total_claimed across all trip lines", () => {
    const totals = calcBillTotals(trips, [])
    expect(totals.total_claimed).toBe(15000)
    expect(totals.total_flagged).toBe(0)
    expect(totals.total_approved).toBe(15000)
  })

  it("uses the rate-mismatch delta, not the full line amount, as the amount at risk", () => {
    const flags: AuditFlag[] = [
      { trip_line_id: "t1", flag_type: "rate_mismatch", reason: "x", expected_amount: 8000, claimed_amount: 10000 },
    ]
    const totals = calcBillTotals(trips, flags)
    expect(totals.total_flagged).toBe(2000)
    expect(totals.total_approved).toBe(13000)
  })

  it("caps at-risk amount per trip line even with multiple flags on the same line", () => {
    const flags: AuditFlag[] = [
      { trip_line_id: "t1", flag_type: "rate_mismatch", reason: "x", expected_amount: 8000, claimed_amount: 10000 },
      { trip_line_id: "t1", flag_type: "missing_pod", reason: "y", expected_amount: null, claimed_amount: 10000 },
    ]
    const totals = calcBillTotals(trips, flags)
    // t1's at-risk amount should be capped at max(2000, 10000) = 10000, not 12000
    expect(totals.total_flagged).toBe(10000)
  })
})
