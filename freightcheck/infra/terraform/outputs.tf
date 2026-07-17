output "s3_bucket_name" {
  value = aws_s3_bucket.bills.bucket
}

output "sqs_queue_url" {
  value = aws_sqs_queue.bills.url
}

output "worker_lambda_name" {
  value = aws_lambda_function.worker.function_name
}
