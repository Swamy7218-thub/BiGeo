# BiGeo — MVSP Security Architecture

Minimum Viable Secure Product baseline for BiGeo VAAHAN API.
Stack: AWS Lambda (Node.js 22) · API Gateway HTTP API · DynamoDB · S3 · Bedrock · SES · ap-south-1

---

## Stack Constraints (Non-Negotiable)

| Rule | Why |
|------|-----|
| No RDS — DynamoDB only | Cost + ops complexity; exception: India Address Graph uses PostGIS by design |
| No SageMaker — Bedrock only | Cost control |
| No EC2 long-running — Lambda only | Serverless-first; EC2 only for open-source builds (tag Env=dev, stop when done) |
| All resources tagged `Project=BiGeo, Env=dev|prod` | Cost allocation + audit trail |
| AWS Credits: $10,000 active — stay under $200/month | Until first paying customer |

---

## 1. Identity and Access Management

### Lambda IAM Roles — Least Privilege

Every Lambda function MUST have its own IAM role with only the actions it needs on specific resource ARNs.

**REQUIRED pattern:**
```json
{
  "Effect": "Allow",
  "Action": ["dynamodb:GetItem", "dynamodb:PutItem"],
  "Resource": "arn:aws:dynamodb:ap-south-1:841162683979:table/bigeo-api-keys"
}
```

**FORBIDDEN:**
```json
{ "Action": "dynamodb:*", "Resource": "*" }
```

### Secrets — Never in Environment Variables

| Secret | Where to Store | Current Status |
|--------|---------------|----------------|
| HERE Maps API key | Secrets Manager: `bigeo/here-api-key` | ⚠ In env var — migrate |
| GCP service account | Secrets Manager: `bigeo/gcp-service-account` | ✅ Done |
| Google Maps API key | Secrets Manager: `bigeo/google-maps-api-key` | ✅ Done |
| Mixpanel token | Lambda env var (acceptable — analytics token, not auth) | ✅ OK |
| VAAHAN internal key | Secrets Manager: `bigeo/vaahan-internal-key` | ⚠ In env var — migrate |

### IAM Users

- `claude-code-bigeo` — Claude Code CI/CD only. Max 2 access keys. Rotate on compromise.
- No human IAM users. Use AWS IAM Identity Center for console access.
- Never commit IAM credentials to git.

---

## 2. API Security

### Authentication

VAAHAN API uses Lambda authorizer (`vaahan-authorizer`) — validates `x-api-key` header against DynamoDB.

**All routes MUST be authorized except:**
- `POST /register` — issues keys (rate-limited by WAF)
- `POST /contact` — lead capture (rate-limited by WAF)  
- `GET /health` — monitoring
- `OPTIONS *` — CORS preflight

### Rate Limiting (WAF — REGIONAL scope)

Apply to API Gateway `v34s17v3h2`:

| Rule | Limit | Action |
|------|-------|--------|
| Per-IP rate limit | 100 req/5min | Block |
| AWS Common Rule Set (OWASP Top 10) | — | Block |
| Known Bad Inputs | — | Block |
| SQL injection | — | Block |

**Note:** WAF REGIONAL attaches to HTTP API via `aws_wafv2_web_acl_association`. CloudFront-scope WAF requires us-east-1 (not needed here).

### Input Validation

- Max address length: 1000 chars (enforced in Lambda)
- Bulk max: 1000 addresses/request (enforced in bulk-function)
- Prompt injection: XML tag delimiters `<address>…</address>` around user input in Claude prompts

---

## 3. Data Protection

### Encryption at Rest

| Resource | Encryption | Status |
|----------|-----------|--------|
| DynamoDB `bigeo-api-keys` | AWS-managed (default) | ✅ |
| DynamoDB `bigeo-pincodes` | AWS-managed (default) | ✅ |
| DynamoDB `bigeo-leads` | AWS-managed (default) | ✅ |
| S3 `vaahan-portal-bigeo` | AES-256 default encryption | ✅ Required |
| CloudTrail S3 bucket | AES-256 | ✅ Required |
| Bedrock KB | AWS-managed | ✅ |

