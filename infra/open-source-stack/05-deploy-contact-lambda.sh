#!/bin/bash
# BiGeo — Deploy contact Lambda + leads DynamoDB table + upload updated portal
# Run in AWS CloudShell (ap-south-1)

set -euo pipefail
REGION="ap-south-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
FUNCTION_NAME="vaahan-contact"
TABLE_NAME="bigeo-leads"
S3_BUCKET="vaahan-portal-bigeo"

echo "=== BiGeo: Deploying contact form backend ==="

# ── 1. Create DynamoDB leads table (if not exists) ────────────────────────────
if aws dynamodb describe-table --table-name $TABLE_NAME --region $REGION &>/dev/null; then
  echo "[1/4] DynamoDB table $TABLE_NAME already exists — skipping"
else
  echo "[1/4] Creating DynamoDB table: $TABLE_NAME..."
  aws dynamodb create-table \
    --table-name $TABLE_NAME \
    --attribute-definitions AttributeName=lead_id,AttributeType=S \
    --key-schema AttributeName=lead_id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION \
    --tags Key=Project,Value=BiGeo Key=Env,Value=prod
  aws dynamodb wait table-exists --table-name $TABLE_NAME --region $REGION
  echo "  ✓ Table created"
fi

# ── 2. Create IAM role for contact Lambda (if not exists) ─────────────────────
ROLE_NAME="vaahan-contact-role"
if aws iam get-role --role-name $ROLE_NAME &>/dev/null; then
  echo "[2/4] IAM role $ROLE_NAME already exists — skipping"
  ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
else
  echo "[2/4] Creating IAM role: $ROLE_NAME..."
  ROLE_ARN=$(aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \
    --query 'Role.Arn' --output text)
  aws iam attach-role-policy --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
  aws iam put-role-policy --role-name $ROLE_NAME --policy-name ContactFunctionPolicy \
    --policy-document "{
      \"Version\":\"2012-10-17\",
      \"Statement\":[
        {\"Effect\":\"Allow\",\"Action\":[\"dynamodb:PutItem\"],\"Resource\":\"arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/$TABLE_NAME\"},
        {\"Effect\":\"Allow\",\"Action\":[\"ses:SendEmail\",\"ses:SendRawEmail\"],\"Resource\":\"*\"}
      ]
    }"
  echo "  Waiting for role to propagate..."
  sleep 10
  echo "  ✓ Role created: $ROLE_ARN"
fi

# ── 3. Package and deploy Lambda ──────────────────────────────────────────────
echo "[3/4] Packaging and deploying $FUNCTION_NAME Lambda..."

# Clone/pull latest code
if [ -d /tmp/bigeo-deploy ]; then
  cd /tmp/bigeo-deploy && git pull origin claude/happy-ramanujan-obsurt
else
  git clone --depth 1 --branch claude/happy-ramanujan-obsurt \
    https://github.com/Swamy7218-thub/BiGeo /tmp/bigeo-deploy
fi

cd /tmp/bigeo-deploy/vaahan/contact-function
zip -q /tmp/contact-function.zip index.mjs

if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &>/dev/null; then
  aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb:///tmp/contact-function.zip \
    --region $REGION > /dev/null
  echo "  ✓ Lambda code updated"
else
  aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime nodejs22.x \
    --role $ROLE_ARN \
    --handler index.handler \
    --zip-file fileb:///tmp/contact-function.zip \
    --timeout 15 \
    --memory-size 256 \
    --environment "Variables={LEADS_TABLE=$TABLE_NAME,SES_FROM_EMAIL=admin@bigeo.in}" \
    --description "Capture B2B leads from bigeo.in contact form" \
    --region $REGION \
    --tags Project=BiGeo,Env=prod > /dev/null
  echo "  ✓ Lambda created"
fi

# Wait for Lambda to be Active
aws lambda wait function-active --function-name $FUNCTION_NAME --region $REGION

# ── 4. Wire Lambda to existing API Gateway HTTP API ───────────────────────────
echo "[4/5] Adding /contact route to API Gateway..."

# Get API ID
API_ID=$(aws apigatewayv2 get-apis --region $REGION \
  --query "Items[?Name=='vaahan-api' || contains(Name,'vaahan')].ApiId|[0]" --output text 2>/dev/null || echo "")

if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
  # Try by tag
  API_ID=$(aws apigatewayv2 get-apis --region $REGION \
    --query "Items[0].ApiId" --output text)
fi

if [ -n "$API_ID" ] && [ "$API_ID" != "None" ]; then
  LAMBDA_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME"

  # Add permission for API GW to invoke
  aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id apigateway-contact \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*/contact" \
    --region $REGION 2>/dev/null || true

  # Create integration
  INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --payload-format-version "2.0" \
    --region $REGION \
    --query 'IntegrationId' --output text)

  aws apigatewayv2 create-route --api-id $API_ID \
    --route-key "POST /contact" \
    --target "integrations/$INTEGRATION_ID" \
    --authorization-type NONE \
    --region $REGION > /dev/null 2>&1 || echo "  Route POST /contact may already exist"

  aws apigatewayv2 create-route --api-id $API_ID \
    --route-key "OPTIONS /contact" \
    --target "integrations/$INTEGRATION_ID" \
    --authorization-type NONE \
    --region $REGION > /dev/null 2>&1 || echo "  Route OPTIONS /contact may already exist"

  echo "  ✓ API Gateway routes added for /contact (API: $API_ID)"
else
  echo "  ⚠ Could not find API Gateway — add route manually or redeploy via SAM"
fi

# ── 5. Upload updated portal to S3 ───────────────────────────────────────────
echo "[5/5] Uploading updated index.html to S3..."
aws s3 cp /tmp/bigeo-deploy/portal/index.html s3://$S3_BUCKET/index.html \
  --content-type "text/html" \
  --cache-control "no-cache" \
  --region $REGION
echo "  ✓ Portal updated"

echo ""
echo "=== DONE ==="
echo "Contact Lambda:  https://$REGION.console.aws.amazon.com/lambda/home?region=$REGION#/functions/$FUNCTION_NAME"
echo "Leads table:     https://$REGION.console.aws.amazon.com/dynamodb/home?region=$REGION#tables:selected=$TABLE_NAME"
echo "Test endpoint:"
echo "curl -X POST https://v34s17v3h2.execute-api.ap-south-1.amazonaws.com/v1/contact \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"name\":\"Test User\",\"email\":\"test@example.com\",\"use_case\":\"last-mile-logistics\"}'"
