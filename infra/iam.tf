data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "resolver_lambda" {
  name               = "bigeo-address-resolver-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.resolver_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "resolver_permissions" {
  statement {
    sid       = "ReadWriteAddressGraph"
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = ["${aws_s3_bucket.address_graph.arn}/*"]
  }

  statement {
    sid       = "ReadWriteResolutionCache"
    actions   = ["dynamodb:GetItem", "dynamodb:PutItem"]
    resources = [aws_dynamodb_table.resolution_cache.arn]
  }
}

resource "aws_iam_role_policy" "resolver_permissions" {
  name   = "bigeo-address-resolver-permissions"
  role   = aws_iam_role.resolver_lambda.id
  policy = data.aws_iam_policy_document.resolver_permissions.json
}
