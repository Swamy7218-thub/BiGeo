terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = "ap-south-1"

  default_tags {
    tags = {
      Project     = "bigeo"
      Environment = "prod"
      ManagedBy   = "terraform"
    }
  }
}

module "github_actions_role" {
  source = "../../modules/github-oidc"

  github_org         = "Swamy7218-thub"
  github_repo        = "BiGeo"
  github_environment = "prod"
  role_name          = "bigeo-github-actions-prod"
}

# ---- Cost guardrails ----

module "budget" {
  source = "../../modules/budget"

  name_prefix       = "bigeo-prod"
  alert_email       = var.alert_email
  monthly_limit_usd = var.monthly_budget_usd
}

resource "aws_sns_topic" "ops_alerts" {
  name = "bigeo-prod-ops-alerts"
}

resource "aws_sns_topic_subscription" "ops_alerts_email" {
  topic_arn = aws_sns_topic.ops_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# ---- Networking (not yet attached to any Lambda -- see README) ----

module "vpc" {
  source = "../../modules/vpc"

  name_prefix = "bigeo-prod"
  aws_region  = "ap-south-1"
  vpc_cidr    = "10.1.0.0/16"
}

# ---- Data layer ----

module "dynamodb" {
  source = "../../modules/dynamodb"

  name_prefix = "bigeo-prod"
}

module "sqs" {
  source = "../../modules/sqs"

  name_prefix = "bigeo-prod"
}

# ---- Resolver Lambda ----

module "resolver_lambda" {
  source = "../../modules/lambda-function"

  function_name   = "bigeo-prod-resolver"
  source_dir      = "${path.module}/../../../lambda/resolver"
  timeout_seconds = 25
  memory_mb       = 512

  # Set > 0 only if a premium external tier's p99 latency SLA requires it --
  # not needed at launch volume.
  provisioned_concurrency = var.resolver_provisioned_concurrency

  environment_variables = {
    REFERENCE_DATA_TABLE          = module.dynamodb.reference_data_table_name
    RESOLUTION_CACHE_TABLE        = module.dynamodb.resolution_cache_table_name
    REVIEW_QUEUE_URL              = module.sqs.review_queue_url
    RESOLVED_CONFIDENCE_THRESHOLD = "0.75"
  }

  policy_statements = [
    {
      Effect   = "Allow"
      Action   = ["bedrock:InvokeModel"]
      Resource = "*"
    },
    {
      Effect = "Allow"
      Action = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Query"]
      Resource = [
        module.dynamodb.reference_data_table_arn,
        module.dynamodb.resolution_cache_table_arn,
      ]
    },
    {
      Effect   = "Allow"
      Action   = ["sqs:SendMessage"]
      Resource = module.sqs.review_queue_arn
    },
  ]

  alarm_sns_topic_arn = aws_sns_topic.ops_alerts.arn
}

# ---- Review-intake Lambda (SQS-triggered) ----

module "review_intake_lambda" {
  source = "../../modules/lambda-function"

  function_name   = "bigeo-prod-review-intake"
  source_dir      = "${path.module}/../../../lambda/review-intake"
  timeout_seconds = 15
  memory_mb       = 256

  environment_variables = {
    REVIEW_STATUS_TABLE = module.dynamodb.review_status_table_name
  }

  policy_statements = [
    {
      Effect   = "Allow"
      Action   = ["dynamodb:PutItem"]
      Resource = module.dynamodb.review_status_table_arn
    },
    {
      Effect   = "Allow"
      Action   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
      Resource = module.sqs.review_queue_arn
    },
  ]

  alarm_sns_topic_arn = aws_sns_topic.ops_alerts.arn
}

resource "aws_lambda_event_source_mapping" "review_queue_to_intake" {
  event_source_arn = module.sqs.review_queue_arn
  function_name    = module.review_intake_lambda.function_name
  batch_size       = 10
}

# ---- Auth0 authorizer Lambda ----

module "auth0_authorizer_lambda" {
  source = "../../modules/lambda-function"

  function_name   = "bigeo-prod-auth0-authorizer"
  source_dir      = "${path.module}/../../../lambda/auth0-authorizer"
  timeout_seconds = 10
  memory_mb       = 128
  layers          = var.auth0_authorizer_layer_arns

  environment_variables = {
    AUTH0_DOMAIN   = var.auth0_domain
    AUTH0_AUDIENCE = var.auth0_audience
  }

  alarm_sns_topic_arn = aws_sns_topic.ops_alerts.arn
}

# ---- API Gateway ----

module "api_gateway" {
  source = "../../modules/api-gateway"

  name_prefix = "bigeo-prod"
  stage_name  = "v1"

  resolver_lambda_invoke_arn    = module.resolver_lambda.invoke_arn
  resolver_lambda_function_name = module.resolver_lambda.function_name

  auth0_authorizer_lambda_invoke_arn    = module.auth0_authorizer_lambda.invoke_arn
  auth0_authorizer_lambda_function_name = module.auth0_authorizer_lambda.function_name

  premium_tier_rate_limit  = var.premium_tier_rate_limit
  premium_tier_burst_limit = var.premium_tier_burst_limit
}
