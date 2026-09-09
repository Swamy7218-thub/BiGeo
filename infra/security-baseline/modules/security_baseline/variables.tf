variable "project" { type = string }
variable "environment" { type = string }
variable "aws_region" { type = string }
variable "alert_email" { type = string }
variable "cloudtrail_bucket_name" { type = string }
variable "waf_rate_limit" { type = number }
variable "break_glass_external_id" { type = string; sensitive = true }
variable "trusted_account_id" { type = string }
