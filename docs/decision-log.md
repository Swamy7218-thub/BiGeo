# Decision Log

## 2026-06-22 — Scope Phase 0 to scaffolding + one seed service
Rather than building speculative multi-agent infrastructure with no
product behind it, Phase 0 establishes the monorepo, CI, and a single
seed service (`address-resolver`) that reflects BiGeo's actual product
(village address resolution). Executive/ops agents and the broader
agent framework are deferred until Phase 1-2 produce real usage data.

## 2026-06-22 — Stack choice: TypeScript/Node + pnpm workspaces
Chosen for first-class AWS SDK and Claude API support, fast iteration,
and a single language across services/agents/packages.
