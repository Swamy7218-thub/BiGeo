import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockAgentRuntimeClient, RetrieveCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { LocationClient, SearchPlaceIndexForTextCommand } from "@aws-sdk/client-location";
import { createHash } from "crypto";
import https from "https";

const MIXPANEL_TOKEN = process.env.MIXPANEL_TOKEN || "da78fa74ae650b4ddd5b327a1be9511c";

function trackMixpanel(event, properties) {
  const data = Buffer.from(JSON.stringify({
    event,
    properties: { token: MIXPANEL_TOKEN, distinct_id: "server", ...properties },
  })).toString("base64");
  const req = https.request(
    { hostname: "api.mixpanel.com", path: "/track", method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    () => {}
  );
  req.on("error", () => {});
  req.write("data=" + encodeURIComponent(data));
  req.end();
}

const region = process.env.AWS_REGION || "ap-south-1";
const TABLE_NAME = process.env.ADDRESS_TABLE || "bigeo-address-graph";
const BEDROCK_MODEL = "global.anthropic.claude-sonnet-4-6";
const GCP_PROJECT = process.env.GCP_PROJECT_ID || "bigeo-491617";
const GCP_SECRET_ARN = process.env.GCP_SECRET_ARN || "arn:aws:secretsmanager:ap-south-1::secret:bigeo/gcp-service-account";
const GMAPS_SECRET_ARN = process.env.GMAPS_SECRET_ARN || "arn:aws:secretsmanager:ap-south-1:841162683979:secret:bigeo/google-maps-api-key-JseBtB";
const PLACE_INDEX = process.env.LOCATION_PLACE_INDEX || "bigeo-place-index";
const KB_ID = process.env.BEDROCK_KB_ID || "ZFLJ7NGEMF";

// Route config: "gemini" | "claude" | "auto" (default: auto = gemini first, claude fallback)
const MODEL_ROUTE = process.env.MODEL_ROUTE || "auto";

const bedrockClient = new BedrockRuntimeClient({ region });
const bedrockAgentRuntime = new BedrockAgentRuntimeClient({ region });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
const smClient = new SecretsManagerClient({ region });
const locationClient = new LocationClient({ region });

// ── Google Maps API key cache ──
let _gmapsApiKey = null;
async function getGMapsKey() {
  if (_gmapsApiKey) return _gmapsApiKey;
  const secret = await smClient.send(new GetSecretValueCommand({ SecretId: GMAPS_SECRET_ARN }));
  _gmapsApiKey = secret.SecretString.trim();
  return _gmapsApiKey;
}

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

// ── Bedrock Knowledge Base: semantic lookup for village/mandal resolution ──
async function lookupInKnowledgeBase(query) {
  try {
    const cmd = new RetrieveCommand({
      knowledgeBaseId: KB_ID,
      retrievalQuery: { text: query },
      retrievalConfiguration: {
        vectorSearchConfiguration: { numberOfResults: 3 }
      }
    });
    const res = await bedrockAgentRuntime.send(cmd);
    const hits = (res.retrievalResults || [])
      .filter(r => r.score > 0.5)
      .map(r => ({ text: r.content.text, score: r.score }));
    return hits.length > 0 ? hits[0].text : null;
  } catch (e) {
    return null;
  }
}

// ── Google Maps Geocoding: primary GPS source for rural India ──
async function geocodeWithGoogleMaps(structuredAddress, district, state) {
  try {
    const key = await getGMapsKey();
    const query = encodeURIComponent(
      [structuredAddress, district, state, "India"].filter(Boolean).join(", ")
    );
    return await new Promise((resolve) => {
      const req = https.request({
        hostname: "maps.googleapis.com",
        path: `/maps/api/geocode/json?address=${query}&key=${key}&region=in&language=en`,
        method: "GET",
      }, (res) => {
        let data = "";
        res.on("data", (d) => (data += d));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.status !== "OK" || !parsed.results?.length) {
              resolve(null);
              return;
            }
            const result = parsed.results[0];
            const loc = result.geometry.location;
            // Extract pincode from address_components if present
            const pincodeComp = result.address_components?.find(c => c.types.includes("postal_code"));
            resolve({
              lat: Math.round(loc.lat * 100000) / 100000,
              lng: Math.round(loc.lng * 100000) / 100000,
              formatted_address: result.formatted_address,
              pincode: pincodeComp?.long_name || null,
              location_type: result.geometry.location_type, // ROOFTOP | RANGE_INTERPOLATED | GEOMETRIC_CENTER | APPROXIMATE
            });
          } catch { resolve(null); }
        });
      });
      req.on("error", () => resolve(null));
      req.end();
    });
  } catch (err) {
    console.warn("Google Maps geocoding failed:", err.message);
    return null;
  }
}

