import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";

const region = process.env.AWS_REGION || "ap-south-1";
const ADDRESS_TABLE = process.env.ADDRESS_TABLE || "bigeo-address-graph";
const KEYS_TABLE = process.env.KEYS_TABLE || "bigeo-api-keys";

const ddb = new DynamoDBClient({ region });

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export const handler = async (event) => {
  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const start = Date.now();
  const checks = {};

  // Check both DynamoDB tables
  const tableChecks = await Promise.allSettled([
    ddb.send(new DescribeTableCommand({ TableName: ADDRESS_TABLE })),
    ddb.send(new DescribeTableCommand({ TableName: KEYS_TABLE })),
  ]);

  checks.address_graph = tableChecks[0].status === "fulfilled"
    ? { status: "ok", table_status: tableChecks[0].value.Table?.TableStatus }
    : { status: "error", error: tableChecks[0].reason?.message };

  checks.api_keys = tableChecks[1].status === "fulfilled"
    ? { status: "ok", table_status: tableChecks[1].value.Table?.TableStatus }
    : { status: "error", error: tableChecks[1].reason?.message };

  const allOk = Object.values(checks).every(c => c.status === "ok");

  return {
    statusCode: allOk ? 200 : 503,
    headers,
    body: JSON.stringify({
      status: allOk ? "ok" : "degraded",
      version: "1.0.0",
      region,
      latency_ms: Date.now() - start,
      checks,
      timestamp: new Date().toISOString(),
    }),
  };
};
