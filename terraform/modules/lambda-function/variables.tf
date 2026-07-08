variable "function_name" {
  type = string
}

variable "source_dir" {
  description = "Path to the Lambda source directory to zip"
  type        = string
}

variable "handler" {
  type    = string
  default = "handler.lambda_handler"
}

variable "runtime" {
  type    = string
  default = "python3.13"
}

variable "timeout_seconds" {
  type    = number
  default = 15
}

variable "memory_mb" {
  type    = number
  default = 256
}

variable "reserved_concurrency" {
  description = "-1 disables the limit (on-demand scaling). Set explicitly only to cap runaway cost/downstream load."
  type        = number
  default     = -1
}

variable "provisioned_concurrency" {
  description = "0 disables provisioned concurrency. Only set > 0 if p99 latency SLA for a premium tier requires it."
  type        = number
  default     = 0
}

variable "environment_variables" {
  type    = map(string)
  default = {}
}

variable "layers" {
  description = "Lambda layer ARNs, e.g. for third-party dependencies not in the base runtime"
  type        = list(string)
  default     = []
}

variable "policy_statements" {
  description = "Extra IAM policy statements (list of policy statement objects) beyond basic execution + X-Ray"
  type        = list(any)
  default     = []
}

variable "alarm_sns_topic_arn" {
  type = string
}

variable "error_alarm_threshold" {
  type    = number
  default = 5
}

variable "duration_alarm_threshold_ms" {
  type    = number
  default = 10000
}

variable "log_retention_days" {
  type    = number
  default = 30
}
