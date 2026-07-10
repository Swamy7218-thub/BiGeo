variable "project" {
  description = "Project name used in resource tags and naming"
  type        = string
  default     = "bigeo"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "prod"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "alert_email" {
  description = "Email address to receive security alerts via SNS"
  type        = string
}

variable "cloudtrail_bucket_name" {
  description = "S3 bucket name for CloudTrail logs (must be globally unique)"
  type        = string
}

variable "waf_rate_limit" {
  description = "Max requests per 5-minute window per IP for WAF rate limiting"
  type        = number
  default     = 2000
}

variable "break_glass_external_id" {
  description = "ExternalId required to assume BreakGlassAdmin role (keep secret)"
  type        = string
  sensitive   = true
}

variable "trusted_account_id" {
  description = "AWS account ID that can assume the IAM roles"
  type        = string
}
