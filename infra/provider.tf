terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Configure with `terraform init -backend-config=...` (see infra/README.md)
  # so this repo doesn't hardcode a state bucket or account.
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}
