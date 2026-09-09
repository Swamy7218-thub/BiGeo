import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PODExtractionSchema = z.object({
  lr_number: z.string(),
  delivery_date: z.string().optional(),
  receiver_name: z.string().optional(),
  receiver_signature_present: z.boolean().default(false),
  stamp_present: z.boolean().default(false),
  condition: z.enum(['good', 'damaged', 'partial']).optional(),
  remarks: z.string().optional(),
  confidence: z.number().min(0).max(1),
})

export type PODExtractionResult = z.infer<typeof PODExtractionSchema>

const SYSTEM_PROMPT = `You are a Proof of Delivery (POD) extraction system for Indian road transport.
Extract key fields from the POD document image.
Return ONLY valid JSON — no markdown, no explanation.

Schema:
{
  "lr_number": "string (LR/lorry receipt number, may be called CN No, Docket No, Consignment No)",
  "delivery_date": "YYYY-MM-DD or omit if unclear",
  "receiver_name": "string or omit",
  "receiver_signature_present": boolean,
  "stamp_present": boolean,
  "condition": "good | damaged | partial (omit if not stated)",
  "remarks": "string or omit",
  "confidence": number 0-1
}

Rules:
- LR number is critical; if unreadable set confidence < 0.5
- delivery_date: look for stamp date, received date, or date near signature
- receiver_signature_present: true if any signature/thumb impression visible
- stamp_present: true if any rubber stamp/seal visible`

export async function extractPOD(
  fileBuffer: Buffer,
  mimeType: string,
  maxRetries = 3
): Promise<PODExtractionResult> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
                data: fileBuffer.toString('base64'),
              },
            },
            { type: 'text', text: 'Extract POD details. Return JSON only.' },
          ],
        }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const parsed = JSON.parse(text.trim())
      return PODExtractionSchema.parse(parsed)
    } catch (err) {
      lastError = err as Error
      console.error(`POD extraction attempt ${attempt} failed:`, err)
      if (attempt < maxRetries) await sleep(attempt * 2000)
    }
  }

  throw new Error(`POD extraction failed after ${maxRetries} attempts: ${lastError?.message}`)
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
