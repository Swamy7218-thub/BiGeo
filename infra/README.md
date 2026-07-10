# BiGeo infrastructure

Terraform config that provisions the AWS resources behind the address
resolution API:

- `aws_s3_bucket.address_graph` — stores the Bharat Address Graph dataset
- `aws_dynamodb_table.resolution_cache` — caches previously resolved addresses
- `aws_lambda_function.resolver` — runs `src/handler.py:lambda_handler`
- `aws_apigatewayv2_api.resolver` — exposes `POST /resolve` over HTTP

## Deploying manually

```bash
# Build the Lambda package (from the repo root)
mkdir -p infra/build/package
pip install -r requirements.txt -t infra/build/package
cp -r src/. infra/build/package/
(cd infra/build/package && zip -r ../resolver.zip .)

cd infra
terraform init \
  -backend-config="bucket=<your-tfstate-bucket>" \
  -backend-config="key=bigeo/terraform.tfstate" \
  -backend-config="region=ap-south-1"

terraform apply \
  -var="address_graph_bucket_name=<bucket-name>" \
  -var="anthropic_api_key=<key>"
```

## CI/CD

`.github/workflows/deploy.yml` runs this same flow on every push to `main`,
authenticating to AWS via an OIDC role (no long-lived keys). It expects the
following repository secrets:

| Secret                      | Purpose                                              |
| ---------------------------- | ----------------------------------------------------- |
| `AWS_DEPLOY_ROLE_ARN`        | IAM role assumed via GitHub OIDC to run `terraform apply` |
| `TF_STATE_BUCKET`            | S3 bucket holding the Terraform state                |
| `ADDRESS_GRAPH_BUCKET_NAME`  | Name for the address graph S3 bucket                 |
| `ANTHROPIC_API_KEY`          | Claude API key, passed to the resolver Lambda         |

The `AWS_DEPLOY_ROLE_ARN` role must trust GitHub's OIDC provider
(`token.actions.githubusercontent.com`) scoped to this repository, and have
permissions to manage S3, DynamoDB, Lambda, API Gateway, and IAM resources
prefixed `bigeo-*`.
