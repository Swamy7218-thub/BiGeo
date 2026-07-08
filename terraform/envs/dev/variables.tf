variable "alert_email" {
  description = "Email for billing and ops CloudWatch/SNS alerts"
  type        = string
}

variable "monthly_budget_usd" {
  description = "Monthly AWS cost budget for the dev environment (USD)"
  type        = string
  default     = "50"
}

variable "auth0_domain" {
  description = "Auth0 tenant domain, e.g. bigeo-dev.us.auth0.com"
  type        = string
}

variable "auth0_audience" {
  description = "Auth0 API identifier (audience) for the BiGeo external API"
  type        = string
}

variable "auth0_authorizer_layer_arns" {
  description = "Lambda layer ARN(s) providing pyjwt[crypto] for the Auth0 authorizer (see terraform/README.md)"
  type        = list(string)
  default     = []
}
