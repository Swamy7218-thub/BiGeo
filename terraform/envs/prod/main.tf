terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1"

  default_tags {
    tags = {
      Project     = "bigeo"
      Environment = "prod"
      ManagedBy   = "terraform"
    }
  }
}

module "github_actions_role" {
  source = "../../modules/github-oidc"

  github_org         = "Swamy7218-thub"
  github_repo        = "BiGeo"
  github_environment = "prod"
  role_name          = "bigeo-github-actions-prod"
}
