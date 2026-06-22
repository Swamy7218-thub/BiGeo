# Architecture

## Product
BiGeo resolves Indian village addresses that standard geocoding cannot
handle, using the Bharat Address Graph combined with Claude-based
disambiguation.

## Monorepo layout
- `apps/` — user-facing frontends (none yet)
- `services/` — backend services
  - `address-resolver` — Phase 1 seed service; stub resolver behind a
    Fastify HTTP API (`/health`, `/v1/resolve`)
- `agents/` — autonomous AI agents (none yet, Phase 2+)
- `packages/` — shared libraries (none yet)
- `infrastructure/terraform/` — IaC; currently a placeholder, no
  resources are deployed
- `docs/` — living documentation
- `scripts/`, `tests/`, `prompts/`, `memory/`, `workflows/` — reserved
  for later phases

## Current state (Phase 0)
- Monorepo scaffolding, pnpm workspaces, shared TypeScript config
- CI (GitHub Actions): lint, typecheck, test, build on every push/PR
- One seed service (`address-resolver`) with a stubbed resolver and
  tests, containerized but not deployed
- No AWS resources are provisioned yet

## Next (Phase 1)
Replace the stub resolver with a real Bharat Address Graph lookup plus
a Claude-based disambiguation step; deploy via ECS Fargate behind an
ALB; add RDS/DynamoDB for address data; wire Secrets Manager for API
keys.
