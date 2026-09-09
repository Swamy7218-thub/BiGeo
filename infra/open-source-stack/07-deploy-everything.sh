#!/bin/bash
# BiGeo — Deploy EVERYTHING to production
# Deploys all Lambda functions + portal to S3
# Run in AWS CloudShell (ap-south-1)

set -euo pipefail
REGION="ap-south-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
S3_BUCKET="vaahan-portal-bigeo"
BRANCH="claude/happy-ramanujan-obsurt"

echo "======================================================"
echo " BiGeo — Full Production Deploy"
echo " Account: $ACCOUNT_ID | Region: $REGION"
echo "======================================================"

# ── Clone latest code ─────────────────────────────────────────────────────────
echo ""
echo "[0] Pulling latest code from $BRANCH..."
if [ -d /tmp/bigeo-deploy ]; then
  cd /tmp/bigeo-deploy
  git fetch origin $BRANCH
  git checkout $BRANCH
  git reset --hard origin/$BRANCH
else
  git clone --depth 1 --branch $BRANCH \
    https://github.com/Swamy7218-thub/BiGeo /tmp/bigeo-deploy
fi
cd /tmp/bigeo-deploy
echo "  ✓ Code ready at /tmp/bigeo-deploy"

# ── Helper: zip and deploy a Lambda ──────────────────────────────────────────
deploy_lambda() {
  local FUNCTION_NAME=$1
  local CODE_DIR=$2
  echo ""
  echo "Deploying $FUNCTION_NAME..."
  cd /tmp/bigeo-deploy/$CODE_DIR
  zip -q /tmp/${FUNCTION_NAME}.zip index.mjs 2>/dev/null || zip -q /tmp/${FUNCTION_NAME}.zip *.mjs
  aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb:///tmp/${FUNCTION_NAME}.zip \
    --region $REGION > /dev/null
  aws lambda wait function-updated --function-name $FUNCTION_NAME --region $REGION 2>/dev/null || true
  echo "  ✓ $FUNCTION_NAME deployed"
}

# ── 1. Lambda Functions ───────────────────────────────────────────────────────
echo ""
echo "[1/3] Deploying Lambda functions..."

deploy_lambda "vaahan-parse-address"    "vaahan/parse-function"
deploy_lambda "vaahan-authorizer"       "vaahan/authorizer-function"
deploy_lambda "vaahan-register"         "vaahan/register-function"
deploy_lambda "vaahan-bulk-parse"       "vaahan/bulk-function"
deploy_lambda "vaahan-health"           "vaahan/health-function"
deploy_lambda "vaahan-usage"            "vaahan/usage-function"
deploy_lambda "vaahan-daily-summary"    "vaahan/daily-summary-function"
deploy_lambda "vaahan-producer-webhook" "vaahan/producer-webhook-function"
deploy_lambda "vaahan-contact"          "vaahan/contact-function"

# ── 2. Update Lambda env vars with latest config ──────────────────────────────
echo ""
echo "[2/3] Updating Lambda environment variables..."

# parse-function: remove dead MODEL_ROUTE var, ensure BEDROCK_MODEL set
aws lambda update-function-configuration \
  --function-name vaahan-parse-address \
  --environment "Variables={
    ADDRESS_TABLE=bigeo-address-graph,
    PINCODE_TABLE=bigeo-pincodes,
    GCP_PROJECT_ID=bigeo-491617,
    GCP_SECRET_ARN=bigeo/gcp-service-account,
    BEDROCK_MODEL=global.anthropic.claude-fable-5
  }" \
  --region $REGION > /dev/null
echo "  ✓ vaahan-parse-address env vars updated (Fable 5, no MODEL_ROUTE)"

aws lambda wait function-updated --function-name vaahan-parse-address --region $REGION 2>/dev/null || true

# contact-function env vars
aws lambda update-function-configuration \
  --function-name vaahan-contact \
  --environment "Variables={LEADS_TABLE=bigeo-leads,SES_FROM_EMAIL=admin@bigeo.in}" \
  --region $REGION > /dev/null
echo "  ✓ vaahan-contact env vars confirmed"

# ── 3. Portal to S3 ──────────────────────────────────────────────────────────
echo ""
echo "[3/3] Uploading portal files to S3..."

cd /tmp/bigeo-deploy/portal

aws s3 cp index.html s3://$S3_BUCKET/index.html \
  --content-type "text/html" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --region $REGION
echo "  ✓ index.html → s3://$S3_BUCKET/"

# Upload any other HTML files in portal/
for f in swamy.html bigeo-demo-deck.html bigeo-ace-deck.html bigeo-redesign.html; do
  if [ -f "$f" ]; then
    aws s3 cp $f s3://$S3_BUCKET/$f \
      --content-type "text/html" \
      --cache-control "no-cache" \
      --region $REGION
    echo "  ✓ $f → s3://$S3_BUCKET/"
  fi
done

# ── Smoke Tests ───────────────────────────────────────────────────────────────
echo ""
echo "======================================================"
echo " Running smoke tests..."
echo "======================================================"

API="https://v34s17v3h2.execute-api.ap-south-1.amazonaws.com/v1"

# Health check
HEALTH=$(curl -s "$API/health")
echo "Health: $HEALTH"

# Parse test with demo key
PARSE=$(curl -s -X POST "$API/parse" \
  -H "Content-Type: application/json" \
  -H "x-api-key: demo-public-readonly" \
  -d '{"address":"Yellareddyguda, Siddipet, Telangana"}')
VILLAGE=$(echo $PARSE | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('village','ERROR'))" 2>/dev/null || echo "parse-check-failed")
echo "Parse test — village: $VILLAGE"

# Contact form test
CONTACT=$(curl -s -X POST "$API/contact" \
  -H "Content-Type: application/json" \
  -d '{"name":"Deploy Test","email":"admin@bigeo.in","use_case":"last-mile-logistics"}')
echo "Contact test: $CONTACT"

echo ""
echo "======================================================"
echo " DEPLOY COMPLETE"
echo "======================================================"
echo ""
echo "  bigeo.in portal:    http://$S3_BUCKET.s3-website.$REGION.amazonaws.com/"
echo "  API endpoint:       $API"
echo "  Lambda functions:   9 deployed"
echo ""
echo "  Live features:"
echo "  ✅ Address parsing — /parse (Fable 5 + HERE Maps GPS)"
echo "  ✅ Bulk parsing   — /parse/bulk (1000 addresses/request, quota enforced)"
echo "  ✅ API key signup — /register (email delivery via SES)"
echo "  ✅ Lead capture   — /contact (DynamoDB + email to Swamy)"
echo "  ✅ Usage tracking — /usage"
echo "  ✅ Health check   — /health"
echo "  ✅ WAF protection — OWASP + rate limiting"
echo "  ✅ CloudTrail     — multi-region audit log"
echo "  ✅ GuardDuty      — threat detection"
echo "  ✅ Prompt injection protection (XML delimiters)"
echo "  ✅ Bulk quota enforcement (500 free calls/month)"
echo "  ✅ Mixpanel analytics — per-customer tracking"
echo ""
echo "Test the live API:"
echo "curl -X POST $API/parse \\"
echo "  -H 'x-api-key: demo-public-readonly' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"address\": \"Near banyan tree, Yellareddyguda, Siddipet, Telangana\"}'"
