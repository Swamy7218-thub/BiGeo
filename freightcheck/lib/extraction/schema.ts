import { z } from "zod";

export const extraChargeSchema = z.object({
  type: z.enum(["detention", "loading", "unloading", "toll", "other"]),
  amount: z.number(),
  description: z.string().nullable(),
});

export const tripLineSchema = z.object({
  lr_number: z.string().nullable(),
  trip_date: z.string().nullable(), // ISO yyyy-mm-dd, null if illegible
  origin: z.string(),
  destination: z.string(),
  vehicle_number: z.string().nullable(),
  vehicle_type: z.string().nullable(),
  base_amount: z.number(),
  extra_charges: z.array(extraChargeSchema),
  extraction_confidence: z.number().min(0).max(1),
  notes: z.string().nullable(),
});

export const billExtractionSchema = z.object({
  bill_number: z.string().nullable(),
  bill_date: z.string().nullable(),
  transporter_name: z.string().nullable(),
  trips: z.array(tripLineSchema),
});

export const rateLineSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  vehicle_type: z.string(),
  rate: z.number(),
  rate_basis: z.enum(["per_trip", "per_km", "per_ton"]),
  detention_free_days: z.number().nullable(),
  detention_rate_per_day: z.number().nullable(),
  diesel_escalation_clause: z.string().nullable(),
});

export const rateContractExtractionSchema = z.object({
  transporter_name: z.string().nullable(),
  valid_from: z.string().nullable(),
  valid_to: z.string().nullable(),
  rate_lines: z.array(rateLineSchema),
});

export type ExtraCharge = z.infer<typeof extraChargeSchema>;
export type TripLine = z.infer<typeof tripLineSchema>;
export type BillExtraction = z.infer<typeof billExtractionSchema>;
export type RateLine = z.infer<typeof rateLineSchema>;
export type RateContractExtraction = z.infer<typeof rateContractExtractionSchema>;
