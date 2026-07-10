# BiGeo Security Baseline

Production-grade AWS security baseline for BiGeo, deployable in under 10 minutes.

## What This Deploys

| Component | Service | Purpose |
|-----------|---------|---------|
| Audit Trail | CloudTrail | Multi-region, encrypted, log validation |
| Threat Detection | GuardDuty | S3 protection + malware scanning |
| Compliance | Security Hub | AWS Foundational + CIS benchmarks |
| WAF | WAF v2 | OWASP Top 10 + rate limiting (2000 req/5min) |
| Vulnerability Scanning | Inspector | EC2, ECR, Lambda |
| Dashboard | CloudWatch | 8-widget security metrics |
| Alarms | CloudWatch | Root usage, unauthorized calls, IAM/S3 changes |
| IAM Roles | IAM | BreakGlass, SecurityAuditor, DeveloperTemplate |
| Encryption | KMS | Auto-rotating keys for CloudTrail + SNS |
| Alerting | SNS | Email alerts for all security events |

## Quick Start

See [QUICKSTART.md](QUICKSTART.md) for step-by-step deployment.

## Structure

```
security-baseline/
├── main.tf                    # Root module
├── variables.tf               # Input variables
├── outputs.tf                 # Output values
├── terraform.tfvars.example   # Config template
├── .gitignore                 # Excludes secrets
├── modules/
│   └── security_baseline/
│       ├── main.tf            # All security resources
│       ├── variables.tf
│       └── outputs.tf
└── scripts/
    ├── migrate-to-s3-backend.sh
    ├── demo-5min.sh
    └── demo-10min.sh
```

## IAM Roles

### BreakGlassAdmin
- **Purpose:** Emergency admin access only
- **Requires:** ExternalId + MFA
- **Policy:** AdministratorAccess
- **Usage:** `aws sts assume-role --role-arn <arn> --external-id <secret> --serial-number <mfa-arn> --token-code <code>`

### SecurityAuditor
- **Purpose:** Read-only security monitoring
- **Requires:** MFA
- **Policy:** SecurityAudit + ViewOnlyAccess

### DeveloperTemplate
- **Purpose:** Least-privilege for BiGeo development
- **Allows:** Lambda deploy, S3 portal, CloudFront invalidation, DynamoDB bigeo-*, Bedrock invoke
- **Denies:** IAM changes, CloudTrail deletion, GuardDuty deletion

## Cost Estimate (ap-south-1)

| Service | Monthly Cost |
|---------|-------------|
| CloudTrail | ~$2 |
| GuardDuty | ~$4 (scales with usage) |
| Security Hub | ~$0.001/check |
| Inspector | ~$1 |
| WAF | ~$5 + $0.60/million requests |
| KMS | ~$2 (2 keys) |
| CloudWatch | ~$1 |
| **Total** | **~$15–20/month** |

## Security Notes

- `break_glass_external_id` — treat as a secret, rotate regularly
- KMS keys auto-rotate annually
- CloudTrail logs retained 7 years (S3 lifecycle)
- All S3 buckets block public access
- SNS topic encrypted at rest
