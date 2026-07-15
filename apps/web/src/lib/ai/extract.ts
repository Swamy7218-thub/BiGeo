import "server-only"
import Anthropic from "@anthropic-ai/sdk"
import type { z } from "zod"
import ExcelJS from "exceljs"
import {
  billExtractionSchema,
  podExtractionSchema,
  rateContractExtractionSchema,
  type BillExtraction,
  type PodExtraction,
  type RateContractExtraction,
} from "./schemas"

const MODEL = "claude-sonnet-4-5-20250929"

export type SourceDocument = {
  bytes: Buffer
  mediaType: string
  filename: string
}

function client() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set")
  return new Anthropic({ apiKey })
}

const SUPPORTED_DOCUMENT_TYPES = new Set(["application/pdf"])
const SUPPORTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"])
const SPREADSHEET_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
])

/** Flattens an Excel workbook into a plain-text table Claude can read as a document reader (Section 15.1/15.2). */
async function spreadsheetToText(bytes: Buffer): Promise<string> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(bytes as unknown as ArrayBuffer)
  const parts: string[] = []
  workbook.eachSheet((sheet) => {
    parts.push(`## Sheet: ${sheet.name}`)
    sheet.eachRow((row) => {
      const cells = (row.values as unknown[]).slice(1).map((v) => (v == null ? "" : String(v)))
      parts.push(cells.join(" | "))
    })
  })
  return parts.join("\n")
}

async function buildUserContent(
  doc: SourceDocument
): Promise<Anthropic.Messages.ContentBlockParam[]> {
  if (SUPPORTED_DOCUMENT_TYPES.has(doc.mediaType)) {
    return [
      {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: doc.bytes.toString("base64") },
      },
    ]
  }
  if (SUPPORTED_IMAGE_TYPES.has(doc.mediaType)) {
    return [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: doc.mediaType as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
          data: doc.bytes.toString("base64"),
        },
      },
    ]
  }
  if (SPREADSHEET_TYPES.has(doc.mediaType)) {
    const text = await spreadsheetToText(doc.bytes)
    return [{ type: "text", text: `Spreadsheet contents (${doc.filename}):\n\n${text}` }]
  }
  throw new Error(`Unsupported document type: ${doc.mediaType}`)
}

/**
 * One call per document, per Section 15.1 — no agentic loop. Asks for
 * strict JSON, validates against the Zod schema server-side, and retries
 * once with the validation error appended if parsing fails, matching the
 * PRD's "ask for JSON only, validate against a schema, reject and retry
 * once on parse failure" rule and FR error-handling Section 27.
 */
async function extractWithSchema<T>(params: {
  system: string
  instructions: string
  doc: SourceDocument
  schema: z.ZodType<T>
}): Promise<T> {
  const anthropic = client()
  const userContent = await buildUserContent(params.doc)

  const messages: Anthropic.Messages.MessageParam[] = [
    {
      role: "user",
      content: [...userContent, { type: "text", text: params.instructions }],
    },
  ]

  let lastRawText = ""
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: params.system,
      messages,
    })

    const textBlock = response.content.find((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    lastRawText = textBlock?.text ?? ""

    const parsed = tryParseJson(lastRawText)
    if (parsed.ok) {
      const result = params.schema.safeParse(parsed.value)
      if (result.success) return result.data

      messages.push({ role: "assistant", content: lastRawText })
      messages.push({
        role: "user",
        content: `That JSON did not match the required schema. Validation errors:\n${JSON.stringify(
          result.error.issues,
          null,
          2
        )}\n\nReturn ONLY corrected JSON matching the schema, no other text.`,
      })
      continue
    }

    messages.push({ role: "assistant", content: lastRawText })
    messages.push({
      role: "user",
      content: "That was not valid JSON. Return ONLY a single valid JSON object, no markdown fences, no other text.",
    })
  }

  throw new ExtractionFailedError("Model did not return schema-valid JSON after retry.", lastRawText)
}

export class ExtractionFailedError extends Error {
  rawResponse: string
  constructor(message: string, rawResponse: string) {
    super(message)
    this.rawResponse = rawResponse
  }
}

function tryParseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : text
  try {
    return { ok: true, value: JSON.parse(candidate.trim()) }
  } catch {
    return { ok: false }
  }
}

const BILL_SCHEMA_HINT = `Return a single JSON object with this exact shape:
{
  "bill_number": string | null,
  "bill_date": string | null,        // ISO 8601 YYYY-MM-DD
  "transporter_name_on_bill": string | null,
  "stated_total_amount": number | null,  // the grand total printed on the bill, if any
  "trip_lines": [
    {
      "lr_number": string | null,
      "trip_date": string | null,    // ISO 8601 YYYY-MM-DD
      "origin": string | null,
      "destination": string | null,
      "vehicle_number": string | null,
      "vehicle_type": string | null,
      "base_amount": number,
      "extra_charges": [ { "type": string, "amount": number } ],
      "line_total": number | null,   // this line's own printed total, if shown
      "confidence": "low" | "medium" | "high"
    }
  ]
}`

export async function extractBillFromDocument(doc: SourceDocument): Promise<BillExtraction> {
  return extractWithSchema({
    doc,
    schema: billExtractionSchema,
    system:
      "You are a meticulous freight bill data-entry clerk for an Indian road-transport freight audit tool. " +
      "Bills may be scanned, rotated, low-resolution, or partly handwritten (Lorry Receipts). " +
      "Extract every trip line exactly as printed — do not invent, round, or infer values you cannot read. " +
      "If a field is illegible or absent, use null rather than guessing. " +
      "Self-report your confidence per trip line honestly: 'low' if you had to guess at all, " +
      "'medium' if mostly clear but with some uncertainty, 'high' only if fully legible and unambiguous. " +
      "Respond with ONLY the JSON object — no markdown fences, no commentary.",
    instructions: `Extract every trip line from this freight bill.\n\n${BILL_SCHEMA_HINT}`,
  })
}

const RATE_CONTRACT_SCHEMA_HINT = `Return a single JSON object with this exact shape:
{
  "valid_from": string | null,   // ISO 8601 YYYY-MM-DD
  "valid_to": string | null,     // ISO 8601 YYYY-MM-DD
  "rate_lines": [
    {
      "origin": string,
      "destination": string,
      "vehicle_type": string,
      "rate": number,
      "rate_basis": "per_trip" | "per_km" | "per_ton",
      "detention_free_days": number,
      "detention_rate": number,
      "confidence": "low" | "medium" | "high"
    }
  ]
}`

export async function extractRateContractFromDocument(
  doc: SourceDocument
): Promise<RateContractExtraction> {
  return extractWithSchema({
    doc,
    schema: rateContractExtractionSchema,
    system:
      "You are extracting structured lane rates from an Indian road-transport rate contract. " +
      "Capture every origin-destination-vehicle_type rate line, the rate basis (per trip / per km / per ton), " +
      "detention free days and detention rate, and the contract's overall validity date range. " +
      "This data will silently price every future bill against this transporter, so never guess a number — " +
      "use null / omit a line and mark confidence 'low' if you are not sure. " +
      "Respond with ONLY the JSON object — no markdown fences, no commentary.",
    instructions: `Extract the rate master from this rate contract.\n\n${RATE_CONTRACT_SCHEMA_HINT}`,
  })
}

const POD_SCHEMA_HINT = `Return a single JSON object with this exact shape:
{
  "lr_number": string | null,
  "pod_date": string | null,   // ISO 8601 YYYY-MM-DD
  "confidence": "low" | "medium" | "high"
}`

export async function extractPodFromDocument(doc: SourceDocument): Promise<PodExtraction> {
  return extractWithSchema({
    doc,
    schema: podExtractionSchema,
    system:
      "You are reading a Proof of Delivery (POD) document to find its LR (Lorry Receipt) number and date, " +
      "so it can be matched back to the corresponding trip line. Respond with ONLY the JSON object.",
    instructions: `Find the LR number and delivery date on this POD.\n\n${POD_SCHEMA_HINT}`,
  })
}
