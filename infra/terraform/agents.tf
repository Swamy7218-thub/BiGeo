locals {
  # name -> { image command, schedule expression }
  batch_agents = {
    sourcing-agent   = { command = ["python", "-m", "agents.sourcing.run"], schedule = "rate(6 hours)" }
    scoring-agent    = { command = ["python", "-m", "agents.scoring.run"], schedule = "rate(6 hours)" }
    resume-agent     = { command = ["python", "-m", "agents.resume.run"], schedule = "rate(6 hours)" }
    submission-agent = { command = ["python", "-m", "agents.submission.run"], schedule = "rate(1 hour)" }
    reporting-agent  = { command = ["python", "-m", "agents.reporting.run"], schedule = "cron(0 13 * * ? *)" } # 13:00 UTC daily
  }
}

resource "aws_cloudwatch_log_group" "agents" {
  for_each          = local.batch_agents
  name              = "/ecs/${var.project_name}-${var.environment}/${each.key}"
  retention_in_days = 30
}

resource "aws_ecs_task_definition" "agents" {
  for_each                 = local.batch_agents
  family                   = "${var.project_name}-${var.environment}-${each.key}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = each.key
      image     = "${aws_ecr_repository.services[each.key].repository_url}:${var.api_image_tag}"
      essential = true
      command   = each.value.command
      secrets = [
        { name = "DATABASE_URL", valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:dbname::" },
      ]
      environment = [
        { name = "AWS_REGION", value = var.aws_region },
        { name = "DOCUMENTS_BUCKET", value = aws_s3_bucket.documents.bucket },
        { name = "REPORTS_FROM_EMAIL", value = var.reports_from_email },
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.agents[each.key].name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = each.key
        }
      }
    }
  ])
}

data "aws_iam_policy_document" "scheduler_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "scheduler" {
  name               = "${var.project_name}-${var.environment}-scheduler"
  assume_role_policy = data.aws_iam_policy_document.scheduler_assume.json
}

data "aws_iam_policy_document" "scheduler_run_task" {
  statement {
    actions   = ["ecs:RunTask"]
    resources = [for t in aws_ecs_task_definition.agents : "${t.arn_without_revision}:*"]
  }
  statement {
    actions   = ["iam:PassRole"]
    resources = [aws_iam_role.ecs_task_execution.arn, aws_iam_role.ecs_task.arn]
  }
}

resource "aws_iam_role_policy" "scheduler_run_task" {
  name   = "run-task"
  role   = aws_iam_role.scheduler.id
  policy = data.aws_iam_policy_document.scheduler_run_task.json
}

resource "aws_scheduler_schedule" "agents" {
  for_each = local.batch_agents

  name                = "${var.project_name}-${var.environment}-${each.key}"
  schedule_expression = each.value.schedule

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_ecs_cluster.main.arn
    role_arn = aws_iam_role.scheduler.arn

    ecs_parameters {
      task_definition_arn = aws_ecs_task_definition.agents[each.key].arn
      launch_type         = "FARGATE"
      network_configuration {
        subnets          = aws_subnet.private[*].id
        security_groups  = [aws_security_group.ecs_service.id]
        assign_public_ip = false
      }
    }
  }
}
