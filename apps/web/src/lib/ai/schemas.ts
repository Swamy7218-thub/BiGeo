import { z } from "zod"

export const confidenceLevel = z.enum(["low", "medium", "high"])

export const extraChargeSchema = z.object({
  type: z.string().describe("e.g. detention, loading, unloading, toll"),
  amount: z.number(),
})

export const extractedTripLineSchema = z.object({
  lr_number: z.string().nullable(),
  trip_date: z.string().nullable().describe("ISO 8601 date, YYYY-MM-DD"),
  origin: z.string().nullable(),
  destination: z.string().nullable(),
  vehicle_number: z.string().nullable(),
  vehicle_type: z.string().nullable(),
  base_amount: z.number(),
  extra_charges: z.array(extraChargeSchema).default([]),
  line_total: z.number().nullable().describe("Total for this line as printed on the bill, if shown"),
  confidence: confidenceLevel,
})

export const billExtractionSchema = z.object({
  bill_number: z.string().nullable(),
  bill_date: z.string().nullable().describe("ISO 8601 date, YYYY-MM-DD"),
  transporter_name_on_bill: z.string().nullable(),
  stated_total_amount: z.number().nullable().describe("The grand total printed on the bill, if present"),
  trip_lines: z.array(extractedTripLineSchema),
})
export type BillExtraction = z.infer<typeof billExtractionSchema>

export const extractedRateLineSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  vehicle_type: z.string(),
  rate: z.number(),
  rate_basis: z.enum(["per_trip", "per_km", "per_ton"]),
  detention_free_days: z.number().default(0),
  detention_rate: z.number().default(0),
  confidence: confidenceLevel,
})

export const rateContractExtractionSchema = z.object({
  valid_from: z.string().nullable().describe("ISO 8601 date, YYYY-MM-DD"),
  valid_to: z.string().nullable().describe("ISO 8601 date, YYYY-MM-DD"),
  rate_lines: z.array(extractedRateLineSchema),
})
export type RateContractExtraction = z.infer<typeof rateContractExtractionSchema>

export const podExtractionSchema = z.object({
  lr_number: z.string().nullable(),
  pod_date: z.string().nullable().describe("ISO 8601 date, YYYY-MM-DD"),
  confidence: confidenceLevel,
})
export type PodExtraction = z.infer<typeof podExtractionSchema>
