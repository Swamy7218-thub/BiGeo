import type { RateLine, TripLine } from "@/lib/extraction/schema";
import type { AuditInput, AuditResult, Flag } from "./types";

function normalizeLane(value: string | null): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeLr(value: string | null): string | null {
  if (!value) return null;
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function tripTotal(trip: TripLine): number {
  return trip.base_amount + trip.extra_charges.reduce((sum, c) => sum + c.amount, 0);
}

function findRateLine(trip: TripLine, rateLines: RateLine[]): RateLine | null {
  const origin = normalizeLane(trip.origin);
  const destination = normalizeLane(trip.destination);
  const vehicleType = normalizeLane(trip.vehicle_type);

  const laneMatches = rateLines.filter(
    (r) => normalizeLane(r.origin) === origin && normalizeLane(r.destination) === destination
  );
  if (laneMatches.length === 0) return null;

  const exact = laneMatches.find((r) => normalizeLane(r.vehicle_type) === vehicleType);
  if (exact) return exact;

  // Only one rate line for this lane and the bill didn't capture vehicle type cleanly — use it.
  return laneMatches.length === 1 ? laneMatches[0] : null;
}

function checkRateMismatch(
  trip: TripLine,
  rateLine: RateLine | null,
  tolerance: number
): Flag | null {
  if (!rateLine) {
    return {
      trip_index: -1,
      flag_type: "unknown_lane",
      expected_amount: null,
      claimed_amount: trip.base_amount,
      status: "open",
      message: `No rate contract line found for ${trip.origin} → ${trip.destination}${
        trip.vehicle_type ? ` (${trip.vehicle_type})` : ""
      }. Needs manual rate confirmation.`,
    };
  }

  if (rateLine.rate_basis !== "per_trip") {
    // per_km / per_ton rates need distance or tonnage data this pipeline doesn't
    // capture yet — surface the lane rate for manual reference, don't auto-flag.
    return null;
  }

  const diff = trip.base_amount - rateLine.rate;
  if (Math.abs(diff) <= rateLine.rate * tolerance) return null;

  return {
    trip_index: -1,
    flag_type: "rate_mismatch",
    expected_amount: rateLine.rate,
    claimed_amount: trip.base_amount,
    status: "open",
    message:
      diff > 0
        ? `Billed ₹${trip.base_amount} vs contracted ₹${rateLine.rate} for this lane/vehicle type — ₹${diff.toFixed(0)} over.`
        : `Billed ₹${trip.base_amount} is below contracted ₹${rateLine.rate} — verify before flagging.`,
  };
}

function checkDetention(trip: TripLine, rateLine: RateLine | null, hasPod: boolean): Flag[] {
  const detentionCharges = trip.extra_charges.filter((c) => c.type === "detention");
  if (detentionCharges.length === 0) return [];

  const claimed = detentionCharges.reduce((sum, c) => sum + c.amount, 0);

  if (!rateLine || rateLine.detention_rate_per_day == null) {
    return [
      {
        trip_index: -1,
        flag_type: "detention_invalid",
        expected_amount: 0,
        claimed_amount: claimed,
        status: "open",
        message: "Detention charged but the rate contract has no detention clause for this lane.",
      },
    ];
  }

  if (!hasPod) {
    return [
      {
        trip_index: -1,
        flag_type: "detention_invalid",
        expected_amount: null,
        claimed_amount: claimed,
        status: "open",
        message: "Detention charged with no POD on file to support the wait — request proof before paying.",
      },
    ];
  }

  return [];
}

function checkMissingPod(trip: TripLine, lrNumbersWithPod: Set<string>): Flag | null {
  const lr = normalizeLr(trip.lr_number);
  if (!lr) return null;
  if (lrNumbersWithPod.has(lr)) return null;
  return {
    trip_index: -1,
    flag_type: "missing_pod",
    expected_amount: null,
    claimed_amount: null,
    status: "open",
    message: `No POD on file for LR ${trip.lr_number}.`,
  };
}

function findDuplicates(input: AuditInput): Map<number, Flag> {
  const duplicates = new Map<number, Flag>();
  const seenInThisBill = new Map<string, number>();

  input.trips.forEach((trip, index) => {
    const lr = normalizeLr(trip.lr_number);

    // Duplicate against a trip already stored from a previous bill.
    if (lr) {
      const priorMatch = input.priorTrips.find((p) => normalizeLr(p.lr_number) === lr);
      if (priorMatch) {
        duplicates.set(index, {
          trip_index: index,
          flag_type: "duplicate",
          expected_amount: 0,
          claimed_amount: tripTotal(trip),
          status: "open",
          message: `LR ${trip.lr_number} was already billed (bill ${priorMatch.bill_id}).`,
        });
        return;
      }
    }

    // Duplicate within the same bill (same LR entered twice).
    if (lr) {
      const firstIndex = seenInThisBill.get(lr);
      if (firstIndex !== undefined) {
        duplicates.set(index, {
          trip_index: index,
          flag_type: "duplicate",
          expected_amount: 0,
          claimed_amount: tripTotal(trip),
          status: "open",
          message: `LR ${trip.lr_number} appears twice in this bill (also line ${firstIndex + 1}).`,
        });
        return;
      }
      seenInThisBill.set(lr, index);
    }

    // Fuzzy duplicate: same vehicle + date + destination, useful when LR numbers
    // are missing or inconsistent across a transporter's bills.
    if (trip.vehicle_number && trip.trip_date) {
      const fingerprint = `${trip.vehicle_number.trim().toUpperCase()}|${trip.trip_date}|${normalizeLane(
        trip.destination
      )}`;
      const priorFuzzyMatch = input.priorTrips.find(
        (p) =>
          p.vehicle_number &&
          p.trip_date &&
          `${p.vehicle_number.trim().toUpperCase()}|${p.trip_date}|${normalizeLane(p.destination)}` ===
            fingerprint
      );
      if (priorFuzzyMatch && !duplicates.has(index)) {
        duplicates.set(index, {
          trip_index: index,
          flag_type: "duplicate",
          expected_amount: 0,
          claimed_amount: tripTotal(trip),
          status: "open",
          message: `Same vehicle, date, and destination already billed (bill ${priorFuzzyMatch.bill_id}) under a different LR number — check for a re-billed trip.`,
        });
      }
    }
  });

  return duplicates;
}

export function runAudit(input: AuditInput): AuditResult {
  const tolerance = input.rateTolerance ?? 0.01;
  const flags: Flag[] = [];
  const duplicates = findDuplicates(input);

  let totalClaimed = 0;
  let totalFlagged = 0;

  input.trips.forEach((trip, index) => {
    const claimed = tripTotal(trip);
    totalClaimed += claimed;

    const duplicateFlag = duplicates.get(index);
    if (duplicateFlag) {
      flags.push(duplicateFlag);
      totalFlagged += claimed;
      return; // a duplicated trip is disputed in full; skip other checks
    }

    const rateLine = findRateLine(trip, input.rateLines);
    let atRisk = 0;

    const rateFlag = checkRateMismatch(trip, rateLine, tolerance);
    if (rateFlag) {
      flags.push({ ...rateFlag, trip_index: index });
      if (rateFlag.flag_type === "rate_mismatch" && rateFlag.expected_amount != null) {
        atRisk += Math.max(0, rateFlag.claimed_amount! - rateFlag.expected_amount);
      }
    }

    const detentionFlags = checkDetention(trip, rateLine, hasPod(trip, input.lrNumbersWithPod));
    for (const flag of detentionFlags) {
      flags.push({ ...flag, trip_index: index });
      atRisk += flag.claimed_amount ?? 0;
    }

    const podFlag = checkMissingPod(trip, input.lrNumbersWithPod);
    if (podFlag) flags.push({ ...podFlag, trip_index: index });

    totalFlagged += atRisk;
  });

  return {
    flags,
    total_claimed: round2(totalClaimed),
    total_flagged: round2(totalFlagged),
    total_approved: round2(totalClaimed - totalFlagged),
  };
}

function hasPod(trip: TripLine, lrNumbersWithPod: Set<string>): boolean {
  const lr = normalizeLr(trip.lr_number);
  return lr != null && lrNumbersWithPod.has(lr);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
