terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }
  backend "s3" {
    bucket = "freightcheck-tfstate"
    key    = "freightcheck/terraform.tfstate"
    region = "ap-south-1"
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "FreightCheck"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ── S3 bucket for bill uploads ─────────────────────────────────────────────
resource "aws_s3_bucket" "bills" {
  bucket = "freightcheck-bills-${var.environment}"
}

resource "aws_s3_bucket_versioning" "bills" {
  bucket = aws_s3_bucket.bills.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_lifecycle_configuration" "bills" {
  bucket = aws_s3_bucket.bills.id
  rule {
    id     = "archive-old-bills"
    status = "Enabled"
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }
    filter { prefix = "" }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "bills" {
  bucket = aws_s3_bucket.bills.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ── SQS queue for bill processing ─────────────────────────────────────────
resource "aws_sqs_queue" "bill_dlq" {
  name                       = "freightcheck-bill-dlq-${var.environment}"
  message_retention_seconds  = 1209600 # 14 days
}

resource "aws_sqs_queue" "bills" {
  name                       = "freightcheck-bills-${var.environment}"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 86400
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.bill_dlq.arn
    maxReceiveCount     = 3
  })
}

# ── Lambda execution role ─────────────────────────────────────────────────
resource "aws_iam_role" "worker" {
  name = "freightcheck-worker-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "worker" {
  name = "freightcheck-worker-policy"
  role = aws_iam_role.worker.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject"]
        Resource = "${aws_s3_bucket.bills.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        Resource = aws_sqs_queue.bills.arn
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:*:*:*"
      },
    ]
  })
}

# ── Lambda function ────────────────────────────────────────────────────────
resource "aws_lambda_function" "worker" {
  function_name = "freightcheck-worker-${var.environment}"
  role          = aws_iam_role.worker.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  timeout       = 300
  memory_size   = 512
  filename      = "${path.module}/../../apps/worker/dist/worker.zip"

  environment {
    variables = {
      SUPABASE_URL              = var.supabase_url
      SUPABASE_SERVICE_ROLE_KEY = var.supabase_service_role_key
      ANTHROPIC_API_KEY         = var.anthropic_api_key
      S3_BUCKET                 = aws_s3_bucket.bills.bucket
      AWS_REGION_VAR            = var.aws_region
    }
  }
}

resource "aws_lambda_event_source_mapping" "sqs_to_worker" {
  event_source_arn = aws_sqs_queue.bills.arn
  function_name    = aws_lambda_function.worker.arn
  batch_size       = 1
}
