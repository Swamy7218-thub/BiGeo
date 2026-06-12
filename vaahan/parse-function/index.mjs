import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { LocationClient, SearchPlaceIndexForTextCommand } from "@aws-sdk/client-location";
import { createHash } from "crypto";
import https from "https";

const region = process.env.AWS_REGION || "ap-south-1";
const TABLE_NAME = process.env.ADDRESS_TABLE || "bigeo-address-graph";
const BEDROCK_MODEL = "global.anthropic.claude-sonnet-4-6";
const GCP_PROJECT = process.env.GCP_PROJECT_ID || "bigeo-491617";
const GCP_SECRET_ARN = process.env.GCP_SECRET_ARN || "arn:aws:secretsmanager:ap-south-1::secret:bigeo/gcp-service-account";
const PLACE_INDEX = process.env.LOCATION_PLACE_INDEX || "bigeo-place-index";

// Route config: "gemini" | "claude" | "auto" (default: auto = gemini first, claude fallback)
const MODEL_ROUTE = process.env.MODEL_ROUTE || "auto";

const bedrockClient = new BedrockRuntimeClient({ region });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
const smClient = new SecretsManagerClient({ region });
const locationClient = new LocationClient({ region });

// ── GCP credential cache (warm across Lambda invocations) ──
let _gcpAccessToken = null;
let _gcpTokenExpiry = 0;

async function getGCPAccessToken() {
  if (_gcpAccessToken && Date.now() < _gcpTokenExpiry - 60000) return _gcpAccessToken;
  const secret = await smClient.send(new GetSecretValueCommand({ SecretId: GCP_SECRET_ARN }));
  const key = JSON.parse(secret.SecretString);
  const token = await fetchGCPTokenFromKey(key);
  _gcpAccessToken = token.access_token;
  _gcpTokenExpiry = Date.now() + token.expires_in * 1000;
  return _gcpAccessToken;
}

function fetchGCPTokenFromKey(key) {
  return new Promise((resolve, reject) => {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })).toString("base64url");
    import("crypto").then(({ createSign }) => {
      const sign = createSign("RSA-SHA256");
      sign.update(`${header}.${payload}`);
      const sig = sign.sign(key.private_key, "base64url");
      const jwt = `${header}.${payload}.${sig}`;
      const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
      const req = https.request(
        { hostname: "oauth2.googleapis.com", path: "/token", method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(body) } },
        (res) => {
          let data = "";
          res.on("data", (d) => (data += d));
          res.on("end", () => resolve(JSON.parse(data)));
        }
      );
      req.on("error", reject);
      req.write(body);
      req.end();
    });
  });
}

// ── Translation: detect + translate to English if needed ──
async function translateIfNeeded(text) {
  try {
    const token = await getGCPAccessToken();
    const body = JSON.stringify({ q: text, target: "en", format: "text" });
    return await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: "translation.googleapis.com",
        path: `/language/translate/v2?key=unused`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Content-Length": Buffer.byteLength(body),
        },
      }, (res) => {
        let data = "";
        res.on("data", (d) => (data += d));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            const translated = parsed?.data?.translations?.[0];
            if (translated) {
              resolve({
                text: translated.translatedText,
                detected_language: translated.detectedSourceLanguage || "en",
              });
            } else {
              resolve({ text, detected_language: "en" });
            }
          } catch { resolve({ text, detected_language: "en" }); }
        });
      });
      req.on("error", () => resolve({ text, detected_language: "en" }));
      req.write(body);
      req.end();
    });
  } catch {
    return { text, detected_language: "en" };
  }
}

// ── Amazon Location Service: precise GPS from HERE Maps ──
// Called after AI structures the address — gives verified coordinates vs AI estimates
async function lookupWithLocationService(structuredAddress, district, state) {
  try {
    const query = [structuredAddress, district, state, "India"]
      .filter(Boolean).join(", ");

    const cmd = new SearchPlaceIndexForTextCommand({
      IndexName: PLACE_INDEX,
      Text: query,
      MaxResults: 1,
      // Bias toward India's geographic center to avoid false matches abroad
      BiasPosition: [78.9629, 20.5937],
      FilterCountries: ["IND"],
    });

    const response = await locationClient.send(cmd);
    const result = response.Results?.[0];
    if (!result) return null;

    const [lng, lat] = result.Place.Geometry.Point;
    const relevance = result.Relevance || 0;

    // Only use Location Service result if relevance is reasonable
    if (relevance < 0.3) return null;

    return {
      lat: Math.round(lat * 100000) / 100000,
      lng: Math.round(lng * 100000) / 100000,
      location_relevance: relevance,
      location_label: result.Place.Label,
    };
  } catch (err) {
    console.warn("Location Service lookup failed:", err.message);
    return null;
  }
}

// ── Gemini Flash address parser ──
async function callGemini(address) {
  const token = await getGCPAccessToken();
  const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT}/locations/us-central1/publishers/google/models/gemini-2.0-flash-001:generateContent`;
  const prompt = `You are an expert at parsing Indian rural addresses, especially from Telangana, Andhra Pradesh, and other Tier-3/Tier-4 regions.

Parse this address and return ONLY valid JSON with these fields:
- structured_address: cleaned readable version
- village: village or locality name
- mandal: mandal/tehsil/block name
- district: district name
- state: state name
- pincode: 6-digit India Post pincode or null
- lat: latitude decimal degrees (best estimate) or null
- lng: longitude decimal degrees (best estimate) or null
- confidence_score: 0.0-1.0

Rules: Return ONLY JSON. Normalize official spellings. For Telangana villages, use known geography.

