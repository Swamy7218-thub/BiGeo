export interface ResolvedAddress {
  rawAddress: string;
  matched: boolean;
  villageId: string | null;
  confidence: number;
}

/**
 * Stub resolver. Phase 1 will replace this with a lookup against the
 * Bharat Address Graph plus a Claude-based disambiguation step.
 */
export async function resolveAddress(rawAddress: string): Promise<ResolvedAddress> {
  return {
    rawAddress,
    matched: false,
    villageId: null,
    confidence: 0,
  };
}
