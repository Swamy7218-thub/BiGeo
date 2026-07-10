resource "aws_lambda_function" "resolver" {
  function_name    = "bigeo-address-resolver-${var.environment}"
  role             = aws_iam_role.resolver_lambda.arn
  handler          = "handler.lambda_handler"
  runtime          = "python3.12"
  filename         = var.lambda_package_path
  source_code_hash = filebase64sha256(var.lambda_package_path)
  timeout          = 15
  memory_size      = 256

  environment {
    variables = {
      ADDRESS_GRAPH_BUCKET   = aws_s3_bucket.address_graph.bucket
      RESOLUTION_CACHE_TABLE = aws_dynamodb_table.resolution_cache.name
      ANTHROPIC_API_KEY      = var.anthropic_api_key
    }
  }

  tags = {
    Project     = "BiGeo"
    Environment = var.environment
  }
}
