import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const RateLineSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  vehicle_type: z.string(),
  rate: z.number(),
  rate_basis: z.enum(['per_trip', 'per_km', 'per_ton']).default('per_trip'),
  detention_free_days: z.number().default(0),
  detention_rate: z.number().default(0),
})

const ContractSchema = z.object({
  transporter_name: z.string(),
  effective_from: z.string(),
  effective_to: z.string(),
  rate_lines: z.array(RateLineSchema),
})

export type RateContractExtractionResult = z.infer<typeof ContractSchema>

const SYSTEM_PROMPT = `You are a rate contract extraction system for Indian road transport.
Extract all rate lines from the provided contract document.
Return ONLY valid JSON — no markdown, no explanation.

Schema:
{
  "transporter_name": "string",
  "effective_from": "YYYY-MM-DD",
  "effective_to": "YYYY-MM-DD",
  "rate_lines": [
    {
      "origin": "string (city)",
      "destination": "string (city)",
      "vehicle_type": "string (e.g. 14ft, 17ft, 20ft, SXL, 32ft)",
      "rate": number (INR),
      "rate_basis": "per_trip | per_km | per_ton",
      "detention_free_days": number (default 0),
      "detention_rate": number per day (default 0)
    }
  ]
}

Rules:
- Dates must be YYYY-MM-DD
- Amounts in INR, numeric only
- If detention not mentioned, use 0 for both fields`

export async function extractRateContract(
  fileBuffer: Buffer,
  mimeType: string,
  maxRetries = 3
): Promise<RateContractExtractionResult> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
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
            { type: 'text', text: 'Extract all rate lines from this rate contract. Return JSON only.' },
          ],
        }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const parsed = JSON.parse(text.trim())
      return ContractSchema.parse(parsed)
    } catch (err) {
      lastError = err as Error
      console.error(`Rate contract extraction attempt ${attempt} failed:`, err)
      if (attempt < maxRetries) await sleep(attempt * 2000)
    }
  }

  throw new Error(`Rate contract extraction failed after ${maxRetries} attempts: ${lastError?.message}`)
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