Address: "${address}"`;

  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 512, responseMimeType: "application/json" },
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "us-central1-aiplatform.googleapis.com",
      path: `/v1/projects/${GCP_PROJECT}/locations/us-central1/publishers/google/models/gemini-2.0-flash-001:generateContent`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Content-Length": Buffer.byteLength(body),
      },
    }, (res) => {
      let data = "";
      res.on("data", (d) => (data += d));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) throw new Error("Empty Gemini response");
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          resolve(JSON.parse(jsonMatch ? jsonMatch[0] : text));
        } catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ── Claude Sonnet (Bedrock) — high-accuracy fallback ──
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

async function callClaude(address) {
  const command = new InvokeModelCommand({
    modelId: BEDROCK_MODEL,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Parse this address:\n"${address}"\n\nReturn JSON only.` }],
    }),
  });
  const response = await bedrockClient.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));
  const text = result.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : text);
}

// ── Cache helpers ──
function addressHash(address) {
  return createHash("sha256")
    .update(address.toLowerCase().replace(/\s+/g, " ").trim())
    .digest("hex").slice(0, 16);
}

async function getCached(rawAddress) {
  const hash = addressHash(rawAddress);
  try {
    const result = await ddb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `HASH#${hash}`, SK: "PARSED" },
    }));
    return result.Item ? result.Item.parsed : null;
  } catch { return null; }
}

async function writeCache(parsed, rawAddress, model) {
  const hash = addressHash(rawAddress);
  const district = (parsed.district || "UNKNOWN").toUpperCase().replace(/\s+/g, "_");
  const village = (parsed.village || "UNKNOWN").toUpperCase().replace(/\s+/g, "_");
  const now = new Date().toISOString();
  const item = { ...parsed, input_address: rawAddress, created_at: now, model_used: model,
    ttl: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 };
  await Promise.all([
    ddb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: { PK: `HASH#${hash}`, SK: "PARSED", parsed: item, created_at: now },
    })),
    ddb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: { PK: `DISTRICT#${district}`, SK: `VILLAGE#${village}#ADDRESS#${hash}`, ...item },
    })),
  ]);
}

// ── Main handler ──
export const handler = async (event) => {
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON body" }) }; }

  const { address } = body;
  if (!address || typeof address !== "string" || address.trim().length < 5) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "address field required (min 5 chars)" }) };
  }

  const start = Date.now();
  const cleanAddress = address.trim();

  // 1. Cache check
  const cached = await getCached(cleanAddress);
  if (cached) {
    return { statusCode: 200, headers, body: JSON.stringify({
      input_address: cleanAddress, ...cached,
      latency_ms: Date.now() - start, source: "cache",
    })};
  }

  // 2. Translate if non-English
  let processedAddress = cleanAddress;
  let detectedLang = "en";
  const hasNonLatin = /[ऀ-ॿఀ-౿ಀ-೿]/.test(cleanAddress);
  if (hasNonLatin) {
    const translated = await translateIfNeeded(cleanAddress);
    processedAddress = translated.text;
    detectedLang = translated.detected_language;
    console.log(`Translated from ${detectedLang}: "${cleanAddress}" → "${processedAddress}"`);
  }

  // 3. Model routing: gemini first (cheap+fast), claude fallback (accurate)
  let parsed = null;
  let modelUsed = null;

  const gcpReady = GCP_SECRET_ARN && !GCP_SECRET_ARN.includes("::");

  if (MODEL_ROUTE === "claude" || !gcpReady) {
    parsed = await callClaude(processedAddress);
    modelUsed = "claude-sonnet";
  } else if (MODEL_ROUTE === "gemini") {
    parsed = await callGemini(processedAddress);
    modelUsed = "gemini-2.0-flash";
  } else {
    // auto: try Gemini first, fallback to Claude if confidence low or error
    try {
      parsed = await callGemini(processedAddress);
      modelUsed = "gemini-2.0-flash";
      if ((parsed?.confidence_score || 0) < 0.6) {
        console.log(`Gemini low confidence (${parsed?.confidence_score}), escalating to Claude`);
        const claudeParsed = await callClaude(processedAddress);
        if ((claudeParsed?.confidence_score || 0) > (parsed?.confidence_score || 0)) {
          parsed = claudeParsed;
          modelUsed = "claude-sonnet-upgrade";
        }
      }
    } catch (geminiErr) {
      console.warn("Gemini failed, falling back to Claude:", geminiErr.message);
      parsed = await callClaude(processedAddress);
      modelUsed = "claude-sonnet-fallback";
    }
  }

  // 4. Enhance coordinates with Amazon Location Service (HERE Maps)
  //    AI gives us structured address fields; Location Service gives precise GPS
  let gpsSource = "ai";
  if (parsed?.structured_address || parsed?.village) {
    const loc = await lookupWithLocationService(
      parsed.structured_address || `${parsed.village}, ${parsed.mandal}`,
      parsed.district,
      parsed.state || "Telangana"
    );
    if (loc) {
      console.log(`Location Service enhanced GPS: ${loc.lat},${loc.lng} (relevance: ${loc.location_relevance})`);
      parsed.lat = loc.lat;
      parsed.lng = loc.lng;
      parsed.location_label = loc.location_label;
      // Boost confidence when Location Service verifies the coordinates
      parsed.confidence_score = Math.min(0.99, (parsed.confidence_score || 0.7) + 0.08);
      gpsSource = "here-maps";
    }
  }

  const latencyMs = Date.now() - start;

  // Write cache async
  writeCache(parsed, cleanAddress, modelUsed).catch(err => console.error("Cache write error:", err));

  return { statusCode: 200, headers, body: JSON.stringify({
    input_address: cleanAddress,
    ...parsed,
    latency_ms: latencyMs,
    model: modelUsed,
    gps_source: gpsSource,
    detected_language: detectedLang !== "en" ? detectedLang : undefined,
    source: "ai",
  })};
};
