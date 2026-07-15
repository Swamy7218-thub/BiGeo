import type { RateLine } from "./types"

export interface RateContractWindow {
  id: string
  valid_from: string | null // ISO date
  valid_to: string | null
  status: "draft" | "confirmed"
  rate_lines: RateLine[]
}

export interface ActiveContractResolution {
  activeContract: RateContractWindow | null
  /** Other confirmed contracts whose validity window also covers this date (Section 28 overlap edge case). */
  overlapping: RateContractWindow[]
}

/**
 * Resolves which confirmed rate contract applies on a given trip date.
 * Only ever considers `confirmed` contracts (FR-3: drafts never price a
 * bill). When windows overlap, the most recent `valid_from` wins and the
 * rest are surfaced for cleanup rather than silently discarded
 * (Section 28: "resolve which rate applies by most-recent valid_from, and
 * flag the overlap to the user").
 */
export function resolveActiveContract(
  contracts: RateContractWindow[],
  tripDate: string | null
): ActiveContractResolution {
  const confirmed = contracts.filter((c) => c.status === "confirmed")

  if (!tripDate) {
    const sorted = [...confirmed].sort((a, b) => (b.valid_from ?? "").localeCompare(a.valid_from ?? ""))
    return { activeContract: sorted[0] ?? null, overlapping: sorted.slice(1) }
  }

  const covering = confirmed.filter((c) => {
    const from = c.valid_from ?? "0000-01-01"
    const to = c.valid_to ?? "9999-12-31"
    return tripDate >= from && tripDate <= to
  })

  if (covering.length === 0) return { activeContract: null, overlapping: [] }

  const sorted = [...covering].sort((a, b) => (b.valid_from ?? "").localeCompare(a.valid_from ?? ""))
  return { activeContract: sorted[0], overlapping: sorted.slice(1) }
}
