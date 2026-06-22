# BiGeo Daily Intelligence Agent

One Lambda, one EventBridge schedule, one DynamoDB dedup table, SES delivery.
Pulls free RSS/arXiv feeds, asks Bedrock Claude to synthesize a short
strategy briefing for BiGeo, emails it once a day.

No OpenSearch, no dashboard, no chat bots, no Cognito — add those later only
if the daily email itself proves valuable.

## Prerequisites (do these before `terraform apply`)

1. **Verify the sender identity in SES**: `admin@bigeo.in` must be a verified
   identity (domain or single email) in SES for `ap-south-1`, and the
   account must be out of the SES sandbox (or the recipient must also be a
   verified address while in sandbox mode).
   ```
   aws ses verify-domain-identity --domain bigeo.in --region ap-south-1
   # or, for a quick start while in sandbox:
   aws ses verify-email-identity --email-address admin@bigeo.in --region ap-south-1
   ```
2. **Bedrock model access**: confirm `anthropic.claude-3-5-sonnet-20241022-v2:0`
   is enabled for this account in `ap-south-1` (Bedrock console → Model access).
3. **hashicorp/archive provider**: added to `main.tf` — needed to zip the
   Lambda package from `terraform apply` (no separate CI build step in v1).

## Cost

Lambda + EventBridge + DynamoDB at 1 invocation/day are effectively free.
The only real variable cost is one Bedrock Claude call per day (well under
$1/month at this volume).

## Deploy

From `platform/infrastructure/terraform/`, the resources live in
`intel-agent.tf` and apply alongside the rest of the stack:
```
terraform plan -out=tfplan
terraform apply tfplan
```

## Testing without waiting for the schedule

```
aws lambda invoke --function-name bigeo-platform-intel-agent --region ap-south-1 out.json
cat out.json
```

## What it deliberately does NOT do (v1 scope)

No OpenSearch/semantic search, no web dashboard, no Slack/Teams/WhatsApp/
Telegram, no patent/job-posting monitoring, no weekly trend report. The
spec this was built against asked for all of that; cut to keep this a
single cheap Lambda instead of a platform. Revisit once the daily email
has been read for a couple of weeks and a specific gap shows up.
