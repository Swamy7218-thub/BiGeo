output "api_endpoint" {
  description = "Invoke URL for the address resolution API"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "address_graph_bucket" {
  description = "S3 bucket storing the Bharat Address Graph dataset"
  value       = aws_s3_bucket.address_graph.bucket
}

output "resolution_cache_table" {
  description = "DynamoDB table caching resolved addresses"
  value       = aws_dynamodb_table.resolution_cache.name
}
