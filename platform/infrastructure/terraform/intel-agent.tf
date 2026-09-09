# ── Daily Intelligence Agent ──────────────────────────────────────────────────
# One Lambda, one EventBridge schedule, one DynamoDB dedup table, SES for
# delivery. Deliberately not a platform: no OpenSearch, no dashboard, no
# Cognito. Costs: Lambda+EventBridge+DynamoDB are effectively free at 1
# invocation/day; the only real variable cost is the single daily Bedrock
# Claude call.

variable "intel_agent_recipient" {
  description = "Email address that receives the daily briefing"
  type        = string
  default     = "admin@bigeo.in"
}

variable "intel_agent_schedule" {
  description = "EventBridge cron expression (UTC) for the daily run. Default: 01:30 UTC = 07:00 IST."
  type        = string
  default     = "cron(30 1 * * ? *)"
}

data "archive_file" "intel_agent" {
  type        = "zip"
  source_file = "${path.module}/../../services/intel-agent/lambda_function.py"
  output_path = "${path.module}/.build/intel-agent.zip"
}

resource "aws_dynamodb_table" "intel_agent_seen" {
  name         = "${local.prefix}-intel-seen-items"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "item_key"

  attribute {
    name = "item_key"
    type = "S"
  }

  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }
}

resource "aws_cloudwatch_log_group" "intel_agent" {
  name              = "/aws/lambda/${local.prefix}-intel-agent"
  retention_in_days = 14
}

resource "aws_iam_role" "intel_agent" {
  name = "${local.prefix}-intel-agent"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "intel_agent" {
  name = "${local.prefix}-intel-agent"
  role = aws_iam_role.intel_agent.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.intel_agent.arn}:*"
      },
      {
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem"]
        Resource = aws_dynamodb_table.intel_agent_seen.arn
      },
      {
        Effect   = "Allow"
        Action = ["bedrock:InvokeModel"]
        Resource = [
          "arn:aws:bedrock:${var.aws_region}:*:inference-profile/apac.anthropic.claude-3-5-sonnet-20241022-v2:0",
          "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
          "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["aws-marketplace:ViewSubscriptions", "aws-marketplace:Subscribe"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_lambda_function" "intel_agent" {
  function_name    = "${local.prefix}-intel-agent"
  role             = aws_iam_role.intel_agent.arn
  handler          = "lambda_function.handler"
  runtime          = "python3.12"
  timeout          = 60
  memory_size      = 256
  filename         = data.archive_file.intel_agent.output_path
  source_code_hash = data.archive_file.intel_agent.output_base64sha256

  environment {
    variables = {
      SES_SENDER       = "admin@bigeo.in"
      SES_RECIPIENT    = var.intel_agent_recipient
      SEEN_ITEMS_TABLE = aws_dynamodb_table.intel_agent_seen.name
      BEDROCK_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0"
    }
  }

  depends_on = [aws_cloudwatch_log_group.intel_agent]
}

resource "aws_cloudwatch_event_rule" "intel_agent_daily" {
  name                = "${local.prefix}-intel-agent-daily"
  schedule_expression = var.intel_agent_schedule
}

resource "aws_cloudwatch_event_target" "intel_agent_daily" {
  rule = aws_cloudwatch_event_rule.intel_agent_daily.name
  arn  = aws_lambda_function.intel_agent.arn
}

resource "aws_lambda_permission" "intel_agent_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.intel_agent.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.intel_agent_daily.arn
}

output "intel_agent_function_name" {
  value = aws_lambda_function.intel_agent.function_name
}
