# Roadmap

## Phase 0 — Foundation (current)
- [x] Monorepo scaffolding
- [x] CI pipeline (lint/typecheck/test/build)
- [x] Seed `address-resolver` service with stubbed logic
- [ ] Terraform applied to a real AWS account (currently placeholder only)

## Phase 1 — Real address resolution
- [ ] Bharat Address Graph data model + storage
- [ ] Claude-based disambiguation in `resolveAddress`
- [ ] Deploy `address-resolver` to ECS Fargate
- [ ] Auth (Cognito) on the API

## Phase 2 — First AI agent
- [ ] One narrow logistics agent on Bedrock with task queue + memory

## Phase 3+ — Agent platform, engineering automation, executive agents
See Decision Log for sequencing rationale.
