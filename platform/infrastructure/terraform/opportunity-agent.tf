# ── Daily Opportunity Discovery Agent ───────────────────────────────────────
# Separate from intel-agent: different data source (Bedrock web_search tool,
# not RSS), different objective (funding/accelerator opportunities, not
# news). One Lambda, one schedule, one email. Never merge the two.

variable "opportunity_agent_recipient" {
  description = "Email address that receives the daily opportunity radar"
  type        = string
  default     = "admin@bigeo.in"
}

variable "opportunity_agent_schedule" {
  description = "EventBridge cron expression (UTC) for the daily run. Default: 02:00 UTC = 07:30 IST."
  type        = string
  default     = "cron(0 2 * * ? *)"
}

data "archive_file" "opportunity_agent" {
  type        = "zip"
  source_file = "${path.module}/../../services/opportunity-agent/lambda_function.py"
  output_path = "${path.module}/.build/opportunity-agent.zip"
}

resource "aws_cloudwatch_log_group" "opportunity_agent" {
  name              = "/aws/lambda/${local.prefix}-opportunity-agent"
  retention_in_days = 14
}

resource "aws_iam_role" "opportunity_agent" {
  name = "${local.prefix}-opportunity-agent"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "opportunity_agent" {
  name = "${local.prefix}-opportunity-agent"
  role = aws_iam_role.opportunity_agent.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.opportunity_agent.arn}:*"
      },
      {
        Effect = "Allow"
        Action = ["bedrock:InvokeModel"]
        Resource = [
          "arn:aws:bedrock:${var.aws_region}:*:inference-profile/apac.anthropic.claude-3-7-sonnet-20250219-v1:0",
          "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-3-7-sonnet-20250219-v1:0"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_lambda_function" "opportunity_agent" {
  function_name    = "${local.prefix}-opportunity-agent"
  role             = aws_iam_role.opportunity_agent.arn
  handler          = "lambda_function.handler"
  runtime          = "python3.12"
  timeout          = 600
  memory_size      = 256
  filename         = data.archive_file.opportunity_agent.output_path
  source_code_hash = data.archive_file.opportunity_agent.output_base64sha256

  environment {
    variables = {
      SES_SENDER       = "admin@bigeo.in"
      SES_RECIPIENT    = var.opportunity_agent_recipient
      BEDROCK_MODEL_ID = "apac.anthropic.claude-3-7-sonnet-20250219-v1:0"
    }
  }

  depends_on = [aws_cloudwatch_log_group.opportunity_agent]
}

resource "aws_cloudwatch_event_rule" "opportunity_agent_daily" {
  name                = "${local.prefix}-opportunity-agent-daily"
  schedule_expression = var.opportunity_agent_schedule
}

resource "aws_cloudwatch_event_target" "opportunity_agent_daily" {
  rule = aws_cloudwatch_event_rule.opportunity_agent_daily.name
  arn  = aws_lambda_function.opportunity_agent.arn
}

resource "aws_lambda_permission" "opportunity_agent_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.opportunity_agent.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.opportunity_agent_daily.arn
}

output "opportunity_agent_function_name" {
  value = aws_lambda_function.opportunity_agent.function_name
}
