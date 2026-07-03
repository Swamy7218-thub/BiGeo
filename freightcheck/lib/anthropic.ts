import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Add it to .env.local before running extraction."
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

// Claude Sonnet handles scanned invoices, handwritten LRs, and mixed
// Hindi/English text natively — no fine-tuning or template matching needed.
export const EXTRACTION_MODEL = "claude-sonnet-4-5" as const;

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
