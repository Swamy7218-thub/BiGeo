terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment once you have an S3 bucket for state (chicken-and-egg on first apply):
  # backend "s3" {
  #   bucket = "bigeo-job-agent-tfstate"
  #   key    = "job-agent/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
}
