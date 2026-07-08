output "invoke_url" {
  value = aws_api_gateway_stage.this.invoke_url
}

output "rest_api_id" {
  value = aws_api_gateway_rest_api.this.id
}

output "execution_arn" {
  value = aws_api_gateway_rest_api.this.execution_arn
}

output "basic_usage_plan_id" {
  value = aws_api_gateway_usage_plan.basic.id
}

output "premium_usage_plan_id" {
  value = aws_api_gateway_usage_plan.premium.id
}
