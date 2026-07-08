output "reference_data_table_name" {
  value = aws_dynamodb_table.reference_data.name
}

output "reference_data_table_arn" {
  value = aws_dynamodb_table.reference_data.arn
}

output "resolution_cache_table_name" {
  value = aws_dynamodb_table.resolution_cache.name
}

output "resolution_cache_table_arn" {
  value = aws_dynamodb_table.resolution_cache.arn
}

output "review_status_table_name" {
  value = aws_dynamodb_table.review_status.name
}

output "review_status_table_arn" {
  value = aws_dynamodb_table.review_status.arn
}
