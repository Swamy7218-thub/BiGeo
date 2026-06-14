/**
 * BiGeo VAAHAN Bulk Parse Lambda
 *
 * POST /parse/bulk
 * Body: { "addresses": ["addr1", "addr2", ...] }  (max 1000)
 *
 * Invokes the parse Lambda for each address in parallel batches of 20,
 * collects results, and returns them in the same order as input.
 */

import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || "ap-south-1";
const PARSE_FUNCTION = process.env.PARSE_FUNCTION_NAME || "vaahan-parse-address";
const KEYS_TABLE = process.env.KEYS_TABLE || "bigeo-api-keys";
const MAX_ADDRESSES = 1000;
const BATCH_SIZE = 20;

const lambda = new LambdaClient({ region });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

// ── API key validation ─────────────────────────────────────────────────────
async function validateApiKey(key) {
  if (!key) return null;
  try {
    const res = await ddb.send(new GetCommand({
      TableName: KEYS_TABLE,
      Key: { PK: `KEY#${key}` },
    }));
    return res.Item || null;
  } catch {
    return null;
  }
}

// ── Invoke single parse ────────────────────────────────────────────────────
async function parseSingle(address, apiKey) {
  const payload = JSON.stringify({
    body: JSON.stringify({ address }),
    headers: { "x-api-key": apiKey },
    requestContext: { http: { method: "POST" } },
  });

  try {
    const res = await lambda.send(new InvokeCommand({
      FunctionName: PARSE_FUNCTION,
      InvocationType: "RequestResponse",
      Payload: Buffer.from(payload),
    }));
    const result = JSON.parse(Buffer.from(res.Payload).toString());
    return JSON.parse(result.body || "{}");
  } catch (err) {
    return { input_address: address, error: err.message };
  }
}

// ── Process in parallel batches ───────────────────────────────────────────
async function processBatches(addresses, apiKey) {
  const results = new Array(addresses.length);

  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    const slice = addresses.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      slice.map(addr => parseSingle(addr, apiKey))
    );
    batchResults.forEach((r, j) => { results[i + j] = r; });
    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: processed ${Math.min(i + BATCH_SIZE, addresses.length)}/${addresses.length}`);
  }

  return results;
}

// ── Main handler ──────────────────────────────────────────────────────────
export const handler = async (event) => {
  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers: CORS, body: "" };
  }

  // Auth
  const apiKey = event.headers?.["x-api-key"] || event.headers?.["X-Api-Key"];
  const keyRecord = await validateApiKey(apiKey);
  if (!keyRecord) {
    return {
      statusCode: 401,
      headers: CORS,
      body: JSON.stringify({ error: "Invalid or missing API key. Register at https://bigeo.in" }),
    };
  }

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON body" }) }; }

  const { addresses } = body;
  if (!Array.isArray(addresses) || addresses.length === 0) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: "addresses must be a non-empty array" }),
    };
  }
  if (addresses.length > MAX_ADDRESSES) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: `Maximum ${MAX_ADDRESSES} addresses per request. Split into multiple requests.` }),
    };
  }

  const invalid = addresses.filter(a => typeof a !== "string" || a.trim().length < 5);
  if (invalid.length > 0) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({
        error: `${invalid.length} addresses are invalid (must be strings, min 5 chars)`,
        invalid_samples: invalid.slice(0, 3),
      }),
    };
  }

  const start = Date.now();
  console.log(`Bulk parse: ${addresses.length} addresses for key ${apiKey.slice(0, 8)}...`);

  const results = await processBatches(addresses, apiKey);

  const succeeded = results.filter(r => !r.error).length;
  const failed = results.filter(r => r.error).length;
  const totalMs = Date.now() - start;

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      total: addresses.length,
      succeeded,
      failed,
      latency_ms: totalMs,
      avg_latency_ms: Math.round(totalMs / addresses.length),
      results,
    }),
  };
};
