import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Zod schema for extraction output ─────────────────────────────────────
const TripLineSchema = z.object({
  lr_number: z.string(),
  lr_number_confidence: z.enum(['high', 'medium', 'low']),
  trip_date: z.string(),
  trip_date_confidence: z.enum(['high', 'medium', 'low']),
  origin: z.string(),
  destination: z.string(),
  vehicle_number: z.string(),
  vehicle_type: z.string(),
  base_amount: z.number(),
  extra_charges: z.object({
    detention: z.number().optional(),
    loading: z.number().optional(),
    unloading: z.number().optional(),
    toll: z.number().optional(),
    other: z.number().optional(),
  }).default({}),
  overall_confidence: z.number().min(0).max(1),
})

const ExtractionResultSchema = z.object({
  bill_number: z.string(),
  bill_date: z.string(),
  transporter_name: z.string(),
  total_amount: z.number(),
  trips: z.array(TripLineSchema),
})

export type ExtractionResult = z.infer<typeof ExtractionResultSchema> & {
  arithmetic_check_passed: boolean
  overall_confidence: number
  low_confidence_fields: string[]
}

const SYSTEM_PROMPT = `You are a freight bill extraction system for Indian road transport.
Extract every trip line from the provided freight bill document exactly as it appears.
Return ONLY valid JSON matching the schema below — no markdown, no explanation.

Schema:
{
  "bill_number": "string",
  "bill_date": "YYYY-MM-DD",
  "transporter_name": "string",
  "total_amount": number,
  "trips": [
    {
      "lr_number": "string",
      "lr_number_confidence": "high|medium|low",
      "trip_date": "YYYY-MM-DD",
      "trip_date_confidence": "high|medium|low",
      "origin": "string (city name)",
      "destination": "string (city name)",
      "vehicle_number": "string",
      "vehicle_type": "string (e.g. 14ft, 17ft, 20ft, SXL)",
      "base_amount": number,
      "extra_charges": {
        "detention": number or omit,
        "loading": number or omit,
        "unloading": number or omit,
        "toll": number or omit,
        "other": number or omit
      },
      "overall_confidence": number between 0 and 1
    }
  ]
}

Rules:
- Dates must be YYYY-MM-DD format
- Amounts are in INR (Indian Rupees), numeric only (no ₹ symbol)
- If a field is illegible, use empty string and set confidence to "low"
- overall_confidence: 0.9+ = clearly readable, 0.7-0.9 = some ambiguity, <0.7 = mostly guessing`

export async function extractBill(
  fileBuffer: Buffer,
  mimeType: string,
  maxRetries = 3
): Promise<ExtractionResult> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: mimeType as 'application/pdf' | 'image/jpeg' | 'image/png',
                data: fileBuffer.toString('base64'),
              },
            },
            { type: 'text', text: 'Extract all trip lines from this freight bill. Return JSON only.' },
          ],
        }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const parsed = JSON.parse(text.trim())
      const validated = ExtractionResultSchema.parse(parsed)

      // Heuristic confidence: do trip totals sum to bill total?
      const tripsTotal = validated.trips.reduce((sum, t) => {
        const extras = Object.values(t.extra_charges).reduce((a, b) => a + (b ?? 0), 0)
        return sum + t.base_amount + extras
      }, 0)
      const arithmetic_check_passed = Math.abs(tripsTotal - validated.total_amount) < (validated.total_amount * 0.02)

      // Find low confidence fields
      const low_confidence_fields: string[] = []
      validated.trips.forEach((t, i) => {
        if (t.lr_number_confidence === 'low') low_confidence_fields.push(`trip[${i}].lr_number`)
        if (t.trip_date_confidence === 'low') low_confidence_fields.push(`trip[${i}].trip_date`)
        if (t.overall_confidence < 0.75) low_confidence_fields.push(`trip[${i}].overall`)
      })

      const overall_confidence = arithmetic_check_passed
        ? validated.trips.reduce((s, t) => s + t.overall_confidence, 0) / Math.max(validated.trips.length, 1)
        : Math.min(
            validated.trips.reduce((s, t) => s + t.overall_confidence, 0) / Math.max(validated.trips.length, 1),
            0.75
          )

      return { ...validated, arithmetic_check_passed, overall_confidence, low_confidence_fields }
    } catch (err) {
      lastError = err as Error
      console.error(`Extraction attempt ${attempt} failed:`, err)
      if (attempt < maxRetries) await sleep(attempt * 2000)
    }
  }

  throw new Error(`Extraction failed after ${maxRetries} attempts: ${lastError?.message}`)
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
