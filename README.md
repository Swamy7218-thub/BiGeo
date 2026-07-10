# BiGeo
Most Indian village addresses cannot be found by any algorithm. BiGeo resolves them using the Bharat Address Graph and Claude AI.

## Architecture

- `src/` — Python Lambda service that resolves an address, backed by:
  - `s3_client.py` — reads/writes the Bharat Address Graph dataset in S3
  - `dynamo_client.py` — caches resolved addresses in DynamoDB
  - `address_resolver.py` — resolves an address via Claude AI, using the cache
  - `handler.py` — Lambda entry point exposed as `POST /resolve`
- `infra/` — Terraform for the S3 bucket, DynamoDB table, Lambda function, and
  API Gateway (see `infra/README.md` for deploying and required secrets)
- `.github/workflows/` — CI (tests + `terraform validate`) and a deploy
  pipeline that ships the Lambda and applies Terraform on push to `main`

## Development

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
pytest
```

Set `ANTHROPIC_API_KEY`, `ADDRESS_GRAPH_BUCKET`, and `RESOLUTION_CACHE_TABLE`
to run the resolver against real AWS resources.
