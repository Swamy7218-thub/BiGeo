terraform {
  required_version = ">= 1.7"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Phase 0: state placeholder only. No resources are created yet.
# Phase 1 will add: ECR repo, ECS Fargate service, RDS (or DynamoDB),
# Secrets Manager entries, and an API Gateway/ALB front door for
# the address-resolver service.
