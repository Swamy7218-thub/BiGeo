import type { BillExtraction } from "./schemas"

export const LEVEL_SCORE: Record<"low" | "medium" | "high", number> = {
  low: 0.6,
  medium: 0.85,
  high: 0.97,
}

/**
 * A trip line's stated arithmetic (base + extras) should reconcile with
 * its own printed line_total, if the bill shows one. Mismatches are a
 * strong signal the extraction misread a number even when the model is
 * self-confident (Section 15.1).
 */
export function lineArithmeticReconciles(line: BillExtraction["trip_lines"][number]): boolean {
  if (line.line_total == null) return true // nothing printed to check against
  const extras = line.extra_charges.reduce((sum, c) => sum + c.amount, 0)
  const computed = line.base_amount + extras
  const tolerance = Math.max(1, Math.abs(line.line_total) * 0.01)
  return Math.abs(computed - line.line_total) <= tolerance
}

/**
 * Whole-bill reconciliation: sum of all line totals (or base+extras where
 * no line_total was printed) against the bill's own stated grand total.
 */
export function billArithmeticReconciles(extraction: BillExtraction): boolean {
  if (extraction.stated_total_amount == null) return true
  const sum = extraction.trip_lines.reduce((total, line) => {
    const lineValue =
      line.line_total ?? line.base_amount + line.extra_charges.reduce((s, c) => s + c.amount, 0)
    return total + lineValue
  }, 0)
  const tolerance = Math.max(1, Math.abs(extraction.stated_total_amount) * 0.01)
  return Math.abs(sum - extraction.stated_total_amount) <= tolerance
}

/**
 * Combines the model's self-reported confidence with a deterministic
 * arithmetic-reconciliation heuristic and takes the lower of the two, per
 * PRD Section 15.1: "Use the lower of the two."
 */
export function resolveFieldConfidence(
  selfReported: "low" | "medium" | "high",
  arithmeticReconciles: boolean
): number {
  const selfScore = LEVEL_SCORE[selfReported]
  const heuristicScore = arithmeticReconciles ? 1 : 0.5
  return Math.min(selfScore, heuristicScore)
}

export const DEFAULT_REVIEW_THRESHOLD = 0.85
