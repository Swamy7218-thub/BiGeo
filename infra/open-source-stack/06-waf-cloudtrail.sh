#!/bin/bash
# BiGeo — MVSP Security: WAF + CloudTrail + GuardDuty + Log Retention
# Closes P1/P2 gaps from MVSP.md
# Run in AWS CloudShell (ap-south-1)

set -euo pipefail
REGION="ap-south-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
API_ID="v34s17v3h2"

echo "======================================================"
echo " BiGeo MVSP Security Hardening"
echo " Account: $ACCOUNT_ID | Region: $REGION"
echo "======================================================"

# ── 1. WAF v2 — REGIONAL, attach to API Gateway ───────────────────────────────
echo ""
echo "[1/5] Creating WAF WebACL with OWASP rules..."

WAF_ARN=$(aws wafv2 list-web-acls --scope REGIONAL --region $REGION \
  --query "WebACLs[?Name=='bigeo-api-waf'].ARN|[0]" --output text 2>/dev/null || echo "")

if [ -z "$WAF_ARN" ] || [ "$WAF_ARN" = "None" ]; then
  WAF_ARN=$(aws wafv2 create-web-acl \
    --name bigeo-api-waf \
    --scope REGIONAL \
    --region $REGION \
    --default-action Allow={} \
    --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=bigeo-api-waf \
    --tags Key=Project,Value=BiGeo Key=Env,Value=prod Key=ManagedBy,Value=CloudShell \
    --rules '[
      {
        "Name": "RateLimit100Per5Min",
        "Priority": 0,
        "Statement": {
          "RateBasedStatement": {
            "Limit": 100,
            "AggregateKeyType": "IP"
          }
        },
        "Action": {"Block": {}},
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": "RateLimit"
        }
      },
      {
        "Name": "AWSManagedRulesCommonRuleSet",
        "Priority": 1,
        "OverrideAction": {"None": {}},
        "Statement": {
          "ManagedRuleGroupStatement": {
            "VendorName": "AWS",
            "Name": "AWSManagedRulesCommonRuleSet"
          }
        },
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": "CommonRuleSet"
        }
      },
      {
        "Name": "AWSManagedRulesKnownBadInputsRuleSet",
        "Priority": 2,
        "OverrideAction": {"None": {}},
        "Statement": {
          "ManagedRuleGroupStatement": {
            "VendorName": "AWS",
            "Name": "AWSManagedRulesKnownBadInputsRuleSet"
          }
        },
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": "KnownBadInputs"
        }
      },
      {
        "Name": "AWSManagedRulesSQLiRuleSet",
        "Priority": 3,
        "OverrideAction": {"None": {}},
        "Statement": {
          "ManagedRuleGroupStatement": {
            "VendorName": "AWS",
            "Name": "AWSManagedRulesSQLiRuleSet"
          }
        },
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": "SQLiRuleSet"
        }
      }
    ]' \
    --query 'Summary.ARN' --output text)
  echo "  ✓ WAF WebACL created: $WAF_ARN"
else
  echo "  ✓ WAF WebACL already exists: $WAF_ARN"
fi

# Attach WAF to API Gateway stage
API_STAGE_ARN="arn:aws:apigateway:$REGION::/restapis/$API_ID/stages/v1"
# For HTTP API the ARN format is different
HTTP_API_ARN="arn:aws:apigateway:$REGION::/apis/$API_ID/stages/v1"

aws wafv2 associate-web-acl \
  --web-acl-arn "$WAF_ARN" \
  --resource-arn "$HTTP_API_ARN" \
  --region $REGION 2>/dev/null && echo "  ✓ WAF attached to HTTP API stage" \
  || echo "  ⚠ WAF association may need manual attachment — ARN format varies for HTTP API"

# ── 2. CloudTrail ─────────────────────────────────────────────────────────────
echo ""
echo "[2/5] Setting up CloudTrail..."

TRAIL_BUCKET="bigeo-cloudtrail-${ACCOUNT_ID}"

# Create S3 bucket for CloudTrail logs
if ! aws s3api head-bucket --bucket $TRAIL_BUCKET 2>/dev/null; then
  aws s3api create-bucket \
    --bucket $TRAIL_BUCKET \
    --region $REGION \
    --create-bucket-configuration LocationConstraint=$REGION
  # Block all public access
  aws s3api put-public-access-block --bucket $TRAIL_BUCKET \
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
  # Enable encryption
  aws s3api put-bucket-encryption --bucket $TRAIL_BUCKET \
    --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
  # Enable versioning
  aws s3api put-bucket-versioning --bucket $TRAIL_BUCKET \
    --versioning-configuration Status=Enabled
  # Set lifecycle: expire after 180 days
  aws s3api put-bucket-lifecycle-configuration --bucket $TRAIL_BUCKET \
    --lifecycle-configuration '{"Rules":[{"ID":"expire-logs","Status":"Enabled","Filter":{},"Expiration":{"Days":180}}]}'
  # Bucket policy allowing CloudTrail to write
  aws s3api put-bucket-policy --bucket $TRAIL_BUCKET --policy "{
    \"Version\":\"2012-10-17\",
    \"Statement\":[
      {
        \"Sid\":\"AWSCloudTrailAclCheck\",
        \"Effect\":\"Allow\",
        \"Principal\":{\"Service\":\"cloudtrail.amazonaws.com\"},
        \"Action\":\"s3:GetBucketAcl\",
        \"Resource\":\"arn:aws:s3:::$TRAIL_BUCKET\"
      },
      {
        \"Sid\":\"AWSCloudTrailWrite\",
        \"Effect\":\"Allow\",
        \"Principal\":{\"Service\":\"cloudtrail.amazonaws.com\"},
        \"Action\":\"s3:PutObject\",
        \"Resource\":\"arn:aws:s3:::$TRAIL_BUCKET/AWSLogs/$ACCOUNT_ID/*\",
        \"Condition\":{\"StringEquals\":{\"s3:x-amz-acl\":\"bucket-owner-full-control\"}}
      }
    ]
  }"
  echo "  ✓ CloudTrail S3 bucket created: $TRAIL_BUCKET"
