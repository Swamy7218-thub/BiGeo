# BiGeo Terraform

## Layout

- `bootstrap/` — one-time, account-level setup: the S3 state bucket, the
  DynamoDB lock table, and the GitHub OIDC provider. Uses local state
  (nothing else exists yet for it to depend on). Run once per AWS account,
  then leave alone.
- `modules/` — reusable components. `github-oidc` creates a per-environment
  IAM role that GitHub Actions assumes via OIDC (no long-lived AWS keys in
  CI).
- `envs/dev/`, `envs/prod/` — environment-specific root configs, each with
  its own S3 backend key and state.

## Bharat Address Graph — architecture

The address-resolution API is built from these modules, all wired together
in `envs/dev/main.tf` and `envs/prod/main.tf`:

- **`vpc`** — per-environment VPC (disjoint `/16` CIDRs: dev `10.0.0.0/16`,
  prod `10.1.0.0/16`), public/private subnets across 2 AZs, S3 + DynamoDB
  gateway VPC endpoints (free). **Not currently attached to any Lambda** —
  see "Design decision: Lambdas run outside the VPC" below. Kept as
  groundwork for when a future component (Neptune, RDS, ElastiCache) needs
  one.
- **`dynamodb`** — three tables: `reference-data` (PIN codes, landmarks,
  admin boundaries), `resolution-cache` (TTL'd cache of prior resolutions),
  `review-status` (human review tracking, with a GSI on status).
- **`sqs`** — `review-queue` + its DLQ, for addresses that fall below the
  confidence bar.
- **`lambda-function`** — reusable module (IAM role, log group, X-Ray,
  3 CloudWatch alarms: errors/duration-p99/throttles) instantiated three
  times: `resolver` (the resolution logic), `review-intake` (SQS-triggered,
  persists to `review-status`), `auth0-authorizer` (API Gateway TOKEN
  authorizer validating Auth0 JWTs).
- **`api-gateway`** — one REST API, three entry points:
  - `POST /internal/resolve` — `AWS_IAM` (SigV4), for BiGeo's own services.
  - `POST /external/resolve` — API key + usage plan (`basic`/`premium`
    throttle+quota tiers), for key-based external callers.
  - `POST /external/oauth/resolve` — Auth0 OAuth 2.0 bearer token via the
    `auth0-authorizer` Lambda.

  All three proxy to the same `resolver` Lambda. Per-customer API keys are
  issued operationally (`aws_api_gateway_api_key` + `usage_plan_key` at
  signup time) rather than declared statically here.
- **`budget`** — AWS Budget (80% actual + 100% forecasted threshold) and
  Cost Anomaly Detection, both notifying an SNS topic with an email
  subscription.

### Resolution flow (`lambda/resolver/handler.py`)

1. Hash the raw input, check `resolution-cache` — cache hit returns
   immediately, no Bedrock cost.
2. Try a deterministic rules/reference-data lookup (exact PIN code +
   landmark string match) — instant, free, tried before any model call.
3. Otherwise call Bedrock: structured, PIN-anchored input goes to Haiku
   (fast, cheap); free text or ambiguous input goes straight to Sonnet. If
   Haiku's confidence is below the resolved threshold, escalate once to
   Sonnet; if Sonnet is still very low-confidence, escalate once more to
   Opus. Confirm the exact current Bedrock global inference profile IDs
   with `aws bedrock list-inference-profiles --region ap-south-1` — the
   ones in `lambda/resolver/handler.py` are defaults, not guaranteed
   current.
4. Confidence at or above threshold (default 0.75) → `status: resolved`,
   written to cache. Below threshold → enqueued to `review-queue` and
   returned as `status: pending-review` with a `review_id`. The handler
   never fails silently and never returns `unresolvable` itself — that
   status is only ever set by the (separate, not-yet-built) human review
   workflow once a person confirms an address truly can't be resolved.

### Design decision: Lambdas run outside the VPC

The spec called for VPC endpoints on S3/DynamoDB to avoid NAT Gateway
costs, which the `vpc` module provides. But the resolver Lambda also needs
to reach Bedrock and SQS, neither of which has a *gateway* endpoint — only
paid *interface* endpoints (~$7-15/month per AZ each). Putting the Lambdas
in private subnets would mean either paying for interface endpoints across
Bedrock + SQS + CloudWatch Logs + X-Ray (VPC-attached Lambdas lose direct
access to all of these), or a NAT Gateway — both cost more than the
alternative: Lambdas without VPC config reach every one of these AWS APIs
over the public endpoint (still TLS, still IAM-authenticated) for free.
For a bootstrapped stage with no VPC-only dependency yet (no RDS, no
ElastiCache, no Neptune), that's the cheaper and simpler default. Revisit
once a genuinely VPC-bound resource shows up.

## First-time setup (run manually, once, with an authenticated AWS session)

```bash
cd terraform/bootstrap
terraform init
terraform apply \
  -var="state_bucket_name=bigeo-terraform-state-841162683979"
```

Then, for each environment (required variables have no default — pass them
via `-var` or a `terraform.tfvars` file that is **never committed**, per
`.gitignore`):

```bash
cd terraform/envs/dev
terraform init
terraform apply \
  -var="alert_email=you@bigeo.in" \
  -var="auth0_domain=bigeo-dev.us.auth0.com" \
  -var="auth0_audience=https://api.bigeo.in"
# copy the printed github_actions_role_arn and api_invoke_url
```

The `auth0-authorizer` Lambda depends on `pyjwt[crypto]`
(`lambda/auth0-authorizer/requirements.txt`), which isn't in the base
Python 3.13 Lambda runtime. Package it as a Lambda layer before the first
apply, e.g.:

```bash
cd lambda/auth0-authorizer
pip install -r requirements.txt -t layer/python
cd layer && zip -r ../auth0-authorizer-layer.zip python
```

publish it (`aws lambda publish-layer-version ...`), and pass its ARN to
the `auth0_authorizer_layer_arns` variable on `terraform apply`.

Add the printed role ARNs as repo secrets so CI can assume them:

- `AWS_DEV_ROLE_ARN`
- `AWS_PROD_ROLE_ARN`

Also create two [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
named `dev` and `prod` in repo settings — the IAM trust policy is scoped to
these by name, and `prod` should have required-reviewer protection rules
turned on before anything deploys there automatically.

## Conventions

- All resources are tagged `Project=bigeo`, `Environment=<dev|prod>`,
  `ManagedBy=terraform`.
- Secrets belong in AWS Secrets Manager at `/bigeo/{github|aws|terraform}/<name>`,
  never in `.tfvars` or committed files.
- Dev and prod use disjoint VPC CIDRs in the same AWS account (no
  cross-account split yet).

## Scale evolution points (not built now — deliberately deferred)

- **Lambda → Fargate/ECS**: if sustained (not spiky) throughput makes
  per-invocation Lambda pricing worse than always-on containers, or if a
  single resolution needs more than 15 minutes / 10GB memory. Not
  justified at launch traffic.
- **DynamoDB hot partitions → sharded keys or DAX**: if one `pk` (a
  dominant PIN code or landmark) gets disproportionate traffic. Fix key
  design (add a random/hashed suffix and fan-out reads) before reaching
  for DAX or ElastiCache in front of `resolution-cache`.
- **`provisioned_concurrency` on the resolver Lambda**: currently 0
  (on-demand) in both envs. Only set > 0 for a premium SLA tier once real
  p99 latency data shows cold starts are the bottleneck.
- **VPC-attach the Lambdas**: once a genuinely VPC-bound datastore
  (Neptune for graph queries at scale, RDS, ElastiCache) enters the
  architecture, the `vpc` module is already there — add interface VPC
  endpoints for the specific services needed at that point (Bedrock, SQS,
  logs, X-Ray) rather than defaulting to NAT Gateway.
- **Self-serve API key issuance**: right now, external API keys are
  created manually per customer. A signup Lambda + API (or a thin admin
  UI) that calls `create_api_key`/`create_usage_plan_key` is the natural
  next step once there are enough external customers to make manual
  issuance a bottleneck.
- **Human review UI**: `review-intake` only persists to `review-status`
  today. The actual review interface (list pending items, submit
  corrections, feed confirmed resolutions back into `reference-data`) is
  a separate, not-yet-built application.
