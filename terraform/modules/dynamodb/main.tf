# Reference data: PIN codes, landmarks, administrative boundaries.
# PK groups by data type + region so a lookup ("PINCODE#500081",
# "LANDMARK#HYDERABAD#CHARMINAR") is a single-partition query, not a scan.
resource "aws_dynamodb_table" "reference_data" {
  name         = "${var.name_prefix}-reference-data"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = { Name = "${var.name_prefix}-reference-data" }
}

# Resolved-address cache: avoids re-running Bedrock/rules for repeat lookups
# of the same raw input. TTL evicts stale entries so cached resolutions get
# refreshed as reference data (landmarks, boundaries) improves over time.
resource "aws_dynamodb_table" "resolution_cache" {
  name         = "${var.name_prefix}-resolution-cache"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "input_hash"

  attribute {
    name = "input_hash"
    type = "S"
  }

  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }

  tags = { Name = "${var.name_prefix}-resolution-cache" }
}

# Human review tracking: one item per queued address, status transitions
# pending -> in_review -> resolved/rejected. GSI lets the review UI list by
# status without a full table scan.
resource "aws_dynamodb_table" "review_status" {
  name         = "${var.name_prefix}-review-status"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "review_id"

  attribute {
    name = "review_id"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "queued_at"
    type = "S"
  }

  global_secondary_index {
    name            = "status-queued_at-index"
    hash_key        = "status"
    range_key       = "queued_at"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = { Name = "${var.name_prefix}-review-status" }
}

# --- 10x-scale note ---
# PAY_PER_REQUEST comfortably absorbs spiky, unpredictable traffic without
# capacity planning. If reference_data or resolution_cache partitions get
# hot (e.g. one PIN code dominating traffic), the fix is better key design
# (add a sharding suffix to pk) before reaching for DynamoDB Accelerator
# (DAX) or ElastiCache in front of the cache table — don't add either
# pre-emptively.
