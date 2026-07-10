resource "aws_dynamodb_table" "resolution_cache" {
  name         = "bigeo-resolution-cache-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "address"

  attribute {
    name = "address"
    type = "S"
  }

  tags = {
    Project     = "BiGeo"
    Environment = var.environment
  }
}
