# QuickStart — Deploy in 10 Minutes

## Prerequisites

```bash
# Install Terraform >= 1.5.0
terraform --version

# AWS CLI configured with admin access
aws sts get-caller-identity
```

## Step 1 — Configure Variables (2 min)

```bash
cd infra/security-baseline
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
project                 = "bigeo"
environment             = "prod"
aws_region              = "ap-south-1"
alert_email             = "admin@bigeo.in"
cloudtrail_bucket_name  = "bigeo-cloudtrail-logs-841162683979"
waf_rate_limit          = 2000
break_glass_external_id = "$(uuidgen)"   # generate a random UUID
trusted_account_id      = "841162683979"
```

## Step 2 — Initialize Terraform (1 min)

```bash
terraform init
```

## Step 3 — Plan (2 min)

```bash
terraform plan -out=tfplan
```

Review the plan. You should see ~35 resources to create.

## Step 4 — Apply (5 min)

```bash
terraform apply tfplan
```

Confirm with `yes`. Resources deploy in parallel — takes ~3-5 minutes.

## Step 5 — Confirm Email Subscription

Check `admin@bigeo.in` inbox and **confirm the SNS subscription** — you'll get an email from AWS SNS. Without this, alarms won't deliver email alerts.

## Step 6 — Migrate State to S3 (optional but recommended)

```bash
chmod +x scripts/migrate-to-s3-backend.sh
./scripts/migrate-to-s3-backend.sh

# Then uncomment the backend block in main.tf and run:
terraform init -migrate-state
```

## Verify Deployment

```bash
chmod +x scripts/demo-5min.sh
./scripts/demo-5min.sh
```

## Outputs

After apply, Terraform prints:
- CloudTrail ARN
- GuardDuty detector ID  
- WAF ACL ARN (attach to CloudFront)
- All 3 IAM role ARNs
- CloudWatch dashboard URL

## Attach WAF to CloudFront (optional)

Take `waf_acl_arn` from outputs and attach to your CloudFront distribution:

```bash
# Get WAF ARN
WAF_ARN=$(terraform output -raw waf_acl_arn)

# Attach to CloudFront distribution
aws cloudfront update-distribution \
  --id E3F3POTMFA7898 \
  --distribution-config file://dist-config.json  # add WebAclId to config
```

Or attach in the AWS Console: CloudFront → Distribution → Security → WAF → select the ACL.
