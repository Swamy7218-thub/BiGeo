output "github_actions_role_arn" {
  value = module.github_actions_role.role_arn
}

output "api_invoke_url" {
  value = module.api_gateway.invoke_url
}

output "vpc_id" {
  value = module.vpc.vpc_id
}
