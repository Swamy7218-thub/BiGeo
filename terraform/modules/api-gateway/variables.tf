variable "name_prefix" {
  type = string
}

variable "stage_name" {
  type    = string
  default = "v1"
}

variable "resolver_lambda_invoke_arn" {
  type = string
}

variable "resolver_lambda_function_name" {
  type = string
}

variable "auth0_authorizer_lambda_invoke_arn" {
  type = string
}

variable "auth0_authorizer_lambda_function_name" {
  type = string
}

variable "basic_tier_rate_limit" {
  type    = number
  default = 10
}

variable "basic_tier_burst_limit" {
  type    = number
  default = 20
}

variable "basic_tier_daily_quota" {
  type    = number
  default = 5000
}

variable "premium_tier_rate_limit" {
  type    = number
  default = 100
}

variable "premium_tier_burst_limit" {
  type    = number
  default = 200
}

variable "premium_tier_daily_quota" {
  type    = number
  default = 200000
}
