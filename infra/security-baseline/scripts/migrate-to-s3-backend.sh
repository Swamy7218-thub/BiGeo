#!/bin/bash
# Migrate Terraform state to S3 backend
# Run ONCE after initial terraform apply

set -euo pipefail

PROJECT="bigeo"
REGION="ap-south-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
STATE_BUCKET="${PROJECT}-terraform-state-${ACCOUNT_ID}"
LOCK_TABLE="${PROJECT}-terraform-locks"

echo "=== BiGeo Terraform S3 Backend Migration ==="
echo "Account:  $ACCOUNT_ID"
echo "Bucket:   $STATE_BUCKET"
echo "Table:    $LOCK_TABLE"
echo "Region:   $REGION"
echo ""

# 1. Create S3 bucket for state
echo "Creating S3 state bucket..."
if aws s3api head-bucket --bucket "$STATE_BUCKET" 2>/dev/null; then
  echo "  ✓ Bucket already exists"
else
  aws s3api create-bucket \
    --bucket "$STATE_BUCKET" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"
  echo "  ✓ Bucket created"
fi

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket "$STATE_BUCKET" \
  --versioning-configuration Status=Enabled
echo "  ✓ Versioning enabled"

# Block public access
aws s3api put-public-access-block \
  --bucket "$STATE_BUCKET" \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
echo "  ✓ Public access blocked"

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket "$STATE_BUCKET" \
  --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
echo "  ✓ Encryption enabled"

# Enable MFA delete protection via lifecycle
aws s3api put-bucket-lifecycle-configuration \
  --bucket "$STATE_BUCKET" \
  --lifecycle-configuration \
    '{"Rules":[{"ID":"ExpireOldVersions","Status":"Enabled","NoncurrentVersionExpiration":{"NoncurrentDays":90}}]}'
echo "  ✓ Lifecycle rule set"

# 2. Create DynamoDB lock table
echo ""
echo "Creating DynamoDB lock table..."
if aws dynamodb describe-table --table-name "$LOCK_TABLE" --region "$REGION" 2>/dev/null; then
  echo "  ✓ Table already exists"
else
  aws dynamodb create-table \
    --table-name "$LOCK_TABLE" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION" \
    --tags Key=Project,Value="$PROJECT" Key=ManagedBy,Value=Terraform
  echo "  ✓ Table created"
fi

# 3. Update backend config
echo ""
echo "=== UPDATE main.tf backend block ==="
echo "Uncomment the backend \"s3\" block in main.tf and set:"
echo ""
echo '  backend "s3" {'
echo "    bucket         = \"$STATE_BUCKET\""
echo '    key            = "security-baseline/terraform.tfstate"'
echo "    region         = \"$REGION\""
echo "    dynamodb_table = \"$LOCK_TABLE\""
echo '    encrypt        = true'
echo '  }'
echo ""
echo "Then run: terraform init -migrate-state"
echo ""
echo "=== Done ==="
