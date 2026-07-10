terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment after running migrate-to-s3-backend.sh
  # backend "s3" {
  #   bucket         = "bigeo-terraform-state"
  #   key            = "security-baseline/terraform.tfstate"
  #   region         = "ap-south-1"
  #   dynamodb_table = "bigeo-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Secondary provider for us-east-1 (CloudFront WAF, etc.)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

module "security_baseline" {
  source = "./modules/security_baseline"

  project                = var.project
  environment            = var.environment
  aws_region             = var.aws_region
  alert_email            = var.alert_email
  cloudtrail_bucket_name = var.cloudtrail_bucket_name
  waf_rate_limit         = var.waf_rate_limit
  break_glass_external_id = var.break_glass_external_id
  trusted_account_id     = var.trusted_account_id

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }
}
