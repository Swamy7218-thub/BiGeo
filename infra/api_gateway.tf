resource "aws_apigatewayv2_api" "resolver" {
  name          = "bigeo-address-resolver-${var.environment}"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "resolver" {
  api_id                 = aws_apigatewayv2_api.resolver.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.resolver.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "resolve_address" {
  api_id    = aws_apigatewayv2_api.resolver.id
  route_key = "POST /resolve"
  target    = "integrations/${aws_apigatewayv2_integration.resolver.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.resolver.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.resolver.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.resolver.execution_arn}/*/*"
}
