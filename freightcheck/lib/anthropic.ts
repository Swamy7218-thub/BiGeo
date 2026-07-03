import Anthropic from "@anthropic-ai/sdk";
import { AnthropicBedrock } from "@anthropic-ai/bedrock-sdk";

type ClaudeProvider = "anthropic" | "bedrock";

function resolveProvider(): ClaudeProvider {
  const raw = (process.env.CLAUDE_PROVIDER ?? "anthropic").toLowerCase();
  if (raw !== "anthropic" && raw !== "bedrock") {
    throw new Error(`CLAUDE_PROVIDER must be "anthropic" or "bedrock", got "${raw}".`);
  }
  return raw;
}

let anthropicClient: Anthropic | null = null;
let bedrockClient: AnthropicBedrock | null = null;

/**
 * Claude client for document extraction. Defaults to the direct Anthropic
 * API; set CLAUDE_PROVIDER=bedrock to route the same calls through Amazon
 * Bedrock instead (e.g. to draw down AWS credits) — both SDKs expose the
 * same messages.create() interface, so nothing downstream needs to branch.
 */
export function claudeClient(): Anthropic | AnthropicBedrock {
  const provider = resolveProvider();

  if (provider === "bedrock") {
    if (!bedrockClient) {
      // Picks up AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_SESSION_TOKEN
      // via the standard AWS credential provider chain.
      bedrockClient = new AnthropicBedrock({
        awsRegion: process.env.AWS_REGION ?? "us-east-1",
      });
    }
    return bedrockClient;
  }

  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Add it to .env.local, or set CLAUDE_PROVIDER=bedrock to use AWS credentials instead."
      );
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * Model IDs differ by provider: the direct API uses short names like
 * "claude-sonnet-4-5", Bedrock uses provider-prefixed IDs (or cross-region
 * inference profile IDs) copied from the Bedrock console's model catalog —
 * there's no safe default to guess, so it must be set explicitly.
 */
export function extractionModel(): string {
  const provider = resolveProvider();
  if (provider === "bedrock") {
    const modelId = process.env.BEDROCK_MODEL_ID;
    if (!modelId) {
      throw new Error(
        "BEDROCK_MODEL_ID is not set. Copy the exact model or inference-profile ID for Claude Sonnet from the Bedrock console's model catalog."
      );
    }
    return modelId;
  }
  return process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";
}

export type SourceDocument = {
  data: Buffer;
  mediaType: "application/pdf" | "image/jpeg" | "image/png" | "text/plain";
  filename: string;
};

export function documentContentBlock(doc: SourceDocument) {
  if (doc.mediaType === "text/plain") {
    return {
      type: "text" as const,
      text: doc.data.toString("utf-8"),
    };
  }
  if (doc.mediaType === "application/pdf") {
    return {
      type: "document" as const,
      source: {
        type: "base64" as const,
        media_type: doc.mediaType,
        data: doc.data.toString("base64"),
      },
    };
  }
  return {
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: doc.mediaType,
      data: doc.data.toString("base64"),
    },
  };
}
