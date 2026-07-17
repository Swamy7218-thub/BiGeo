# FreightCheck

AI-Native Freight Bill Audit Platform for Indian Road Transport.

## Architecture

```
freightcheck/
├── apps/
│   ├── web/          # Next.js 14 frontend (App Router)
│   └── worker/       # AWS Lambda (SQS consumer) — audit engine
├── packages/
│   └── shared/       # TypeScript types shared across apps
├── supabase/
│   ├── schema.sql    # Postgres schema with RLS
│   └── seed.sql      # Demo data
└── infra/
    └── terraform/    # AWS infra (S3, SQS, Lambda)
```

## How It Works

1. **Upload** — Ops team uploads freight bill (PDF/image) via web app
2. **Extract** — Worker Lambda pulls file from S3, sends to Claude API for extraction
3. **Audit** — 4 deterministic checks run against contract rates:
   - Rate mismatch (vs active rate contract)
   - Duplicate LR detection (fuzzy date ±1 day)
   - Invalid detention (no POD / exceeds free-day window)
   - Unknown lane (not in any active contract)
4. **Review** — Finance reviews flags, accepts/rejects each one
5. **Approve** — Approved trip lines flow to payment

## Local Development

```bash
# Install dependencies
cd freightcheck && npm install

# Set up environment
cp .env.example .env.local

# Run web app
npm run dev --filter=web

# Run worker (needs SQS)
npm run dev --filter=worker
```

## Stack

- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Supabase SSR
- **Backend:** AWS Lambda (Node.js 22), SQS trigger
- **Database:** Supabase Postgres with Row-Level Security
- **Storage:** AWS S3 (bill documents)
- **AI:** Anthropic Claude (extraction only; audit is deterministic)
- **Infra:** Terraform (AWS)

## Key Design Decisions

- **AI for extraction only** — All flagging logic is deterministic. No hallucinated flags.
- **Confidence routing** — Extractions below 75% confidence or failing arithmetic check go to human review queue, not the audit engine.
- **Tenant isolation at DB level** — RLS policies on all tables enforce `current_company_id()` as a backstop.
- **Idempotent Lambda** — SQS + DLQ with `maxReceiveCount=3`. Failed bills land in DLQ for manual inspection.
