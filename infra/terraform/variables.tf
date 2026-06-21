variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix used for naming all resources"
  type        = string
  default     = "job-agent"
}

variable "environment" {
  description = "Deployment environment (staging/production), per architecture doc section 17"
  type        = string
  default     = "staging"
}

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "db_instance_class" {
  description = "Single-AZ small instance to start, per architecture doc section 14 cost guidance"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_name" {
  type    = string
  default = "job_agent"
}

variable "db_username" {
  type    = string
  default = "job_agent_admin"
}

variable "api_image_tag" {
  description = "Tag of the apps/api image to deploy, set by CI on release"
  type        = string
  default     = "latest"
}

variable "api_desired_count" {
  type    = number
  default = 1
}

variable "reports_from_email" {
  description = "SES-verified sender address for the daily report digest"
  type        = string
  default     = ""
}

variable "alert_email" {
  description = "Where to send CloudWatch alarm notifications"
  type        = string
  default     = ""
}
