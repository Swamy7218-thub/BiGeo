import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { createHash } from "crypto";

const region = process.env.AWS_REGION || "ap-south-1";
const TABLE_NAME = process.env.ADDRESS_TABLE || "bigeo-address-graph";
const MODEL_ID = "global.anthropic.claude-sonnet-4-6";

const bedrockClient = new BedrockRuntimeClient({ region });
const ddbClient = new DynamoDBClient({ region });
const ddb = DynamoDBDocumentClient.from(ddbClient);

const SYSTEM_PROMPT = `You are an expert at parsing Indian rural addresses, especially from Telangana, Andhra Pradesh, and other Tier 3/Tier 4 Indian regions.

Given a raw, unstructured Indian address string, extract and return a JSON object with these fields:
- structured_address: cleaned, readable version of the full address
- village: village or locality name
- mandal: mandal/tehsil/block name
- district: district name
- state: state name
- pincode: 6-digit pincode if mentioned or inferrable, else null
- lat: latitude (decimal degrees) if you can confidently infer from the location, else null
- lng: longitude (decimal degrees) if you can confidently infer from the location, else null
- confidence_score: 0.0 to 1.0 — how confident you are in this parsing

Rules:
- Always return valid JSON, nothing else
- If a field cannot be determined, use null
- For Siddipet district villages, use your knowledge of Telangana geography
- Normalize district/mandal/state names to their official spellings
- confidence_score: >0.8 if all key fields found, 0.5-0.8 if partial, <0.5 if very unclear`;

const FEW_SHOT = `Examples:

Input: "Near banyan tree, behind Raju's shop, Yellareddyguda, Siddipet"
Output: {"structured_address":"Yellareddyguda, Siddipet Mandal, Siddipet District, Telangana","village":"Yellareddyguda","mandal":"Siddipet","district":"Siddipet","state":"Telangana","pincode":"502103","lat":18.1018,"lng":78.8522,"confidence_score":0.82}

Input: "H.No 4-56, Komuravelli village, near temple, Medak dist"
Output: {"structured_address":"H.No 4-56, Komuravelli, Komuravelli Mandal, Siddipet District, Telangana","village":"Komuravelli","mandal":"Komuravelli","district":"Siddipet","state":"Telangana","pincode":"502319","lat":17.9825,"lng":78.6341,"confidence_score":0.85}

Input: "Opp. Zilla Parishad school, Chinnakodur, Siddipet"
Output: {"structured_address":"Opp. Zilla Parishad School, Chinnakodur, Chinnakodur Mandal, Siddipet District, Telangana","village":"Chinnakodur","mandal":"Chinnakodur","district":"Siddipet","state":"Telangana","pincode":"502103","lat":17.9967,"lng":78.8156,"confidence_score":0.83}`;

function addressHash(address) {
  return createHash("sha256")
    .update(address.toLowerCase().replace(/\s+/g, " ").trim())
    .digest("hex")
    .slice(0, 16);
}

function buildKeys(parsed, rawAddress) {
  const district = (parsed.district || "UNKNOWN").toUpperCase().replace(/\s+/g, "_");
  const village = (parsed.village || "UNKNOWN").toUpperCase().replace(/\s+/g, "_");
  const hash = addressHash(rawAddress);
  return {
    PK: `DISTRICT#${district}`,
    SK: `VILLAGE#${village}#ADDRESS#${hash}`,
  };
}

async function getCached(rawAddress) {
  // We need district+village to build the key, so we use a hash-only lookup GSI alternative:
  // store a flat lookup item with PK=HASH#<hash> for O(1) cache lookup
  const hash = addressHash(rawAddress);
  try {
    const result = await ddb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `HASH#${hash}`, SK: "PARSED" },
    }));
    return result.Item ? result.Item.parsed : null;
  } catch {
    return null;
  }
}

async function writeCache(parsed, rawAddress) {
  const hash = addressHash(rawAddress);
  const { PK, SK } = buildKeys(parsed, rawAddress);
  const now = new Date().toISOString();

  const item = {
    ...parsed,
    input_address: rawAddress,
    created_at: now,
    ttl: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365, // 1 year TTL
  };

  await Promise.all([
    // Hash-based lookup record (fast cache hit)
    ddb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: { PK: `HASH#${hash}`, SK: "PARSED", parsed: item, created_at: now },
    })),
    // Structured graph record (for analytics, district/village queries)
    ddb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: { PK, SK, ...item },
    })),
  ]);
}

async function callBedrock(address) {
  const prompt = `${FEW_SHOT}\n\nNow parse this address:\nInput: "${address}"\nOutput:`;

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const response = await bedrockClient.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));
  const text = result.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : text);
}

export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const { address } = body;
  if (!address || typeof address !== "string" || address.trim().length < 5) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "address field is required (min 5 characters)" }),
    };
  }

  const cleanAddress = address.trim();
  const start = Date.now();

  try {
    // Cache check
    const cached = await getCached(cleanAddress);
    if (cached) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          input_address: cleanAddress,
          ...cached,
          latency_ms: Date.now() - start,
          source: "cache",
        }),
      };
    }

    // Cache miss — call Bedrock
    const parsed = await callBedrock(cleanAddress);
    const latencyMs = Date.now() - start;

    // Write to cache async (don't await — keep response fast)
    writeCache(parsed, cleanAddress).catch(err => console.error("Cache write error:", err));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        input_address: cleanAddress,
        ...parsed,
        latency_ms: latencyMs,
        model: MODEL_ID,
        source: "bedrock",
      }),
    };
  } catch (err) {
    console.error("Parse error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Address parsing failed", details: err.message }),
    };
  }
};
