/** Case/whitespace-insensitive comparison key for lane and vehicle-type matching. */
export function normalizeKey(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ")
}

export function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / msPerDay)
}

export function isCloseToInteger(value: number, tolerance = 0.05): boolean {
  return Math.abs(value - Math.round(value)) <= tolerance
}
