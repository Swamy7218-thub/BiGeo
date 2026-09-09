# BiGeo Security Baseline — SOC 2 Control Mapping

## Overview

This document maps each Terraform-deployed control to SOC 2 Trust Service Criteria (TSC) and CIS AWS Foundations Benchmark v1.4.

---

## SOC 2 Trust Service Criteria Mapping

### CC6 — Logical and Physical Access Controls

| Control | AWS Resource | Terraform Resource | CIS Benchmark |
|---------|-------------|-------------------|---------------|
| CC6.1 — Restrict logical access | IAM BreakGlassAdmin (ExternalId + MFA) | `aws_iam_role.break_glass_admin` | 1.14, 1.15 |
| CC6.1 — Least privilege | IAM DeveloperTemplate (deny IAM/security changes) | `aws_iam_role.developer_template` | 1.16 |
| CC6.2 — Remove unnecessary access | SecurityAuditor read-only role | `aws_iam_role.security_auditor` | 1.17 |
| CC6.3 — MFA for privileged access | MFA condition on BreakGlass + Auditor roles | `aws_iam_role.break_glass_admin` | 1.10, 1.14 |
| CC6.6 — Prevent unauthorized access | WAF OWASP + rate limiting | `aws_wafv2_web_acl.main` | N/A |
| CC6.6 — Network protection | WAF KnownBadInputs + SQLi rules | `aws_wafv2_web_acl.main` | N/A |
| CC6.8 — Detect malicious software | GuardDuty malware scanning | `aws_guardduty_detector.main` | N/A |

### CC7 — System Operations

| Control | AWS Resource | Terraform Resource | CIS Benchmark |
|---------|-------------|-------------------|---------------|
| CC7.2 — Monitor system components | CloudWatch 4 security alarms | `aws_cloudwatch_metric_alarm.*` | 3.1–3.14 |
| CC7.2 — Dashboard visibility | CloudWatch 8-widget dashboard | `aws_cloudwatch_dashboard.security` | N/A |
| CC7.3 — Evaluate security events | GuardDuty threat intelligence | `aws_guardduty_detector.main` | N/A |
| CC7.4 — Respond to security incidents | SNS email alerts on all alarms | `aws_sns_topic.alerts` | N/A |
| CC7.5 — Identify security incidents | Inspector vulnerability scanning | `aws_inspector2_enabler.main` | N/A |

### CC8 — Change Management

| Control | AWS Resource | Terraform Resource | CIS Benchmark |
|---------|-------------|-------------------|---------------|
| CC8.1 — Authorize changes | CloudTrail logs all API calls | `aws_cloudtrail.main` | 3.1 |
| CC8.1 — Detect unauthorized changes | Alarm: IAM policy changes | `aws_cloudwatch_metric_alarm.iam_policy_changes` | 3.4 |
| CC8.1 — Detect S3 changes | Alarm: S3 bucket policy changes | `aws_cloudwatch_metric_alarm.s3_bucket_policy_changes` | 3.8 |

### A1 — Availability

| Control | AWS Resource | Terraform Resource | CIS Benchmark |
|---------|-------------|-------------------|---------------|
| A1.2 — Monitor availability | CloudWatch alarms → SNS | `aws_cloudwatch_metric_alarm.*` | N/A |
| A1.3 — Recover from incidents | GuardDuty + Security Hub findings | `aws_securityhub_account.main` | N/A |

### PI1 — Processing Integrity

| Control | AWS Resource | Terraform Resource | CIS Benchmark |
|---------|-------------|-------------------|---------------|
| PI1.2 — Complete and accurate processing | CloudTrail data events (S3 + Lambda) | `aws_cloudtrail.main` | 3.10, 3.11 |

### C1 — Confidentiality

| Control | AWS Resource | Terraform Resource | CIS Benchmark |
|---------|-------------|-------------------|---------------|
| C1.1 — Identify confidential information | KMS encryption for all sensitive data | `aws_kms_key.cloudtrail`, `aws_kms_key.sns` | 2.7 |
| C1.2 — Protect confidential information | S3 bucket public access blocked | `aws_s3_bucket_public_access_block.cloudtrail` | 2.1.5 |
| C1.2 — Encryption at rest | SNS topic KMS-encrypted | `aws_sns_topic.alerts` | N/A |
| C1.2 — Encryption in transit | S3 bucket policy denies non-SSL | `aws_s3_bucket_policy.cloudtrail` | 2.1.1 |

---

## CIS AWS Foundations Benchmark v1.4 Mapping

### Section 1 — Identity and Access Management

| CIS Control | Description | Status | Resource |
|-------------|-------------|--------|----------|
| 1.4 | No root access key | Monitored | Root usage alarm |
| 1.5 | MFA for root | Alarm on root usage | `aws_cloudwatch_metric_alarm.root_usage` |
| 1.10 | MFA for all IAM users with console | MFA required on IAM roles | BreakGlass + Auditor trust policy |
| 1.14 | Access keys rotated every 90 days | N/A (roles only) | KMS auto-rotation |
| 1.15 | IAM password policy | Out of scope (roles only) | N/A |
| 1.16 | No full admin IAM policies attached | DeveloperTemplate is least-privilege | `aws_iam_role.developer_template` |

### Section 2 — Storage

