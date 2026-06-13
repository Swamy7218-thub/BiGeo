# BiGeo Monitoring & Protection

## CloudWatch Alarms (18 active)
- Per-Lambda: error count ≥ 3 in 5min → ALARM
- Per-Lambda: avg duration exceeds threshold → ALARM
  - parse-address: 30,000ms (30s)
  - all others: 10,000ms (10s)
- API Gateway: 4xx ≥ 100 in 5min → ALARM (abuse detection)
- API Gateway: 5xx ≥ 10 in 5min → ALARM (server errors)

## AWS Budget
- Name: bigeo-monthly-500
- Limit: $500 USD/month
- Alerts: 80% actual, 100% actual, 100% forecasted → admin@bigeo.in

## WAF (Regional)
- Name: bigeo-api-waf
- Rate limit: 500 req/5min per IP → Block
- AWS Managed Rules: CommonRuleSet + KnownBadInputsRuleSet
- Note: HTTP API v2 doesn't support direct WAF association via CLI.
  WAF is provisioned; attach via API Gateway console → Stages → v1 → Web ACL

## API Gateway Throttling (active)
- Stage: v1
- Burst limit: 100 req/sec
- Rate limit: 50 req/sec steady state
- Detailed metrics: enabled
