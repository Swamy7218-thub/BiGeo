variable "alert_email" {
  description = "Email for billing and ops CloudWatch/SNS alerts"
  type        = string
}

variable "monthly_budget_usd" {
  description = "Monthly AWS cost budget for the prod environment (USD)"
  type        = string
  default     = "200"
}

variable "auth0_domain" {
  description = "Auth0 tenant domain, e.g. bigeo.us.auth0.com"
  type        = string
}

variable "auth0_audience" {
  description = "Auth0 API identifier (audience) for the BiGeo external API"
  type        = string
}

variable "resolver_provisioned_concurrency" {
  description = "Set > 0 only once a premium tier's p99 latency SLA requires it"
  type        = number
  default     = 0
}

variable "premium_tier_rate_limit" {
  type    = number
  default = 100
}

variable "premium_tier_burst_limit" {
  type    = number
  default = 200
}

variable "auth0_authorizer_layer_arns" {
  description = "Lambda layer ARN(s) providing pyjwt[crypto] for the Auth0 authorizer (see terraform/README.md)"
  type        = list(string)
  default     = []
}
