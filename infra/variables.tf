variable "aws_region" {
  description = "AWS region to deploy BiGeo resources into"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment environment name (e.g. dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "address_graph_bucket_name" {
  description = "Name of the S3 bucket storing the Bharat Address Graph dataset"
  type        = string
}

variable "anthropic_api_key" {
  description = "API key for Claude AI, passed to the resolver Lambda as an environment variable"
  type        = string
  sensitive   = true
}

variable "lambda_package_path" {
  description = "Path to the built resolver Lambda deployment package (zip)"
  type        = string
  default     = "./build/resolver.zip"
}
