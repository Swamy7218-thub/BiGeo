output "review_queue_arn" {
  value = aws_sqs_queue.review_queue.arn
}

output "review_queue_url" {
  value = aws_sqs_queue.review_queue.id
}

output "review_dlq_arn" {
  value = aws_sqs_queue.review_dlq.arn
}
