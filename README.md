# BiGeo
Most Indian village addresses cannot be found by any algorithm. BiGeo resolves them using the Bharat Address Graph and Claude AI.

## Monorepo

```
apps/            user-facing frontends
services/        backend services (seed: address-resolver)
agents/          autonomous AI agents
packages/        shared libraries
infrastructure/  IaC (Terraform)
docs/            living documentation
```

See [docs/Architecture.md](docs/Architecture.md) and [docs/Roadmap.md](docs/Roadmap.md).

## Development

```bash
pnpm install
pnpm run dev --filter @bigeo/address-resolver
pnpm run test
```