| CIS Control | Description | Status | Resource |
|-------------|-------------|--------|----------|
| 2.1.1 | S3 deny non-SSL | Enforced | `aws_s3_bucket_policy.cloudtrail` |
| 2.1.5 | S3 block public access | Enforced | `aws_s3_bucket_public_access_block.cloudtrail` |
| 2.7 | KMS CMK encryption | Enforced for CloudTrail + SNS | `aws_kms_key.*` |
| 2.8 | S3 versioning | Enabled | `aws_s3_bucket_versioning.cloudtrail` |

### Section 3 — Logging

| CIS Control | Description | Status | Resource |
|-------------|-------------|--------|----------|
| 3.1 | CloudTrail enabled in all regions | Multi-region enabled | `aws_cloudtrail.main` |
| 3.2 | CloudTrail log file validation | Enabled | `aws_cloudtrail.main` |
| 3.3 | CloudTrail to CloudWatch Logs | Configured | `aws_cloudwatch_log_group.cloudtrail` |
| 3.4 | CloudTrail KMS encryption | Enforced | `aws_kms_key.cloudtrail` |
| 3.5 | AWS Config enabled | Not in baseline (separate module) | N/A |
| 3.10 | S3 object-level logging | Write events enabled | `aws_cloudtrail.main` event_selector |
| 3.11 | Lambda invoke logging | Enabled | `aws_cloudtrail.main` event_selector |

### Section 3 — Monitoring Alarms

| CIS Control | Alarm | Metric Filter | Threshold |
|-------------|-------|---------------|-----------|
| 3.3 | Root account usage | `$.userIdentity.type = "Root"` | ≥1 in 5min |
| 3.7 | Unauthorized API calls | `$.errorCode = "AccessDenied"` | ≥5 in 5min |
| 3.4 | IAM policy changes | `$.eventName = "PutUserPolicy" ...` | ≥1 in 5min |
| 3.8 | S3 bucket policy changes | `$.eventName = "PutBucketPolicy" ...` | ≥1 in 5min |

### Section 4 — Networking

| CIS Control | Description | Status | Resource |
|-------------|-------------|--------|----------|
| 4.x | WAF rate limiting | 2000 req/5min | `aws_wafv2_web_acl.main` |
| 4.x | OWASP protections | AWS Managed Rules | `aws_wafv2_web_acl.main` |

---

## Threat Detection Coverage

| Threat | Detection Method | Response |
|--------|-----------------|----------|
| Compromised credentials | GuardDuty UnauthorizedAccess findings | SNS alert |
| Brute force | GuardDuty + WAF rate limiting | Block + alert |
| Data exfiltration | GuardDuty S3 anomaly detection | SNS alert |
| Malware on EC2 | GuardDuty malware scan (EBS) | SNS alert |
| SQL injection | WAF SQLi managed rule | Block request |
| Log tampering | CloudTrail log file validation | Integrity failure alert |
| Root account use | CloudWatch alarm | Immediate SNS alert |
| Unauthorized API call | CloudWatch alarm (≥5 in 5min) | SNS alert |
| IAM privilege escalation | CloudWatch IAM policy alarm | SNS alert |
| Vulnerability in code | Inspector2 (EC2/ECR/Lambda) | Finding in console |

---

## Key Rotation Schedule

| Key | Rotation Period | Method |
|-----|----------------|--------|
| KMS CloudTrail key | Annual | AWS managed auto-rotation |
| KMS SNS key | Annual | AWS managed auto-rotation |
| BreakGlass ExternalId | Recommended quarterly | Manual (`break_glass_external_id` variable) |
| IAM access keys | N/A | Roles only (no long-term keys) |

---

## Data Retention

| Data | Retention | Storage | Tier Transition |
|------|-----------|---------|----------------|
| CloudTrail logs | 7 years (2,557 days) | S3 | 90d→IA, 365d→Glacier |
| CloudWatch logs | 90 days | CloudWatch Logs | N/A |
| GuardDuty findings | 90 days | GuardDuty service | N/A |
| Security Hub findings | 90 days | Security Hub service | N/A |

---

## IAM Role Trust Boundaries

```
Account: 841162683979 (BiGeo Production)

BreakGlassAdmin
  └── Assumes from: same account
  └── Requires: ExternalId (secret UUID) + MFA
  └── Policy: AdministratorAccess
  └── Use: Emergency only — break glass procedures

SecurityAuditor  
  └── Assumes from: same account
  └── Requires: MFA
  └── Policy: SecurityAudit + ViewOnlyAccess (read-only)
  └── Use: Compliance audits, security reviews

DeveloperTemplate
  └── Assumes from: same account
  └── Requires: nothing (template — clone for each developer)
  └── Policy: Least-privilege (Lambda/S3/DynamoDB/Bedrock scoped to BiGeo)
  └── DENY: IAM changes, CloudTrail delete, GuardDuty delete
  └── Use: Day-to-day development
```

---

## Compliance Attestation Checklist

Before claiming SOC 2 readiness, also complete:

- [ ] AWS Config enabled (records configuration changes)
- [ ] VPC Flow Logs enabled (if using VPC resources)
- [ ] CloudTrail Insights enabled (anomaly detection in API patterns)
- [ ] GuardDuty findings reviewed weekly
- [ ] Security Hub score reviewed monthly
- [ ] Break glass procedure documented and tested
- [ ] Incident response runbook written
- [ ] Data classification policy written
- [ ] Vendor management policy written (for AWS, HERE Maps, Anthropic)
- [ ] Business continuity plan written
