import { claudeClient, documentContentBlock, extractionModel, SourceDocument } from "@/lib/anthropic";
import { rateContractExtractionSchema, type RateContractExtraction } from "./schema";

const RECORD_CONTRACT_TOOL = {
  name: "record_rate_contract",
  description: "Record every lane rate line from a transporter rate contract.",
  input_schema: {
    type: "object" as const,
    properties: {
      transporter_name: { type: ["string", "null"] },
      valid_from: { type: ["string", "null"], description: "ISO yyyy-mm-dd" },
      valid_to: { type: ["string", "null"], description: "ISO yyyy-mm-dd" },
      rate_lines: {
        type: "array",
        items: {
          type: "object",
          properties: {
            origin: { type: "string" },
            destination: { type: "string" },
            vehicle_type: { type: "string" },
            rate: { type: "number" },
            rate_basis: { type: "string", enum: ["per_trip", "per_km", "per_ton"] },
            detention_free_days: { type: ["number", "null"] },
            detention_rate_per_day: { type: ["number", "null"] },
            diesel_escalation_clause: {
              type: ["string", "null"],
              description: "Verbatim clause text if present, e.g. a diesel price escalation formula.",
            },
          },
          required: [
            "origin",
            "destination",
            "vehicle_type",
            "rate",
            "rate_basis",
            "detention_free_days",
            "detention_rate_per_day",
            "diesel_escalation_clause",
          ],
        },
      },
    },
    required: ["transporter_name", "valid_from", "valid_to", "rate_lines"],
  },
};

const SYSTEM_PROMPT = `You are extracting a structured rate master from an Indian road-freight rate \
contract (PDF or Excel). Contracts vary widely: some price per trip, some per km, some per ton. \
Detention terms and diesel escalation clauses are often buried in footnotes or a separate clause \
section — read the whole document before concluding a lane has no detention terms. Extract every \
lane/vehicle-type combination as its own rate line.`;

export async function extractRateContract(doc: SourceDocument): Promise<RateContractExtraction> {
  const response = await claudeClient().messages.create({
    model: extractionModel(),
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    tools: [RECORD_CONTRACT_TOOL],
    tool_choice: { type: "tool", name: RECORD_CONTRACT_TOOL.name },
    messages: [
      {
        role: "user",
        content: [
          documentContentBlock(doc),
          {
            type: "text",
            text: `Extract the full rate master from this contract (${doc.filename}). Call record_rate_contract with every lane/vehicle-type rate line, including detention and diesel clauses.`,
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a structured rate contract extraction.");
  }

  return rateContractExtractionSchema.parse(toolUse.input);
}
