terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }
  backend "s3" {
    bucket         = "bigeo-terraform-state"
    key            = "platform/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "bigeo-tf-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project = "BiGeo"
      Env     = var.environment
    }
  }
}

# ── Variables ─────────────────────────────────────────────────────────────────

variable "aws_region"   { default = "ap-south-1" }
variable "environment"  { default = "prod" }
variable "app_image"    { description = "ECR image URI for API gateway service" }

locals {
  prefix = "bigeo-platform"
}

# ── Networking ────────────────────────────────────────────────────────────────

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet("10.0.0.0/16", 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet("10.0.0.0/16", 8, count.index + 10)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_eip" "nat" { domain = "vpc" }

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

data "aws_availability_zones" "available" { state = "available" }

# ── ECS Cluster ───────────────────────────────────────────────────────────────

resource "aws_ecs_cluster" "platform" {
  name = "${local.prefix}-cluster"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_cluster_capacity_providers" "platform" {
  cluster_name       = aws_ecs_cluster.platform.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]
  default_capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 80
    base              = 0
  }
  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 20
    base              = 1
  }
}

# ── ECR Repository ────────────────────────────────────────────────────────────

resource "aws_ecr_repository" "api_gateway" {
  name                 = "${local.prefix}-api-gateway"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
}

resource "aws_ecr_repository" "hub_optimizer" {
  name                 = "${local.prefix}-hub-optimizer"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
}

resource "aws_ecr_repository" "route_optimizer" {
  name                 = "${local.prefix}-route-optimizer"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
}

resource "aws_ecr_lifecycle_policy" "retain_last_10" {
  for_each   = toset([aws_ecr_repository.api_gateway.name, aws_ecr_repository.hub_optimizer.name, aws_ecr_repository.route_optimizer.name])
  repository = each.key
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 10 }
      action = { type = "expire" }
    }]
  })
}

# ── IAM for ECS Tasks ─────────────────────────────────────────────────────────

resource "aws_iam_role" "ecs_task_execution" {
  name = "${local.prefix}-ecs-exec-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_exec" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name = "${local.prefix}-ecs-task-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy" "ecs_task_policy" {
  name = "${local.prefix}-task-policy"
  role = aws_iam_role.ecs_task.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { Effect = "Allow", Action = ["dynamodb:*"], Resource = "arn:aws:dynamodb:${var.aws_region}:*:table/bigeo-*" },
      { Effect = "Allow", Action = ["bedrock:InvokeModel"], Resource = "*" },
      { Effect = "Allow", Action = ["secretsmanager:GetSecretValue"], Resource = "arn:aws:secretsmanager:${var.aws_region}:*:secret:bigeo/*" },
      { Effect = "Allow", Action = ["elasticache:*"], Resource = "*" },
      { Effect = "Allow", Action = ["events:PutEvents"], Resource = "arn:aws:events:${var.aws_region}:*:event-bus/bigeo-logistics-events" },
      { Effect = "Allow", Action = ["logs:CreateLogStream", "logs:PutLogEvents"], Resource = "*" }
    ]
  })
}

# ── Security Groups ───────────────────────────────────────────────────────────

resource "aws_security_group" "alb" {
  name   = "${local.prefix}-alb-sg"
  vpc_id = aws_vpc.main.id
  ingress { from_port = 443, to_port = 443, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] }
  ingress { from_port = 80,  to_port = 80,  protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] }
  egress  { from_port = 0,   to_port = 0,   protocol = "-1",  cidr_blocks = ["0.0.0.0/0"] }
}

resource "aws_security_group" "ecs" {
  name   = "${local.prefix}-ecs-sg"
  vpc_id = aws_vpc.main.id
  ingress { from_port = 8000, to_port = 8000, protocol = "tcp", security_groups = [aws_security_group.alb.id] }
  egress  { from_port = 0,    to_port = 0,    protocol = "-1",  cidr_blocks    = ["0.0.0.0/0"] }
}

resource "aws_security_group" "redis" {
  name   = "${local.prefix}-redis-sg"
  vpc_id = aws_vpc.main.id
  ingress { from_port = 6379, to_port = 6379, protocol = "tcp", security_groups = [aws_security_group.ecs.id] }
}

# ── ALB ───────────────────────────────────────────────────────────────────────

resource "aws_lb" "platform" {
  name               = "${local.prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
}

resource "aws_lb_target_group" "api" {
  name        = "${local.prefix}-api-tg"
  port        = 8000
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

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.platform.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type = "redirect"
    redirect { port = "443", protocol = "HTTPS", status_code = "HTTP_301" }
  }
}

# ── ECS Task Definition: API Gateway ─────────────────────────────────────────

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/ecs/${local.prefix}/api-gateway"
  retention_in_days = 14
}

