import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || "ap-south-1";
const TABLE_NAME = process.env.KEYS_TABLE || "bigeo-api-keys";
const FREE_TIER_LIMIT = 500;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export const handler = async (event) => {
  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const apiKey =
    event.headers?.["x-api-key"] ||
    event.headers?.["X-Api-Key"] ||
    event.queryStringParameters?.api_key;

  if (!apiKey) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: "Missing x-api-key header" }),
    };
  }

  let item;
  try {
    const result = await ddb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `KEY#${apiKey}` },
    }));
    item = result.Item;
  } catch (err) {
    console.error("DDB error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Service error" }),
    };
  }

  if (!item || item.status !== "active") {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: "Invalid API key" }),
    };
  }

  const now = new Date();
  const mk = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const calls_used = item.month_key === mk ? (item.calls_this_month || 0) : 0;
  const calls_remaining = Math.max(0, FREE_TIER_LIMIT - calls_used);

  const resetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      company: item.company_name,
      email: item.email,
      plan: "free",
      quota: {
        limit: FREE_TIER_LIMIT,
        used: calls_used,
        remaining: calls_remaining,
        reset_date: resetDate.toISOString().split("T")[0],
        period: mk,
      },
      account: {
        status: item.status,
        registered_at: item.created_at,
        last_used_at: item.last_used_at || null,
      },
    }),
  };
};
