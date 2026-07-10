output "cloudtrail_arn" {
  description = "ARN of the CloudTrail trail"
  value       = module.security_baseline.cloudtrail_arn
}

output "guardduty_detector_id" {
  description = "GuardDuty detector ID"
  value       = module.security_baseline.guardduty_detector_id
}

output "security_hub_arn" {
  description = "Security Hub ARN"
  value       = module.security_baseline.security_hub_arn
}

output "waf_acl_arn" {
  description = "WAF Web ACL ARN (use with CloudFront or ALB)"
  value       = module.security_baseline.waf_acl_arn
}

output "sns_alert_topic_arn" {
  description = "SNS topic ARN for security alerts"
  value       = module.security_baseline.sns_alert_topic_arn
}

output "break_glass_role_arn" {
  description = "ARN of the BreakGlassAdmin IAM role"
  value       = module.security_baseline.break_glass_role_arn
}

output "security_auditor_role_arn" {
  description = "ARN of the SecurityAuditor IAM role"
  value       = module.security_baseline.security_auditor_role_arn
}

output "developer_role_arn" {
  description = "ARN of the DeveloperTemplate IAM role"
  value       = module.security_baseline.developer_role_arn
}

output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch security dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${module.security_baseline.dashboard_name}"
}
