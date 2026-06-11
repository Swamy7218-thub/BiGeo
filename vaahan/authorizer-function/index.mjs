import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || "ap-south-1";
const TABLE_NAME = process.env.KEYS_TABLE || "bigeo-api-keys";
const FREE_TIER_LIMIT = 500;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

function monthKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const handler = async (event) => {
  const apiKey =
    event.headers?.["x-api-key"] ||
    event.headers?.["X-Api-Key"] ||
    event.queryStringParameters?.api_key;

  if (!apiKey) {
    return { isAuthorized: false, context: { error: "Missing API key" } };
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
    return { isAuthorized: false, context: { error: "Auth service error" } };
  }

  if (!item || item.status !== "active") {
    return { isAuthorized: false, context: { error: "Invalid API key" } };
  }

  const mk = monthKey();
  const calls = item.month_key === mk ? (item.calls_this_month || 0) : 0;

  if (calls >= FREE_TIER_LIMIT) {
    return {
      isAuthorized: false,
      context: {
        error: "Monthly limit reached",
        message: `Free tier limit of ${FREE_TIER_LIMIT} calls/month reached. Upgrade at bigeo.in/api`,
        calls_used: calls,
        limit: FREE_TIER_LIMIT,
      },
    };
  }

  // Increment counter async — fire and forget (keep auth fast)
  ddb.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: `KEY#${apiKey}` },
    UpdateExpression:
      "SET calls_this_month = if_not_exists(calls_this_month, :zero) + :inc, month_key = :mk, last_used_at = :now",
    ExpressionAttributeValues: {
      ":inc": 1,
      ":zero": 0,
      ":mk": mk,
      ":now": new Date().toISOString(),
    },
  })).catch(err => console.error("Counter increment error:", err));

  return {
    isAuthorized: true,
    context: {
      api_key: apiKey,
      company: item.company_name,
      email: item.email,
      calls_used: calls + 1,
      calls_remaining: FREE_TIER_LIMIT - calls - 1,
    },
  };
};
