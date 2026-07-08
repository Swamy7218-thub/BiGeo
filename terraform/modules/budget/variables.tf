variable "name_prefix" {
  type = string
}

variable "alert_email" {
  description = "Email address to receive budget/anomaly SNS alerts"
  type        = string
}

variable "monthly_limit_usd" {
  description = "Monthly cost budget in USD; alert fires at 80% actual and 100% forecasted"
  type        = string
}

variable "anomaly_threshold_usd" {
  description = "Minimum dollar impact for a cost anomaly to trigger an alert"
  type        = number
  default     = 10
}