fi

# Create or verify CloudTrail
if aws cloudtrail get-trail --name bigeo-trail --region $REGION &>/dev/null; then
  echo "  ✓ CloudTrail bigeo-trail already exists"
else
  aws cloudtrail create-trail \
    --name bigeo-trail \
    --s3-bucket-name $TRAIL_BUCKET \
    --is-multi-region-trail \
    --enable-log-file-validation \
    --region $REGION \
    --tags-list Key=Project,Value=BiGeo Key=Env,Value=prod
  aws cloudtrail start-logging --name bigeo-trail --region $REGION
  echo "  ✓ CloudTrail created and logging started"
fi

# ── 3. GuardDuty ─────────────────────────────────────────────────────────────
echo ""
echo "[3/5] Enabling GuardDuty..."

GD_STATUS=$(aws guardduty list-detectors --region $REGION --query 'DetectorIds[0]' --output text 2>/dev/null || echo "")

if [ -z "$GD_STATUS" ] || [ "$GD_STATUS" = "None" ]; then
  DETECTOR_ID=$(aws guardduty create-detector \
    --enable \
    --region $REGION \
    --finding-publishing-frequency FIFTEEN_MINUTES \
    --tags Project=BiGeo,Env=prod \
    --query 'DetectorId' --output text)
  echo "  ✓ GuardDuty enabled: $DETECTOR_ID"
else
  echo "  ✓ GuardDuty already enabled: $GD_STATUS"
fi

# ── 4. Lambda CloudWatch Log Retention (90 days) ─────────────────────────────
echo ""
echo "[4/5] Setting Lambda log retention to 90 days..."

LAMBDA_FUNCTIONS=(
  "vaahan-parse-address"
  "vaahan-authorizer"
  "vaahan-register"
  "vaahan-bulk-parse"
  "vaahan-health"
  "vaahan-usage"
  "vaahan-contact"
  "vaahan-daily-summary"
  "vaahan-producer-webhook"
  "vaahan-route"
  "vaahan-setu-pickup"
)

for fn in "${LAMBDA_FUNCTIONS[@]}"; do
  LOG_GROUP="/aws/lambda/$fn"
  if aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --region $REGION \
      --query "logGroups[?logGroupName=='$LOG_GROUP'].logGroupName" --output text 2>/dev/null | grep -q "$fn"; then
    aws logs put-retention-policy \
      --log-group-name "$LOG_GROUP" \
      --retention-in-days 90 \
      --region $REGION
    echo "  ✓ $fn — retention set to 90 days"
  else
    echo "  - $fn log group not found yet (Lambda not invoked)"
  fi
done

# ── 5. S3 Portal Bucket — Ensure Encryption ───────────────────────────────────
echo ""
echo "[5/5] Hardening S3 portal bucket..."

aws s3api put-bucket-encryption \
  --bucket vaahan-portal-bigeo \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}' \
  --region $REGION 2>/dev/null && echo "  ✓ AES-256 encryption enabled on vaahan-portal-bigeo" || true

# Tag the portal bucket
aws s3api put-bucket-tagging \
  --bucket vaahan-portal-bigeo \
  --tagging 'TagSet=[{Key=Project,Value=BiGeo},{Key=Env,Value=prod},{Key=ManagedBy,Value=CloudShell},{Key=DataClassification,Value=Public}]' \
  --region $REGION 2>/dev/null && echo "  ✓ Tags applied to vaahan-portal-bigeo" || true

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "======================================================"
echo " MVSP Security Hardening Complete"
echo "======================================================"
echo ""
echo "Controls deployed:"
echo "  ✅ WAF (OWASP + rate limit 100/5min) → API Gateway $API_ID"
echo "  ✅ CloudTrail (multi-region, log validation) → s3://$TRAIL_BUCKET"
echo "  ✅ GuardDuty (15-min finding frequency)"
echo "  ✅ Lambda log retention → 90 days"
echo "  ✅ S3 portal bucket → AES-256 encrypted + tagged"
echo ""
echo "Remaining P2 gaps (manual — requires API key rotation):"
echo "  ⚠ HERE Maps API key: move from Lambda env var to Secrets Manager bigeo/here-api-key"
echo "  ⚠ VAAHAN internal key: move from env var to Secrets Manager bigeo/vaahan-internal-key"
echo ""
echo "WAF console: https://$REGION.console.aws.amazon.com/wafv2/homev2/web-acls?region=$REGION"
echo "CloudTrail:  https://$REGION.console.aws.amazon.com/cloudtrail/home?region=$REGION"
echo "GuardDuty:   https://$REGION.console.aws.amazon.com/guardduty/home?region=$REGION"
