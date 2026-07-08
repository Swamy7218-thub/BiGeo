variable "name_prefix" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "vpc_cidr" {
  description = "Must be disjoint from the other environment's VPC CIDR (e.g. dev 10.0.0.0/16, prod 10.1.0.0/16)"
  type        = string
}
