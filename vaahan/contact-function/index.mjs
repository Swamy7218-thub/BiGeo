import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { randomUUID } from "crypto";

const ddb = new DynamoDBClient({ region: "ap-south-1" });
const ses = new SESClient({ region: "ap-south-1" });

const TABLE = process.env.LEADS_TABLE || "bigeo-leads";
const NOTIFY_EMAIL = "admin@bigeo.in";
const FROM_EMAIL = process.env.SES_FROM_EMAIL || "admin@bigeo.in";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS" || event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers: CORS, body: "" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { name, email, company, use_case, monthly_volume, message } = body;

  if (!name || name.trim().length < 2) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Name is required" }) };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Valid email is required" }) };
  }
  if (!use_case) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Use case is required" }) };
  }

  const leadId = randomUUID();
  const ts = new Date().toISOString();

  // Store lead in DynamoDB
  await ddb.send(new PutItemCommand({
    TableName: TABLE,
    Item: {
      lead_id:       { S: leadId },
      created_at:    { S: ts },
      name:          { S: name.trim() },
      email:         { S: email.trim().toLowerCase() },
      company:       { S: (company || "").trim() },
      use_case:      { S: use_case },
      monthly_volume:{ S: monthly_volume || "unknown" },
      message:       { S: (message || "").trim().slice(0, 2000) },
      status:        { S: "new" },
    },
  }));

  // Notify Swamy via SES (best-effort, don't fail if SES not configured)
  try {
    await ses.send(new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: { ToAddresses: [NOTIFY_EMAIL] },
      Message: {
        Subject: { Data: `BiGeo Lead: ${name} (${company || email}) — ${use_case}` },
        Body: {
          Text: {
            Data: [
              `New lead from bigeo.in`,
              ``,
              `Name:           ${name}`,
              `Email:          ${email}`,
              `Company:        ${company || "—"}`,
              `Use Case:       ${use_case}`,
              `Monthly Volume: ${monthly_volume || "—"}`,
              `Message:        ${message || "—"}`,
              ``,
              `Lead ID: ${leadId}`,
              `Time: ${ts}`,
            ].join("\n"),
          },
        },
      },
    }));
  } catch (sesErr) {
    console.error("SES send failed (non-fatal):", sesErr.message);
  }

  console.log(JSON.stringify({ event: "lead_captured", lead_id: leadId, use_case, monthly_volume }));

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({ success: true, message: "Thanks! Swamy will reach out within 24 hours." }),
  };
};
