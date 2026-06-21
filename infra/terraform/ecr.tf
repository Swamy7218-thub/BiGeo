locals {
  ecr_repo_names = ["api", "sourcing-agent", "scoring-agent", "resume-agent", "submission-agent", "reporting-agent"]
}

resource "aws_ecr_repository" "services" {
  for_each             = toset(local.ecr_repo_names)
  name                 = "${var.project_name}-${var.environment}-${each.value}"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "services" {
  for_each   = aws_ecr_repository.services
  repository = each.value.name

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
