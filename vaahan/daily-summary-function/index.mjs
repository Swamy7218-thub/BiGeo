import { CloudWatchClient, GetMetricStatisticsCommand } from "@aws-sdk/client-cloudwatch";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const region = process.env.AWS_REGION || "ap-south-1";
const cw = new CloudWatchClient({ region });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
const ses = new SESClient({ region });

async function getLambdaMetric(metricName, stat, hours = 24) {
  const end = new Date();
  const start = new Date(end - hours * 60 * 60 * 1000);
  const res = await cw.send(new GetMetricStatisticsCommand({
    Namespace: "AWS/Lambda",
    MetricName: metricName,
    Dimensions: [{ Name: "FunctionName", Value: "vaahan-parse-address" }],
    StartTime: start,
    EndTime: end,
    Period: hours * 3600,
    Statistics: [stat],
  }));
  return res.Datapoints?.[0]?.[stat] ?? 0;
}

async function getTopDistricts() {
  const today = new Date();
  const monthKey = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}`;

  const res = await ddb.send(new ScanCommand({
    TableName: "bigeo-address-graph",
    FilterExpression: "begins_with(PK, :prefix)",
    ExpressionAttributeValues: { ":prefix": "DISTRICT#" },
    ProjectionExpression: "PK",
  }));

  const counts = {};
  for (const item of res.Items || []) {
    const district = item.PK.replace("DISTRICT#", "").replace(/_/g, " ");
    counts[district] = (counts[district] || 0) + 1;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([d, c]) => `${d}: ${c} addresses`);
}

async function getActiveKeyCount() {
  const res = await ddb.send(new ScanCommand({
    TableName: "bigeo-api-keys",
    FilterExpression: "#s = :active",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":active": "active" },
    Select: "COUNT",
  }));
  return res.Count || 0;
}

export const handler = async () => {
  const [totalCalls, errors, avgLatency, activeKeys, topDistricts] = await Promise.all([
    getLambdaMetric("Invocations", "Sum"),
    getLambdaMetric("Errors", "Sum"),
    getLambdaMetric("Duration", "Average"),
    getActiveKeyCount(),
    getTopDistricts(),
  ]);

  const errorRate = totalCalls > 0 ? ((errors / totalCalls) * 100).toFixed(1) : "0.0";
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full" });

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8f9fa;">
  <div style="background:#1a1a2e;border-radius:12px;padding:24px;margin-bottom:20px;">
    <h1 style="color:#e2e8f0;font-size:1.4rem;margin:0 0 4px">Vaahan Daily Summary</h1>
    <p style="color:#94a3b8;margin:0;font-size:0.9rem">${dateStr} · BiGeo</p>
  </div>

  <div style="display:grid;gap:12px;">
    <div style="background:#fff;border-radius:10px;padding:20px;border-left:4px solid #4f46e5;">
      <div style="font-size:0.8rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Total API Calls (24h)</div>
      <div style="font-size:2rem;font-weight:800;color:#1a1a2e">${totalCalls.toLocaleString()}</div>
    </div>
    <div style="background:#fff;border-radius:10px;padding:20px;border-left:4px solid ${parseFloat(errorRate) > 5 ? "#ef4444" : "#059669"};">
      <div style="font-size:0.8rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Error Rate</div>
      <div style="font-size:2rem;font-weight:800;color:#1a1a2e">${errorRate}%</div>
    </div>
    <div style="background:#fff;border-radius:10px;padding:20px;border-left:4px solid #f59e0b;">
      <div style="font-size:0.8rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Avg Latency</div>
      <div style="font-size:2rem;font-weight:800;color:#1a1a2e">${Math.round(avgLatency)}ms</div>
    </div>
    <div style="background:#fff;border-radius:10px;padding:20px;border-left:4px solid #8b5cf6;">
      <div style="font-size:0.8rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Active API Keys</div>
      <div style="font-size:2rem;font-weight:800;color:#1a1a2e">${activeKeys}</div>
    </div>
  </div>

  <div style="background:#fff;border-radius:10px;padding:20px;margin-top:12px;">
    <div style="font-size:0.8rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px">Top Districts in Address Graph</div>
    ${topDistricts.length > 0
      ? topDistricts.map(d => `<div style="padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:0.9rem">${d}</div>`).join("")
      : '<div style="color:#94a3b8;font-size:0.9rem">No data yet</div>'
    }
  </div>

  <div style="margin-top:20px;padding:16px;background:#fff;border-radius:10px;font-size:0.85rem;color:#6b7280;">
    <a href="https://dcg4vj6njcg4v.cloudfront.net" style="color:#4f46e5">Portal</a> &nbsp;·&nbsp;
    <a href="https://ap-south-1.console.aws.amazon.com/cloudwatch/home?region=ap-south-1#dashboards" style="color:#4f46e5">CloudWatch</a>
    &nbsp;·&nbsp; BiGeo · admin@bigeo.in
  </div>
</body></html>`;

  await ses.send(new SendEmailCommand({
    Source: "admin@bigeo.in",
    Destination: { ToAddresses: ["admin@bigeo.in"] },
    Message: {
      Subject: { Data: `Vaahan Daily: ${totalCalls} calls · ${errorRate}% errors — ${dateStr}` },
      Body: { Html: { Data: html } },
    },
  }));

  console.log(`Summary sent: ${totalCalls} calls, ${errorRate}% errors, ${activeKeys} keys`);
  return { calls: totalCalls, errors, errorRate, activeKeys };
};