### Encryption in Transit

- API Gateway HTTP API: HTTPS only (AWS-managed, TLS 1.2+)
- S3 website endpoint: HTTP (public static site — acceptable for bigeo.in portal)
- SES: TLS enforced

### S3 Security

`vaahan-portal-bigeo` is a **public static website** — intentionally public, no sensitive data.

For all other S3 buckets (CloudTrail logs, future data buckets):
- Block all public access: ON
- Versioning: ON
- Encryption: AES-256
- No unencrypted PutObject allowed

---

## 4. Logging and Detection

### CloudTrail

- Multi-region: ON
- Log file validation: ON
- S3 bucket: `bigeo-cloudtrail-logs-{account_id}` (private, encrypted)
- Retention: 180 days (production)

### CloudWatch Alarms (Already deployed via security-baseline Terraform)

| Alarm | Threshold | Action |
|-------|-----------|--------|
| `vaahan-high-error-rate` | >5% errors in 5min | SNS → admin@bigeo.in |
| `vaahan-high-latency` | p99 >10s | SNS → admin@bigeo.in |
| `vaahan-api-down` | 0 invocations in 5min | SNS → admin@bigeo.in |
| `vaahan-throttles` | >10 throttles | SNS → admin@bigeo.in |

### GuardDuty

- Enabled: ap-south-1
- Malware scanning: ON (S3 objects)
- Finding frequency: 15 minutes

### Log Retention

- Lambda CloudWatch logs: 30 days (dev), 90 days (prod)
- CloudTrail: 180 days
- API Gateway access logs: 90 days

---

## 5. Resource Tagging (Mandatory)

Every AWS resource MUST have:

```
Project=BiGeo
Env=dev|prod
ManagedBy=SAM|Terraform|CloudShell
```

Untagged resources = billing blind spot + audit gap.

---

## 6. Compliance Checklist

Before every deploy, verify:

- [ ] No Lambda env vars contain secrets (use Secrets Manager)
- [ ] All IAM policies use specific resource ARNs (no `*` in Resource)
- [ ] WAF attached to API Gateway `v34s17v3h2`
- [ ] CloudTrail enabled (all regions)
- [ ] GuardDuty enabled
- [ ] S3 portal bucket: no sensitive data, encryption ON
- [ ] DynamoDB tables: encryption ON (AWS-default)
- [ ] All resources tagged `Project=BiGeo`
- [ ] No EC2 instances left running after build tasks
- [ ] AWS billing alarm active at $500

---

## 7. Automated Security Controls

### In Lambda Code

- Input length cap: `if (address.length > 1000) return 400`
- Prompt injection protection: XML tag delimiters in Claude prompts
- Mixpanel token: `if (!MIXPANEL_TOKEN) return` — no crash on missing token
- No hardcoded credentials anywhere in source

### In CI/CD (GitHub Actions — future)

```yaml
- run: npm audit --audit-level=high
- run: npx trivy fs . --severity CRITICAL,HIGH --exit-code 1
```

---

## Current Security Gaps (Prioritized)

| Priority | Gap | Fix |
|----------|-----|-----|
| P1 | WAF not attached to API Gateway | Deploy `06-waf-cloudtrail.sh` |
| P1 | CloudTrail not verified active | Deploy `06-waf-cloudtrail.sh` |
| P2 | HERE API key in Lambda env var | Migrate to Secrets Manager |
| P2 | VAAHAN internal key in env var | Migrate to Secrets Manager |
| P3 | Lambda CloudWatch log retention not set | Set to 90 days |
| P3 | GuardDuty not verified active | Enable via security-baseline |

---

## References

- AWS Well-Architected Security Pillar: https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/
- MVSP Framework: https://mvsp.dev/
- BiGeo security baseline Terraform: `infra/security-baseline/main.tf`
- OWASP Top 10: https://owasp.org/www-project-top-ten/
