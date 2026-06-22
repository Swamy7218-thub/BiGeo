# ── Phase 1: booking-service + customer-web ──────────────────────────────────
# Adds HTTPS to the shared ALB (book.bigeo.in, api.bigeo.in) and runs
# booking-service + customer-web as new ECS Fargate services on the
# existing cluster/VPC. Review before `terraform apply` — this changes
# the shared ALB listeners used by api-gateway.

variable "booking_service_image" {
  description = "ECR image URI for booking-service"
  default     = "nginx:latest"
}

variable "customer_web_image" {
  description = "ECR image URI for customer-web"
  default     = "nginx:latest"
}

variable "razorpay_key_id" {
  description = "Razorpay key id (passed to booking-service task)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "razorpay_key_secret" {
  description = "Razorpay key secret (passed to booking-service task)"
  type        = string
  default     = ""
  sensitive   = true
}

# ── DNS + TLS ─────────────────────────────────────────────────────────────────
# Assumes bigeo.in is already a Route53-hosted zone (it must be, since
# bigeo.in already resolves to the S3 static site). Looked up by name,
# not created, to avoid touching the existing zone/NS records.

data "aws_route53_zone" "bigeo" {
  name         = "bigeo.in."
  private_zone = false
}

resource "aws_acm_certificate" "platform" {
  domain_name               = "book.bigeo.in"
  subject_alternative_names = ["api.bigeo.in"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "platform_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.platform.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }
  zone_id = data.aws_route53_zone.bigeo.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 300
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "platform" {
  certificate_arn         = aws_acm_certificate.platform.arn
  validation_record_fqdns = [for r in aws_route53_record.platform_cert_validation : r.fqdn]
}

resource "aws_route53_record" "book" {
  zone_id = data.aws_route53_zone.bigeo.zone_id
  name    = "book.bigeo.in"
  type    = "A"

  alias {
    name                   = aws_lb.platform.dns_name
    zone_id                = aws_lb.platform.zone_id
    evaluate_target_health = true
  }
}

# ── ALB: HTTPS listener + host-based routing ─────────────────────────────────

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.platform.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.platform.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.customer_web.arn
  }
}

resource "aws_lb_listener_rule" "booking_api" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.booking_service.arn
  }

  condition {
    path_pattern {
      values = ["/health", "/auth/*", "/quote", "/bookings*"]
    }
  }
}

# ── booking-service ───────────────────────────────────────────────────────────

resource "aws_ecr_repository" "booking_service" {
  name                 = "${local.prefix}-booking-service"
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "booking_service" {
  repository = aws_ecr_repository.booking_service.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_cloudwatch_log_group" "booking_service" {
  name              = "/ecs/${local.prefix}/booking-service"
  retention_in_days = 14
}

resource "aws_lb_target_group" "booking_service" {
  name        = "${local.prefix}-booking-tg"
  port        = 8005
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
  }
}

resource "aws_ecs_task_definition" "booking_service" {
  family                   = "${local.prefix}-booking-service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "booking-service"
    image = var.booking_service_image

    portMappings = [{
      containerPort = 8005
      protocol      = "tcp"
    }]

    environment = [
      { name = "AWS_REGION", value = var.aws_region },
      { name = "ENVIRONMENT", value = var.environment },
      { name = "REDIS_URL", value = "redis://${aws_elasticache_serverless_cache.platform.endpoint[0].address}:${aws_elasticache_serverless_cache.platform.endpoint[0].port}" },
    ]

    secrets = [
      { name = "RAZORPAY_KEY_ID", valueFrom = "${aws_ssm_parameter.razorpay_key_id.arn}" },
      { name = "RAZORPAY_KEY_SECRET", valueFrom = "${aws_ssm_parameter.razorpay_key_secret.arn}" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.booking_service.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:8005/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])
}

resource "aws_ssm_parameter" "razorpay_key_id" {
  name  = "/${local.prefix}/booking-service/razorpay_key_id"
  type  = "SecureString"
  value = var.razorpay_key_id
}

resource "aws_ssm_parameter" "razorpay_key_secret" {
  name  = "/${local.prefix}/booking-service/razorpay_key_secret"
  type  = "SecureString"
  value = var.razorpay_key_secret
}

resource "aws_ecs_service" "booking_service" {
  name            = "${local.prefix}-booking-service"
  cluster         = aws_ecs_cluster.platform.id
  task_definition = aws_ecs_task_definition.booking_service.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.booking_service.arn
    container_name   = "booking-service"
    container_port   = 8005
  }

  depends_on = [aws_lb_listener_rule.booking_api]
}

# ── booking-service DynamoDB tables ───────────────────────────────────────────

resource "aws_dynamodb_table" "otp" {
  name         = "bigeo-otp"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }

  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }
}

resource "aws_dynamodb_table" "users" {
  name         = "bigeo-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }
}

resource "aws_dynamodb_table" "bookings" {
  name         = "bigeo-bookings"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }
  attribute {
    name = "GSI1PK"
    type = "S"
  }
  attribute {
    name = "GSI1SK"
    type = "S"
  }
  attribute {
    name = "GSI2PK"
    type = "S"
  }
  attribute {
    name = "GSI2SK"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "GSI2"
    hash_key        = "GSI2PK"
    range_key       = "GSI2SK"
    projection_type = "ALL"
  }
}

resource "aws_dynamodb_table" "payments" {
  name         = "bigeo-payments"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }
}

# ── booking-service docs bucket ───────────────────────────────────────────────

resource "aws_s3_bucket" "booking_docs" {
  bucket = "bigeo-booking-docs"
}

resource "aws_s3_bucket_public_access_block" "booking_docs" {
  bucket                  = aws_s3_bucket.booking_docs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "booking_docs" {
  bucket = aws_s3_bucket.booking_docs.id

  cors_rule {
    allowed_methods = ["PUT"]
    allowed_origins = ["https://bigeo.in", "https://book.bigeo.in"]
    allowed_headers = ["*"]
  }
}

# ── customer-web ──────────────────────────────────────────────────────────────

resource "aws_ecr_repository" "customer_web" {
  name                 = "${local.prefix}-customer-web"
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "customer_web" {
  repository = aws_ecr_repository.customer_web.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_cloudwatch_log_group" "customer_web" {
  name              = "/ecs/${local.prefix}/customer-web"
  retention_in_days = 14
}

resource "aws_lb_target_group" "customer_web" {
  name        = "${local.prefix}-customer-web-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
  }
}

resource "aws_ecs_task_definition" "customer_web" {
  family                   = "${local.prefix}-customer-web"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "customer-web"
    image = var.customer_web_image

    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]

    environment = [
      { name = "NEXT_PUBLIC_BOOKING_API_URL", value = "https://book.bigeo.in" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.customer_web.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:3000/ || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])
}

resource "aws_ecs_service" "customer_web" {
  name            = "${local.prefix}-customer-web"
  cluster         = aws_ecs_cluster.platform.id
  task_definition = aws_ecs_task_definition.customer_web.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.customer_web.arn
    container_name   = "customer-web"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.https]
}

output "book_url" {
  value = "https://book.bigeo.in"
}

output "ecr_booking_service_url" {
  value = aws_ecr_repository.booking_service.repository_url
}

output "ecr_customer_web_url" {
  value = aws_ecr_repository.customer_web.repository_url
}
