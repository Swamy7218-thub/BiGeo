terraform {
  backend "s3" {
    bucket         = "bigeo-terraform-state-841162683979"
    key            = "envs/dev/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "bigeo-terraform-locks"
    encrypt        = true
  }
}
