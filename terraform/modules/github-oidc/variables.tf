variable "github_org" {
  type = string
}

variable "github_repo" {
  type = string
}

variable "github_environment" {
  description = "GitHub Environment name (configured in repo settings) this role is scoped to"
  type        = string
}

variable "role_name" {
  type = string
}
