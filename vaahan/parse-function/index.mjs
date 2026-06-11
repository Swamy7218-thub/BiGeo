import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "ap-south-1" });
const MODEL_ID = "global.anthropic.claude-sonnet-4-6";

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

  try {
    const prompt = `${FEW_SHOT}\n\nNow parse this address:\nInput: "${address.trim()}"\nOutput:`;

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

    const start = Date.now();
    const response = await client.send(command);
    const latencyMs = Date.now() - start;

    const result = JSON.parse(new TextDecoder().decode(response.body));
    const text = result.content[0].text.trim();

    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: "Failed to parse model response", raw: text }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        input_address: address.trim(),
        ...parsed,
        latency_ms: latencyMs,
        model: MODEL_ID,
        source: "bedrock",
      }),
    };
  } catch (err) {
    console.error("Bedrock error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Address parsing failed", details: err.message }),
    };
  }
};
