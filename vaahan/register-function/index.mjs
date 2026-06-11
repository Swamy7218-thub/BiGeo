import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { randomUUID } from "crypto";

const region = process.env.AWS_REGION || "ap-south-1";
const TABLE_NAME = process.env.KEYS_TABLE || "bigeo-api-keys";
const FROM_EMAIL = process.env.FROM_EMAIL || "admin@bigeo.in";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
const ses = new SESClient({ region: "ap-south-1" });

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendWelcomeEmail(email, company, apiKey) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a2e;">Welcome to Vaahan by BiGeo</h2>
  <p>Hi ${company},</p>
  <p>Your API key is ready. Start resolving rural Indian addresses in seconds.</p>

  <div style="background: #f4f4f8; border-left: 4px solid #4f46e5; padding: 16px; margin: 24px 0; font-family: monospace; font-size: 14px; word-break: break-all;">
    ${apiKey}
  </div>

  <h3>Quick Start</h3>
  <pre style="background: #1a1a2e; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px;">curl -X POST https://v34s17v3h2.execute-api.ap-south-1.amazonaws.com/v1/parse \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{"address": "Near banyan tree, Yellareddyguda, Siddipet"}'</pre>

  <h3>Free Tier</h3>
  <ul>
    <li>500 API calls / month</li>
    <li>Every call returns: village, mandal, district, state, pincode, GPS coordinates, confidence score</li>
    <li>Under 2 seconds response time</li>
  </ul>

  <p>Questions? Reply to this email or visit <a href="https://bigeo.in/api">bigeo.in/api</a></p>

  <p style="color: #666; font-size: 12px; margin-top: 32px;">
    BiGeo · Resolving rural India · bigeo.in
  </p>
</body>
</html>`;

  await ses.send(new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: "Your Vaahan API Key — BiGeo" },
      Body: {
        Html: { Data: html },
        Text: {
          Data: `Welcome to Vaahan by BiGeo\n\nYour API key: ${apiKey}\n\nFree tier: 500 calls/month\n\nQuick start:\ncurl -X POST https://v34s17v3h2.execute-api.ap-south-1.amazonaws.com/v1/parse \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: ${apiKey}" \\\n  -d '{"address": "Near banyan tree, Yellareddyguda, Siddipet"}'\n\nBiGeo · bigeo.in`,
        },
      },
    },
  }));
}

export const handler = async (event) => {
  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const { company_name, email } = body;

  if (!company_name || typeof company_name !== "string" || company_name.trim().length < 2) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "company_name is required (min 2 characters)" }) };
  }
  if (!email || !validateEmail(email)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Valid email is required" }) };
  }

  const apiKey = randomUUID().replace(/-/g, "");
  const now = new Date().toISOString();

  try {
    await ddb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `KEY#${apiKey}`,
        api_key: apiKey,
        company_name: company_name.trim(),
        email: email.toLowerCase().trim(),
        status: "active",
        calls_this_month: 0,
        month_key: "",
        created_at: now,
        last_used_at: null,
      },
      ConditionExpression: "attribute_not_exists(PK)",
    }));
  } catch (err) {
    console.error("DDB error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Registration failed" }) };
  }

  // Send email — if SES not yet verified, log and continue
  try {
    await sendWelcomeEmail(email.toLowerCase().trim(), company_name.trim(), apiKey);
  } catch (err) {
    console.warn("SES send failed (may need verification):", err.message);
  }

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({
      message: "Registration successful",
      api_key: apiKey,
      company_name: company_name.trim(),
      email: email.toLowerCase().trim(),
      free_tier_calls: 500,
      note: "API key sent to your email. Keep it safe.",
    }),
  };
};