resource "aws_ecs_task_definition" "api_gateway" {
  family                   = "${local.prefix}-api-gateway"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "api-gateway"
    image = var.app_image
    portMappings = [{ containerPort = 8000, protocol = "tcp" }]
    environment = [
      { name = "AWS_REGION",       value = var.aws_region },
      { name = "ENVIRONMENT",      value = var.environment },
      { name = "REDIS_URL",        value = "redis://${aws_elasticache_serverless_cache.platform.endpoint[0].address}:6379" },
      { name = "EVENT_BUS_NAME",   value = aws_cloudwatch_event_bus.logistics.name }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.api_gateway.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "ecs"
      }
    }
    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])
}

resource "aws_ecs_service" "api_gateway" {
  name            = "${local.prefix}-api-gateway"
  cluster         = aws_ecs_cluster.platform.id
  task_definition = aws_ecs_task_definition.api_gateway.arn
  desired_count   = 2

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }
  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 3
    base              = 0
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api-gateway"
    container_port   = 8000
  }

  deployment_controller { type = "ECS" }
  deployment_circuit_breaker { enable = true, rollback = true }
}

# ── Auto Scaling ──────────────────────────────────────────────────────────────

resource "aws_appautoscaling_target" "api_gateway" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.platform.name}/${aws_ecs_service.api_gateway.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "${local.prefix}-api-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api_gateway.resource_id
  scalable_dimension = aws_appautoscaling_target.api_gateway.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api_gateway.service_namespace
  target_tracking_scaling_policy_configuration {
    target_value       = 70
    predefined_metric_specification { predefined_metric_type = "ECSServiceAverageCPUUtilization" }
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# ── ElastiCache Serverless (Redis) ────────────────────────────────────────────

resource "aws_elasticache_serverless_cache" "platform" {
  engine = "redis"
  name   = "${local.prefix}-cache"
  cache_usage_limits {
    data_storage { maximum = 5, unit = "GB" }
    ecpu_per_second { maximum = 5000 }
  }
  subnet_ids         = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.redis.id]
}

# ── DynamoDB Tables ───────────────────────────────────────────────────────────

resource "aws_dynamodb_table" "hubs" {
  name         = "bigeo-hubs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute { name = "PK", type = "S" }
  attribute { name = "SK", type = "S" }
  attribute { name = "GSI1PK", type = "S" }
  attribute { name = "GSI1SK", type = "S" }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }
}

resource "aws_dynamodb_table" "routes" {
  name         = "bigeo-routes"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute { name = "PK", type = "S" }
  attribute { name = "SK", type = "S" }
  attribute { name = "GSI1PK", type = "S" }
  attribute { name = "GSI1SK", type = "S" }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  ttl { attribute_name = "expires_at", enabled = true }
  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }
}

resource "aws_dynamodb_table" "deliveries" {
  name         = "bigeo-deliveries"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute { name = "PK", type = "S" }
  attribute { name = "SK", type = "S" }
  attribute { name = "GSI1PK", type = "S" }
  attribute { name = "GSI1SK", type = "S" }
  attribute { name = "GSI2PK", type = "S" }
  attribute { name = "GSI2SK", type = "S" }

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

  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }
}

resource "aws_dynamodb_table" "network_config" {
  name         = "bigeo-network-config"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute { name = "PK", type = "S" }
  attribute { name = "SK", type = "S" }

  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }
}

# ── EventBridge ───────────────────────────────────────────────────────────────

resource "aws_cloudwatch_event_bus" "logistics" {
  name = "bigeo-logistics-events"
}

resource "aws_cloudwatch_event_rule" "hub_optimized" {
  name           = "bigeo-hub-optimized"
  event_bus_name = aws_cloudwatch_event_bus.logistics.name
  event_pattern = jsonencode({
    source      = ["bigeo.platform"]
    detail-type = ["HubOptimized"]
  })
}

resource "aws_cloudwatch_event_rule" "route_completed" {
  name           = "bigeo-route-completed"
  event_bus_name = aws_cloudwatch_event_bus.logistics.name
  event_pattern = jsonencode({
    source      = ["bigeo.platform"]
    detail-type = ["RouteCompleted", "DeliveryStatusUpdated"]
  })
}

# ── CloudWatch Alarms ─────────────────────────────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "${local.prefix}-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "API 5xx error rate too high"
  dimensions = {
    LoadBalancer = aws_lb.platform.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  alarm_name          = "${local.prefix}-ecs-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 85
  dimensions = {
    ClusterName = aws_ecs_cluster.platform.name
    ServiceName = aws_ecs_service.api_gateway.name
  }
}

# ── Outputs ───────────────────────────────────────────────────────────────────

output "alb_dns_name" { value = aws_lb.platform.dns_name }
output "ecs_cluster_name" { value = aws_ecs_cluster.platform.name }
output "ecr_api_gateway_url" { value = aws_ecr_repository.api_gateway.repository_url }
output "ecr_hub_optimizer_url" { value = aws_ecr_repository.hub_optimizer.repository_url }
output "ecr_route_optimizer_url" { value = aws_ecr_repository.route_optimizer.repository_url }
output "redis_endpoint" { value = aws_elasticache_serverless_cache.platform.endpoint[0].address }
output "event_bus_name" { value = aws_cloudwatch_event_bus.logistics.name }
