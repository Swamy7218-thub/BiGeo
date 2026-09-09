import type { TripLine, RateLine, POD, Flag } from '@freightcheck/shared'
import { rateCheck } from './rate-check'
import { duplicateCheck } from './duplicate-check'
import { detentionCheck } from './detention-check'
import { unknownLaneCheck } from './unknown-lane-check'

export interface AuditContext {
  tripLine: TripLine
  rateLines: RateLine[]       // all rate lines for this transporter's active contract
  existingTrips: TripLine[]   // all previous trip lines for same transporter (for dup check)
  pod?: POD | null
}

export function runAudit(ctx: AuditContext): Omit<Flag, 'id' | 'updated_at' | 'created_at' | 'updated_by' | 'status'>[] {
  const { tripLine, rateLines, existingTrips, pod } = ctx
  const flags: Omit<Flag, 'id' | 'updated_at' | 'created_at' | 'updated_by' | 'status'>[] = []

  // 1. Unknown lane — must run first; if unknown skip rate check
  const unknownFlag = unknownLaneCheck(tripLine, rateLines)
  if (unknownFlag) {
    flags.push(unknownFlag)
    // Still run dup + detention even for unknown lanes
  }

  // 2. Rate mismatch (only if lane is known)
  if (!unknownFlag) {
    const rateFlag = rateCheck(tripLine, rateLines)
    if (rateFlag) flags.push(rateFlag)
  }

  // 3. Duplicate LR
  const dupFlag = duplicateCheck(tripLine, existingTrips)
  if (dupFlag) flags.push(dupFlag)

  // 4. Detention validity
  const matchedRateLine = rateLines.find(
    l => normalize(l.origin) === normalize(tripLine.origin) &&
         normalize(l.destination) === normalize(tripLine.destination)
  ) ?? null
  const detentionFlag = detentionCheck(tripLine, matchedRateLine, pod)
  if (detentionFlag) flags.push(detentionFlag)

  return flags
}

const normalize = (s: string) => s.trim().toLowerCase()
