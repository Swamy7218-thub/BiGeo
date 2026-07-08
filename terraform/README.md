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

## First-time setup (run manually, once, with an authenticated AWS session)

```bash
cd terraform/bootstrap
terraform init
terraform apply \
  -var="state_bucket_name=bigeo-terraform-state-841162683979"
```

Then, for each environment:

```bash
cd terraform/envs/dev
terraform init
terraform apply
# copy the printed github_actions_role_arn
```

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
