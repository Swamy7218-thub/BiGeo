resource "aws_s3_bucket" "address_graph" {
  bucket = var.address_graph_bucket_name

  tags = {
    Project     = "BiGeo"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "address_graph" {
  bucket = aws_s3_bucket.address_graph.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "address_graph" {
  bucket = aws_s3_bucket.address_graph.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
