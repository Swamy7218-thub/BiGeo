resource "aws_sqs_queue" "review_dlq" {
  name                      = "${var.name_prefix}-review-dlq"
  message_retention_seconds = 1209600 # 14 days, max

  tags = { Name = "${var.name_prefix}-review-dlq" }
}

resource "aws_sqs_queue" "review_queue" {
  name                       = "${var.name_prefix}-review-queue"
  visibility_timeout_seconds = 60
  message_retention_seconds  = 345600 # 4 days

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.review_dlq.arn
    maxReceiveCount     = 5
  })

  tags = { Name = "${var.name_prefix}-review-queue" }
}

resource "aws_sqs_queue_redrive_allow_policy" "review_dlq" {
  queue_url = aws_sqs_queue.review_dlq.id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue"
    sourceQueueArns   = [aws_sqs_queue.review_queue.arn]
  })
}
