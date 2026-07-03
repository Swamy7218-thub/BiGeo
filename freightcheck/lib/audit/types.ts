import type { TripLine, RateLine } from "@/lib/extraction/schema";

export type FlagType =
  | "rate_mismatch"
  | "duplicate"
  | "detention_invalid"
  | "missing_pod"
  | "unknown_lane";

export type FlagStatus = "open" | "accepted" | "waived";

export type Flag = {
  trip_index: number; // index into the trips array passed to runAudit
  flag_type: FlagType;
  expected_amount: number | null;
  claimed_amount: number | null;
  status: FlagStatus;
  message: string;
};

export type PriorTripRef = {
  lr_number: string | null;
  vehicle_number: string | null;
  trip_date: string | null;
  destination: string;
  bill_id: string;
};

export type AuditInput = {
  trips: TripLine[];
  rateLines: RateLine[];
  /** Trips already stored from other bills for this transporter, for duplicate detection. */
  priorTrips: PriorTripRef[];
  /** LR numbers that already have a matched POD on file. */
  lrNumbersWithPod: Set<string>;
  /** Tolerance before a rate difference counts as a mismatch, e.g. 0.01 = 1%. */
  rateTolerance?: number;
};

export type AuditResult = {
  flags: Flag[];
  total_claimed: number;
  total_flagged: number;
  total_approved: number;
};
