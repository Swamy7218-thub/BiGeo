output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "ecr_repository_urls" {
  value = { for k, v in aws_ecr_repository.services : k => v.repository_url }
}

output "db_endpoint" {
  value     = aws_db_instance.main.endpoint
  sensitive = true
}

output "documents_bucket" {
  value = aws_s3_bucket.documents.bucket
}

output "db_credentials_secret_arn" {
  value = aws_secretsmanager_secret.db_credentials.arn
}

output "app_api_keys_secret_arn" {
  value = aws_secretsmanager_secret.app_api_keys.arn
}
