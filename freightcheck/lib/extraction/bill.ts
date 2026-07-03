import { claudeClient, documentContentBlock, extractionModel, SourceDocument } from "@/lib/anthropic";
import { billExtractionSchema, type BillExtraction } from "./schema";

const RECORD_BILL_TOOL = {
  name: "record_bill_extraction",
  description:
    "Record every trip line item found in a transporter's freight bill, exactly as billed.",
  input_schema: {
    type: "object" as const,
    properties: {
      bill_number: { type: ["string", "null"] },
      bill_date: { type: ["string", "null"], description: "ISO yyyy-mm-dd" },
      transporter_name: { type: ["string", "null"] },
      trips: {
        type: "array",
        items: {
          type: "object",
          properties: {
            lr_number: { type: ["string", "null"] },
            trip_date: { type: ["string", "null"], description: "ISO yyyy-mm-dd" },
            origin: { type: "string" },
            destination: { type: "string" },
            vehicle_number: { type: ["string", "null"] },
            vehicle_type: { type: ["string", "null"] },
            base_amount: { type: "number" },
            extra_charges: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["detention", "loading", "unloading", "toll", "other"],
                  },
                  amount: { type: "number" },
                  description: { type: ["string", "null"] },
                },
                required: ["type", "amount", "description"],
              },
            },
            extraction_confidence: {
              type: "number",
              description:
                "0 to 1. Lower this whenever a figure is illegible, handwritten, smudged, or ambiguous rather than guessing with false confidence.",
            },
            notes: {
              type: ["string", "null"],
              description: "Anything unusual: illegible field, inconsistent totals, altered figures.",
            },
          },
          required: [
            "lr_number",
            "trip_date",
            "origin",
            "destination",
            "vehicle_number",
            "vehicle_type",
            "base_amount",
            "extra_charges",
            "extraction_confidence",
            "notes",
          ],
        },
      },
    },
    required: ["bill_number", "bill_date", "transporter_name", "trips"],
  },
};

const SYSTEM_PROMPT = `You are extracting line items from an Indian road-freight transporter's bill. \
These are frequently scanned PDFs, phone photos, or Excel annexures with inconsistent formats, \
handwritten LR numbers, and mixed Hindi/English text. Extract every trip line exactly as billed — \
do not compute what it "should" be, do not silently correct suspicious values, and do not skip \
lines you find hard to read. If a field is illegible, set it to null and lower extraction_confidence \
for that line rather than guessing. Report every rupee figure exactly as printed.`;

export async function extractBillTrips(doc: SourceDocument): Promise<BillExtraction> {
  const response = await claudeClient().messages.create({
    model: extractionModel(),
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    tools: [RECORD_BILL_TOOL],
    tool_choice: { type: "tool", name: RECORD_BILL_TOOL.name },
    messages: [
      {
        role: "user",
        content: [
          documentContentBlock(doc),
          {
            type: "text",
            text: `Extract every trip line item from this freight bill (${doc.filename}). Call record_bill_extraction with the full list.`,
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a structured bill extraction.");
  }

  return billExtractionSchema.parse(toolUse.input);
}
