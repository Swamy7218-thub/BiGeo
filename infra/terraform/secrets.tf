resource "aws_secretsmanager_secret" "app_api_keys" {
  name = "${var.project_name}-${var.environment}-app-api-keys"
}

# Placeholder values -- populated out-of-band (AWS console/CLI) so real keys
# never live in Terraform state or version control.
resource "aws_secretsmanager_secret_version" "app_api_keys" {
  secret_id = aws_secretsmanager_secret.app_api_keys.id
  secret_string = jsonencode({
    ANTHROPIC_API_KEY  = "REPLACE_ME"
    OPENAI_API_KEY     = "REPLACE_ME"
    GEMINI_API_KEY     = "REPLACE_ME"
    GREENHOUSE_API_KEY = "REPLACE_ME"
    ASHBY_API_KEY      = "REPLACE_ME"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
