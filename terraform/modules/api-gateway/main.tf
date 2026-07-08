resource "aws_api_gateway_rest_api" "this" {
  name = "${var.name_prefix}-address-resolution"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# ---- /internal/resolve — AWS_IAM (SigV4), for BiGeo's own services ----

resource "aws_api_gateway_resource" "internal" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "internal"
}

resource "aws_api_gateway_resource" "internal_resolve" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.internal.id
  path_part   = "resolve"
}

resource "aws_api_gateway_method" "internal_resolve" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.internal_resolve.id
  http_method   = "POST"
  authorization = "AWS_IAM"
}

resource "aws_api_gateway_integration" "internal_resolve" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.internal_resolve.id
  http_method             = aws_api_gateway_method.internal_resolve.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.resolver_lambda_invoke_arn
}

# ---- /external/resolve — API key + usage plan, for key-based external callers ----

resource "aws_api_gateway_resource" "external" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "external"
}

resource "aws_api_gateway_resource" "external_resolve" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.external.id
  path_part   = "resolve"
}

resource "aws_api_gateway_method" "external_resolve" {
  rest_api_id      = aws_api_gateway_rest_api.this.id
  resource_id      = aws_api_gateway_resource.external_resolve.id
  http_method      = "POST"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "external_resolve" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.external_resolve.id
  http_method             = aws_api_gateway_method.external_resolve.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.resolver_lambda_invoke_arn
}

# ---- /external/oauth/resolve — Auth0 OAuth 2.0 bearer token ----

resource "aws_api_gateway_resource" "external_oauth" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.external.id
  path_part   = "oauth"
}

resource "aws_api_gateway_resource" "external_oauth_resolve" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.external_oauth.id
  path_part   = "resolve"
}

resource "aws_api_gateway_authorizer" "auth0" {
  name                             = "${var.name_prefix}-auth0-authorizer"
  rest_api_id                      = aws_api_gateway_rest_api.this.id
  type                             = "TOKEN"
  authorizer_uri                   = var.auth0_authorizer_lambda_invoke_arn
  identity_source                  = "method.request.header.Authorization"
  authorizer_result_ttl_in_seconds = 300
}

resource "aws_api_gateway_method" "external_oauth_resolve" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.external_oauth_resolve.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.auth0.id
}

resource "aws_api_gateway_integration" "external_oauth_resolve" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.external_oauth_resolve.id
  http_method             = aws_api_gateway_method.external_oauth_resolve.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.resolver_lambda_invoke_arn
}

resource "aws_lambda_permission" "apigw_invoke_resolver" {
  statement_id  = "AllowAPIGatewayInvokeResolver"
  action        = "lambda:InvokeFunction"
  function_name = var.resolver_lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_invoke_authorizer" {
  statement_id  = "AllowAPIGatewayInvokeAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = var.auth0_authorizer_lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/authorizers/${aws_api_gateway_authorizer.auth0.id}"
}

# ---- Deployment / stage ----

resource "aws_api_gateway_deployment" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.internal_resolve.id,
      aws_api_gateway_resource.external_resolve.id,
      aws_api_gateway_resource.external_oauth_resolve.id,
      aws_api_gateway_method.internal_resolve.id,
      aws_api_gateway_method.external_resolve.id,
      aws_api_gateway_method.external_oauth_resolve.id,
      aws_api_gateway_integration.internal_resolve.id,
      aws_api_gateway_integration.external_resolve.id,
      aws_api_gateway_integration.external_oauth_resolve.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_cloudwatch_log_group" "access_logs" {
  name              = "/aws/apigateway/${var.name_prefix}-address-resolution"
  retention_in_days = 30
}

resource "aws_api_gateway_stage" "this" {
  deployment_id = aws_api_gateway_deployment.this.id
  rest_api_id   = aws_api_gateway_rest_api.this.id
  stage_name    = var.stage_name

  xray_tracing_enabled = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.access_logs.arn
    format = jsonencode({
      requestId        = "$context.requestId"
      ip               = "$context.identity.sourceIp"
      caller           = "$context.identity.caller"
      requestTime      = "$context.requestTime"
      httpMethod       = "$context.httpMethod"
      resourcePath     = "$context.resourcePath"
      status           = "$context.status"
      integrationError = "$context.integration.error"
      latency          = "$context.responseLatency"
    })
  }
}

# ---- Usage plans / SLA tiers for API-key external callers ----

resource "aws_api_gateway_usage_plan" "basic" {
  name = "${var.name_prefix}-basic"

  api_stages {
    api_id = aws_api_gateway_rest_api.this.id
    stage  = aws_api_gateway_stage.this.stage_name
  }

  throttle_settings {
    rate_limit  = var.basic_tier_rate_limit
    burst_limit = var.basic_tier_burst_limit
  }

  quota_settings {
    limit  = var.basic_tier_daily_quota
    period = "DAY"
  }
}

resource "aws_api_gateway_usage_plan" "premium" {
  name = "${var.name_prefix}-premium"

  api_stages {
    api_id = aws_api_gateway_rest_api.this.id
    stage  = aws_api_gateway_stage.this.stage_name
  }

  throttle_settings {
    rate_limit  = var.premium_tier_rate_limit
    burst_limit = var.premium_tier_burst_limit
  }

  quota_settings {
    limit  = var.premium_tier_daily_quota
    period = "DAY"
  }
}

# Per-customer API keys are issued operationally (aws_api_gateway_api_key +
# aws_api_gateway_usage_plan_key at signup time), not declared statically
# here -- see terraform/README.md for the evolution note on a self-serve
# key-issuance path.