// ── Amazon Location Service: HERE Maps cross-validation ──
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

    return {
      lat: Math.round(lat * 100000) / 100000,
      lng: Math.round(lng * 100000) / 100000,
      location_label: result.Place.Label,
    };
  } catch (err) {
    console.warn("Location Service lookup failed:", err.message);
    return null;
  }
}

// ── Gemini Flash address parser ──
async function callGemini(address, kbContext) {
  const token = await getGCPAccessToken();
  const contextBlock = kbContext
    ? `\n\nKnowledge Base Match (verified government data — use this if it matches):\n${kbContext}\n`
    : "";
  const prompt = `You are an expert at parsing Indian rural addresses, especially from Telangana, Andhra Pradesh, and other Tier-3/Tier-4 regions.
${contextBlock}
Parse this address and return ONLY valid JSON with these fields:
- structured_address: cleaned readable version
- village: village or locality name (use KB match if available)
- mandal: mandal/tehsil/block name (use KB match if available)
- district: district name
- state: state name
- pincode: 6-digit India Post pincode or null
- lat: null (GPS will be resolved separately)
- lng: null (GPS will be resolved separately)
- confidence_score: 0.0-1.0 (set >0.85 if KB match used)

Rules: Return ONLY JSON. Normalize official spellings. Do NOT guess lat/lng — leave null.

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

Given a raw, unstructured Indian address string (and optional knowledge base context from verified government data), extract and return a JSON object with these fields:
- structured_address: cleaned, readable version of the full address
- village: village or locality name
- mandal: mandal/tehsil/block name
- district: district name
- state: state name
- pincode: 6-digit pincode if mentioned or inferrable, else null
- lat: null (GPS resolved externally — do not guess)
- lng: null (GPS resolved externally — do not guess)
- confidence_score: 0.0 to 1.0 — how confident you are in this parsing

Rules:
- Always return valid JSON, nothing else
- If a field cannot be determined, use null — never fabricate geographic details
- When knowledge base context is provided, prioritize it over your training knowledge
- Normalize district/mandal/state names to their official spellings
- confidence_score: >0.85 if KB context used, >0.75 if all key fields found, 0.5-0.75 if partial, <0.5 if very unclear`;

async function callClaude(address, kbContext) {
  const contextBlock = kbContext
    ? `\n\nKnowledge Base Match (verified government PMGSY/postal data):\n${kbContext}\n\nUse this context to improve accuracy.`
    : "";
  const command = new InvokeModelCommand({
    modelId: BEDROCK_MODEL,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Parse this address:\n"${address}"${contextBlock}\n\nReturn JSON only.` }],
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
    trackMixpanel("Address Parsed", {
      source: "cache", state: cached.state, district: cached.district,
      confidence: cached.confidence_score, latency_ms: Date.now() - start,
    });
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

  // 3. Knowledge Base lookup — parallel with model routing for speed
  const kbContextPromise = lookupInKnowledgeBase(processedAddress);

  // 4. Model routing: gemini first (cheap+fast), claude fallback (accurate)
  let parsed = null;
  let modelUsed = null;

  const gcpReady = GCP_SECRET_ARN && !GCP_SECRET_ARN.includes("::");

  // Resolve KB context (cap wait at 2s to avoid slowing fast paths)
  let kbContext = null;
  try {
    kbContext = await Promise.race([
      kbContextPromise,
      new Promise(res => setTimeout(() => res(null), 2000)),
    ]);
    if (kbContext) console.log("KB hit:", kbContext.slice(0, 120));
  } catch { kbContext = null; }

  if (MODEL_ROUTE === "claude" || !gcpReady) {
    parsed = await callClaude(processedAddress, kbContext);
    modelUsed = "claude-sonnet";
  } else if (MODEL_ROUTE === "gemini") {
    parsed = await callGemini(processedAddress, kbContext);
    modelUsed = "gemini-2.0-flash";
  } else {
    // auto: try Gemini first, fallback to Claude if confidence low or error
    try {
      parsed = await callGemini(processedAddress, kbContext);
      modelUsed = "gemini-2.0-flash";
      if ((parsed?.confidence_score || 0) < 0.6) {
        console.log(`Gemini low confidence (${parsed?.confidence_score}), escalating to Claude`);
        const claudeParsed = await callClaude(processedAddress, kbContext);
        if ((claudeParsed?.confidence_score || 0) > (parsed?.confidence_score || 0)) {
          parsed = claudeParsed;
          modelUsed = "claude-sonnet-upgrade";
        }
      }
    } catch (geminiErr) {
      console.warn("Gemini failed, falling back to Claude:", geminiErr.message);
      parsed = await callClaude(processedAddress, kbContext);
      modelUsed = "claude-sonnet-fallback";
    }
  }

  // 4. GPS enrichment: Google Maps (primary) → HERE Maps (cross-validate)
  let gpsSource = "ai";
  const addressQuery = parsed.structured_address || `${parsed.village || ""}, ${parsed.mandal || ""}, ${parsed.district || ""}`;

  if (addressQuery.trim().length > 5) {
    // Primary: Google Maps (best rural India coverage)
    const gmaps = await geocodeWithGoogleMaps(addressQuery, parsed.district, parsed.state || "Telangana");

    if (gmaps) {
      console.log(`Google Maps GPS: ${gmaps.lat},${gmaps.lng} (${gmaps.location_type})`);
      parsed.lat = gmaps.lat;
      parsed.lng = gmaps.lng;
      if (gmaps.pincode && !parsed.pincode) parsed.pincode = gmaps.pincode;
      parsed.formatted_address = gmaps.formatted_address;
      gpsSource = "google-maps";

      // Confidence boost based on Google's location_type precision
      const precisionBoost = { ROOFTOP: 0.15, RANGE_INTERPOLATED: 0.10, GEOMETRIC_CENTER: 0.08, APPROXIMATE: 0.04 };
      parsed.confidence_score = Math.min(0.99, (parsed.confidence_score || 0.7) + (precisionBoost[gmaps.location_type] || 0.05));

      // Cross-validate with HERE Maps — if both agree within ~2km, max confidence
      const here = await lookupWithLocationService(addressQuery, parsed.district, parsed.state || "Telangana");
      if (here) {
        const distKm = Math.sqrt(Math.pow((gmaps.lat - here.lat) * 111, 2) + Math.pow((gmaps.lng - here.lng) * 111, 2));
        console.log(`HERE Maps GPS: ${here.lat},${here.lng} | Agreement distance: ${distKm.toFixed(2)}km`);
        if (distKm < 2) {
          parsed.confidence_score = Math.min(0.99, parsed.confidence_score + 0.05);
          gpsSource = "google-maps+here-verified";
        }
      }
    } else {
      // Fallback: HERE Maps only
      const here = await lookupWithLocationService(addressQuery, parsed.district, parsed.state || "Telangana");
      if (here) {
        parsed.lat = here.lat;
        parsed.lng = here.lng;
        parsed.confidence_score = Math.min(0.99, (parsed.confidence_score || 0.7) + 0.08);
        gpsSource = "here-maps";
      }
    }
  }

  const latencyMs = Date.now() - start;

  // Write cache async
  writeCache(parsed, cleanAddress, modelUsed).catch(err => console.error("Cache write error:", err));

  trackMixpanel("Address Parsed", {
    source: "ai", model: modelUsed, state: parsed.state, district: parsed.district,
    confidence: parsed.confidence_score, gps_source: gpsSource,
    latency_ms: latencyMs, detected_language: detectedLang,
    kb_used: kbContext !== null,
  });

  return { statusCode: 200, headers, body: JSON.stringify({
    input_address: cleanAddress,
    ...parsed,
    latency_ms: latencyMs,
    model: modelUsed,
    gps_source: gpsSource,
    kb_used: kbContext !== null,
    detected_language: detectedLang !== "en" ? detectedLang : undefined,
    source: "ai",
  })};
};
