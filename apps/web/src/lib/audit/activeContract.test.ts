import { describe, expect, it } from "vitest"
import { resolveActiveContract, type RateContractWindow } from "./activeContract"

function contract(overrides: Partial<RateContractWindow> = {}): RateContractWindow {
  return {
    id: "c-1",
    valid_from: "2026-01-01",
    valid_to: "2026-12-31",
    status: "confirmed",
    rate_lines: [],
    ...overrides,
  }
}

describe("resolveActiveContract", () => {
  it("returns the contract covering the trip date", () => {
    const { activeContract } = resolveActiveContract([contract()], "2026-06-01")
    expect(activeContract?.id).toBe("c-1")
  })

  it("returns null when no confirmed contract covers the date (no renewal uploaded)", () => {
    const expired = contract({ id: "c-1", valid_from: "2025-01-01", valid_to: "2025-12-31" })
    const { activeContract } = resolveActiveContract([expired], "2026-06-01")
    expect(activeContract).toBeNull()
  })

  it("ignores draft contracts entirely", () => {
    const draft = contract({ id: "c-draft", status: "draft" })
    const { activeContract } = resolveActiveContract([draft], "2026-06-01")
    expect(activeContract).toBeNull()
  })

  it("resolves overlapping validity ranges by picking the most recent valid_from and surfaces the rest", () => {
    const older = contract({ id: "c-old", valid_from: "2026-01-01", valid_to: "2026-12-31" })
    const renewal = contract({ id: "c-new", valid_from: "2026-06-01", valid_to: "2027-05-31" })
    const { activeContract, overlapping } = resolveActiveContract([older, renewal], "2026-07-01")
    expect(activeContract?.id).toBe("c-new")
    expect(overlapping.map((c) => c.id)).toEqual(["c-old"])
  })

  it("treats an open-ended valid_to as covering all future dates", () => {
    const openEnded = contract({ valid_from: "2026-01-01", valid_to: null })
    const { activeContract } = resolveActiveContract([openEnded], "2030-01-01")
    expect(activeContract).not.toBeNull()
  })
})
