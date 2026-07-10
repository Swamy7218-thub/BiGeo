terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.us_east_1]
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
  name_prefix = "${var.project}-${var.environment}"
}

# ─────────────────────────────────────────────
# KMS KEYS
# ─────────────────────────────────────────────

resource "aws_kms_key" "cloudtrail" {
  description             = "KMS key for CloudTrail log encryption"
  deletion_window_in_days = 14
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = { AWS = "arn:aws:iam::${local.account_id}:root" }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:*:${local.account_id}:trail/*"
          }
        }
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = { Service = "logs.${local.region}.amazonaws.com" }
        Action = [
          "kms:Encrypt*",
          "kms:Decrypt*",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:Describe*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = { Name = "${local.name_prefix}-cloudtrail-key" }
}

resource "aws_kms_alias" "cloudtrail" {
  name          = "alias/${local.name_prefix}-cloudtrail"
  target_key_id = aws_kms_key.cloudtrail.key_id
}

resource "aws_kms_key" "sns" {
  description             = "KMS key for SNS topic encryption"
  deletion_window_in_days = 14
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = { AWS = "arn:aws:iam::${local.account_id}:root" }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch to publish"
        Effect = "Allow"
        Principal = { Service = "cloudwatch.amazonaws.com" }
        Action   = ["kms:GenerateDataKey*", "kms:Decrypt"]
        Resource = "*"
      }
    ]
  })

  tags = { Name = "${local.name_prefix}-sns-key" }
}

resource "aws_kms_alias" "sns" {
  name          = "alias/${local.name_prefix}-sns"
  target_key_id = aws_kms_key.sns.key_id
}

# ─────────────────────────────────────────────
# SNS ALERT TOPIC
# ─────────────────────────────────────────────

resource "aws_sns_topic" "security_alerts" {
  name              = "${local.name_prefix}-security-alerts"
  kms_master_key_id = aws_kms_key.sns.arn
  tags              = { Name = "${local.name_prefix}-security-alerts" }
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# ─────────────────────────────────────────────
# S3 — CLOUDTRAIL BUCKET
# ─────────────────────────────────────────────

resource "aws_s3_bucket" "cloudtrail" {
  bucket        = var.cloudtrail_bucket_name
  force_destroy = false
  tags          = { Name = var.cloudtrail_bucket_name }
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.cloudtrail.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket                  = aws_s3_bucket.cloudtrail.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  rule {
    id     = "archive-and-expire"
    status = "Enabled"
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }
    transition {
      days          = 365
      storage_class = "GLACIER"
    }
    expiration { days = 2557 } # 7 years
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/AWSLogs/${local.account_id}/*"
        Condition = {
          StringEquals = { "s3:x-amz-acl" = "bucket-owner-full-control" }
        }
      },
      {
        Sid    = "DenyNonSSL"
        Effect = "Deny"
        Principal = "*"
        Action   = "s3:*"
        Resource = [
          aws_s3_bucket.cloudtrail.arn,
          "${aws_s3_bucket.cloudtrail.arn}/*"
        ]
        Condition = { Bool = { "aws:SecureTransport" = "false" } }
      }
    ]
  })
}

# ─────────────────────────────────────────────
# CLOUDWATCH LOG GROUP FOR CLOUDTRAIL
# ─────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${local.name_prefix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.cloudtrail.arn
  tags              = { Name = "${local.name_prefix}-cloudtrail-logs" }
}

resource "aws_iam_role" "cloudtrail_cloudwatch" {
  name = "${local.name_prefix}-cloudtrail-cw-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "cloudtrail.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
  tags = { Name = "${local.name_prefix}-cloudtrail-cw-role" }
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  name = "CloudTrailCloudWatchPolicy"
  role = aws_iam_role.cloudtrail_cloudwatch.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
    }]
  })
}

# ─────────────────────────────────────────────
# CLOUDTRAIL
# ─────────────────────────────────────────────

resource "aws_cloudtrail" "main" {
  name                          = "${local.name_prefix}-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.cloudtrail.arn
  cloud_watch_logs_group_arn    = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn     = aws_iam_role.cloudtrail_cloudwatch.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::"]
    }

    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda"]
    }
  }

  depends_on = [
    aws_s3_bucket_policy.cloudtrail,
    aws_cloudwatch_log_group.cloudtrail
  ]

  tags = { Name = "${local.name_prefix}-trail" }
}

# ─────────────────────────────────────────────
# GUARDDUTY
# ─────────────────────────────────────────────

resource "aws_guardduty_detector" "main" {
  enable                       = true
  finding_publishing_frequency = "FIFTEEN_MINUTES"

  datasources {
    s3_logs { enable = true }
    kubernetes { audit_logs { enable = true } }
    malware_protection {
      scan_ec2_instance_with_findings { ebs_volumes { enable = true } }
    }
  }

  tags = { Name = "${local.name_prefix}-guardduty" }
}

resource "aws_guardduty_publishing_destination" "s3" {
  detector_id     = aws_guardduty_detector.main.id
  destination_arn = aws_s3_bucket.cloudtrail.arn
  kms_key_arn     = aws_kms_key.cloudtrail.arn
  destination_type = "S3"
}

# ─────────────────────────────────────────────
# SECURITY HUB
# ─────────────────────────────────────────────

resource "aws_securityhub_account" "main" {}

resource "aws_securityhub_standards_subscription" "aws_foundational" {
  standards_arn = "arn:aws:securityhub:${local.region}::standards/aws-foundational-security-best-practices/v/1.0.0"
  depends_on    = [aws_securityhub_account.main]
}

resource "aws_securityhub_standards_subscription" "cis" {
  standards_arn = "arn:aws:securityhub:::ruleset/cis-aws-foundations-benchmark/v/1.2.0"
  depends_on    = [aws_securityhub_account.main]
}

# ─────────────────────────────────────────────
# AWS INSPECTOR
# ─────────────────────────────────────────────

resource "aws_inspector2_enabler" "main" {
  account_ids    = [local.account_id]
  resource_types = ["EC2", "ECR", "LAMBDA"]
}

# ─────────────────────────────────────────────
# WAF (us-east-1 for CloudFront)
# ─────────────────────────────────────────────

resource "aws_wafv2_web_acl" "main" {
  provider    = aws.us_east_1
  name        = "${local.name_prefix}-waf"
  description = "BiGeo WAF — OWASP Top 10 + rate limiting"
  scope       = "CLOUDFRONT"

  default_action { allow {} }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1
    action { block {} }
    statement {
      rate_based_statement {
        limit              = var.waf_rate_limit
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed — Common Rule Set (OWASP)
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2
    override_action { none {} }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-common-rules"
      sampled_requests_enabled   = true
    }
  }

  # SQL Injection
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 3
    override_action { none {} }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-sqli"
      sampled_requests_enabled   = true
    }
  }

  # Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 4
    override_action { none {} }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}-waf"
    sampled_requests_enabled   = true
  }

  tags = { Name = "${local.name_prefix}-waf" }
}

# ─────────────────────────────────────────────
# CLOUDWATCH METRIC FILTERS
# ─────────────────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "root_account_usage" {
  alarm_name          = "${local.name_prefix}-root-account-usage"
  alarm_description   = "Alert on root account usage"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "RootAccountUsage"
  namespace           = "${local.name_prefix}/SecurityMetrics"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  ok_actions          = [aws_sns_topic.security_alerts.arn]
  treat_missing_data  = "notBreaching"
  tags                = { Name = "${local.name_prefix}-root-usage-alarm" }
}

resource "aws_cloudwatch_log_metric_filter" "root_account_usage" {
  name           = "${local.name_prefix}-root-account-usage"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ $.userIdentity.type = \"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != \"AwsServiceEvent\" }"

  metric_transformation {
    name      = "RootAccountUsage"
    namespace = "${local.name_prefix}/SecurityMetrics"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls" {
  name           = "${local.name_prefix}-unauthorized-api-calls"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.errorCode = \"*UnauthorizedAccess*\") || ($.errorCode = \"AccessDenied*\") }"

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "${local.name_prefix}/SecurityMetrics"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  alarm_name          = "${local.name_prefix}-unauthorized-api-calls"
  alarm_description   = "Alert on 5+ unauthorized API calls in 5 minutes"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "${local.name_prefix}/SecurityMetrics"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  treat_missing_data  = "notBreaching"
  tags                = { Name = "${local.name_prefix}-unauthorized-api-alarm" }
}

resource "aws_cloudwatch_log_metric_filter" "iam_policy_changes" {
  name           = "${local.name_prefix}-iam-policy-changes"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{($.eventName=DeleteGroupPolicy)||($.eventName=DeleteRolePolicy)||($.eventName=DeleteUserPolicy)||($.eventName=PutGroupPolicy)||($.eventName=PutRolePolicy)||($.eventName=PutUserPolicy)||($.eventName=CreatePolicy)||($.eventName=DeletePolicy)||($.eventName=CreatePolicyVersion)||($.eventName=DeletePolicyVersion)||($.eventName=SetDefaultPolicyVersion)||($.eventName=AttachRolePolicy)||($.eventName=DetachRolePolicy)||($.eventName=AttachUserPolicy)||($.eventName=DetachUserPolicy)||($.eventName=AttachGroupPolicy)||($.eventName=DetachGroupPolicy)}"

  metric_transformation {
    name      = "IAMPolicyChanges"
    namespace = "${local.name_prefix}/SecurityMetrics"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "iam_policy_changes" {
  alarm_name          = "${local.name_prefix}-iam-policy-changes"
  alarm_description   = "Alert on IAM policy changes"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "IAMPolicyChanges"
  namespace           = "${local.name_prefix}/SecurityMetrics"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  treat_missing_data  = "notBreaching"
  tags                = { Name = "${local.name_prefix}-iam-policy-alarm" }
}

resource "aws_cloudwatch_log_metric_filter" "s3_bucket_policy_changes" {
  name           = "${local.name_prefix}-s3-policy-changes"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.eventSource = s3.amazonaws.com) && (($.eventName = PutBucketAcl) || ($.eventName = PutBucketPolicy) || ($.eventName = PutBucketCors) || ($.eventName = PutBucketLifecycle) || ($.eventName = PutBucketReplication) || ($.eventName = DeleteBucketPolicy) || ($.eventName = DeleteBucketCors) || ($.eventName = DeleteBucketLifecycle) || ($.eventName = DeleteBucketReplication)) }"

  metric_transformation {
    name      = "S3BucketPolicyChanges"
    namespace = "${local.name_prefix}/SecurityMetrics"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "s3_bucket_policy_changes" {
  alarm_name          = "${local.name_prefix}-s3-policy-changes"
  alarm_description   = "Alert on S3 bucket policy changes"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "S3BucketPolicyChanges"
  namespace           = "${local.name_prefix}/SecurityMetrics"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  treat_missing_data  = "notBreaching"
  tags                = { Name = "${local.name_prefix}-s3-policy-alarm" }
}

# ─────────────────────────────────────────────
# CLOUDWATCH DASHBOARD
# ─────────────────────────────────────────────

resource "aws_cloudwatch_dashboard" "security" {
  dashboard_name = "${local.name_prefix}-security"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0; y = 0; width = 6; height = 6
        properties = {
          title  = "Root Account Usage"
          metrics = [[
            "${local.name_prefix}/SecurityMetrics",
            "RootAccountUsage"
          ]]
          period = 300
          stat   = "Sum"
          view   = "timeSeries"
          region = local.region
        }
      },
      {
        type   = "metric"
        x      = 6; y = 0; width = 6; height = 6
        properties = {
          title  = "Unauthorized API Calls"
          metrics = [[
            "${local.name_prefix}/SecurityMetrics",
            "UnauthorizedAPICalls"
          ]]
          period = 300
          stat   = "Sum"
          view   = "timeSeries"
          region = local.region
        }
      },
      {
        type   = "metric"
        x      = 12; y = 0; width = 6; height = 6
        properties = {
          title  = "IAM Policy Changes"
          metrics = [[
            "${local.name_prefix}/SecurityMetrics",
            "IAMPolicyChanges"
          ]]
          period = 300
          stat   = "Sum"
          view   = "timeSeries"
          region = local.region
        }
      },
      {
        type   = "metric"
        x      = 18; y = 0; width = 6; height = 6
        properties = {
          title  = "S3 Policy Changes"
          metrics = [[
            "${local.name_prefix}/SecurityMetrics",
            "S3BucketPolicyChanges"
          ]]
          period = 300
          stat   = "Sum"
          view   = "timeSeries"
          region = local.region
        }
      },
      {
        type   = "alarm"
        x      = 0; y = 6; width = 12; height = 4
        properties = {
          title  = "Security Alarms Status"
          alarms = [
            "arn:aws:cloudwatch:${local.region}:${local.account_id}:alarm:${local.name_prefix}-root-account-usage",
            "arn:aws:cloudwatch:${local.region}:${local.account_id}:alarm:${local.name_prefix}-unauthorized-api-calls",
            "arn:aws:cloudwatch:${local.region}:${local.account_id}:alarm:${local.name_prefix}-iam-policy-changes",
            "arn:aws:cloudwatch:${local.region}:${local.account_id}:alarm:${local.name_prefix}-s3-policy-changes"
          ]
        }
      },
      {
        type   = "metric"
        x      = 12; y = 6; width = 12; height = 4
        properties = {
          title  = "WAF Blocked Requests"
          metrics = [
            ["AWS/WAFV2", "BlockedRequests", "WebACL", "${local.name_prefix}-waf", "Rule", "ALL", "Region", "us-east-1"]
          ]
          period = 300
          stat   = "Sum"
          view   = "timeSeries"
          region = "us-east-1"
        }
      },
      {
        type   = "metric"
        x      = 0; y = 10; width = 12; height = 4
        properties = {
          title  = "Lambda Parse Function — Errors & Duration"
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", "vaahan-parse-address", { "stat" = "Sum", "label" = "Errors" }],
            ["AWS/Lambda", "Duration", "FunctionName", "vaahan-parse-address", { "stat" = "p95", "label" = "p95 Duration" }]
          ]
          period = 300
          view   = "timeSeries"
          region = local.region
        }
      },
      {
        type   = "metric"
        x      = 12; y = 10; width = 12; height = 4
        properties = {
          title  = "API Gateway — 4xx & 5xx Errors"
          metrics = [
            ["AWS/ApiGateway", "4XXError", "ApiId", "v34s17v3h2", { "stat" = "Sum", "label" = "4xx" }],
            ["AWS/ApiGateway", "5XXError", "ApiId", "v34s17v3h2", { "stat" = "Sum", "label" = "5xx" }]
          ]
          period = 300
          view   = "timeSeries"
          region = local.region
        }
      }
    ]
  })
}

# ─────────────────────────────────────────────
# IAM ROLES
# ─────────────────────────────────────────────

# 1. BreakGlassAdmin — requires ExternalId
resource "aws_iam_role" "break_glass_admin" {
  name                 = "${local.name_prefix}-BreakGlassAdmin"
  max_session_duration = 3600

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "BreakGlassAssumeRole"
      Effect = "Allow"
      Principal = {
        AWS = "arn:aws:iam::${var.trusted_account_id}:root"
      }
      Action = "sts:AssumeRole"
      Condition = {
        StringEquals = {
          "sts:ExternalId" = var.break_glass_external_id
        }
        Bool = {
          "aws:MultiFactorAuthPresent" = "true"
        }
      }
    }]
  })

  tags = {
    Name        = "${local.name_prefix}-BreakGlassAdmin"
    Sensitivity = "CRITICAL"
    Usage       = "Emergency access only — requires ExternalId + MFA"
  }
}

resource "aws_iam_role_policy_attachment" "break_glass_admin" {
  role       = aws_iam_role.break_glass_admin.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# 2. SecurityAuditor — read-only
resource "aws_iam_role" "security_auditor" {
  name                 = "${local.name_prefix}-SecurityAuditor"
  max_session_duration = 43200

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        AWS = "arn:aws:iam::${var.trusted_account_id}:root"
      }
      Action = "sts:AssumeRole"
      Condition = {
        Bool = { "aws:MultiFactorAuthPresent" = "true" }
      }
    }]
  })

  tags = { Name = "${local.name_prefix}-SecurityAuditor" }
}

resource "aws_iam_role_policy_attachment" "security_auditor_ro" {
  role       = aws_iam_role.security_auditor.name
  policy_arn = "arn:aws:iam::aws:policy/SecurityAudit"
}

resource "aws_iam_role_policy_attachment" "security_auditor_view" {
  role       = aws_iam_role.security_auditor.name
  policy_arn = "arn:aws:iam::aws:policy/job-function/ViewOnlyAccess"
}

# 3. DeveloperTemplate — least-privilege for BiGeo dev work
resource "aws_iam_role" "developer" {
  name                 = "${local.name_prefix}-DeveloperTemplate"
  max_session_duration = 43200

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        AWS = "arn:aws:iam::${var.trusted_account_id}:root"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = { Name = "${local.name_prefix}-DeveloperTemplate" }
}

resource "aws_iam_role_policy" "developer" {
  name = "BiGeoDeveloperPolicy"
  role = aws_iam_role.developer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "LambdaDeploy"
        Effect = "Allow"
        Action = [
          "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration",
          "lambda:GetFunction",
          "lambda:GetFunctionConfiguration",
          "lambda:ListFunctions",
          "lambda:InvokeFunction",
          "lambda:GetPolicy"
        ]
        Resource = "arn:aws:lambda:ap-south-1:${local.account_id}:function:vaahan-*"
      },
      {
        Sid    = "S3Portal"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::vaahan-portal-bigeo",
          "arn:aws:s3:::vaahan-portal-bigeo/*"
        ]
      },
      {
        Sid    = "CloudFrontInvalidate"
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation",
          "cloudfront:GetInvalidation",
          "cloudfront:ListInvalidations"
        ]
        Resource = "*"
      },
      {
        Sid    = "DynamoDBBiGeo"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          "arn:aws:dynamodb:ap-south-1:${local.account_id}:table/bigeo-*"
        ]
      },
      {
        Sid    = "BedrockRead"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
          "bedrock:RetrieveAndGenerate",
          "bedrock:Retrieve"
        ]
        Resource = "*"
      },
      {
        Sid    = "LogsRead"
        Effect = "Allow"
        Action = [
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents",
          "logs:FilterLogEvents",
          "logs:StartQuery",
          "logs:GetQueryResults"
        ]
        Resource = "arn:aws:logs:ap-south-1:${local.account_id}:log-group:/aws/lambda/vaahan-*:*"
      },
      {
        Sid    = "DenySecurityChanges"
        Effect = "Deny"
        Action = [
          "iam:CreateUser",
          "iam:DeleteUser",
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:PutRolePolicy",
          "iam:DeleteRolePolicy",
          "cloudtrail:DeleteTrail",
          "cloudtrail:StopLogging",
          "guardduty:DeleteDetector",
          "securityhub:DeleteHub"
        ]
        Resource = "*"
      }
    ]
  })
}
