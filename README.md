# FreightCheck

AI-native freight bill audit platform for Indian road transport. Reads freight
bills, rate contracts, and PODs the way a sharp clerk would — except it checks
every line, not just a sample. Full product context and roadmap: see the PRD
this build implements (Sections referenced throughout the code as `FR-#` /
`Section #`).

> This build implements the **MVP** scope from PRD Section 10 (bill upload,
> extraction, rate-contract upload, rate check + duplicate check) plus the
> detention and unknown-lane checks from V1, since the audit engine was
> cheap to extend once built and tested. Multi-user roles, POD upload/matching
> UI, Razorpay billing, the internal ops review queue, and email-in are **not**
> built yet — see "What's not built" below.

## Stack

- **App**: Next.js 16 (App Router, TypeScript, Tailwind) — `apps/web`
- **Database / Auth / Storage**: Supabase (Postgres + RLS, email-OTP auth, private storage bucket)
- **AI extraction**: Claude (`@anthropic-ai/sdk`), Messages API, strict JSON schema + Zod validation, retry-once-on-parse-failure
- **Audit engine**: plain deterministic TypeScript (no LLM) — `apps/web/src/lib/audit`
- **Tests**: Vitest, 34 tests covering the audit engine and its Section 28 edge cases
- **Export**: ExcelJS

## Repo layout

```
apps/web/                Next.js app
  src/app/(auth)/         signup, login, OTP verify
  src/app/(app)/          authenticated shell: dashboard, transporters, bills, reports
  src/app/api/            route handlers implementing the API spec (PRD Section 18)
  src/lib/audit/          rate/duplicate/detention/unknown-lane checks + orchestrator (pure, unit-tested)
  src/lib/ai/             Claude extraction (bills, rate contracts, PODs) + confidence scoring
  src/lib/supabase/       browser / server / admin Supabase clients, session middleware
supabase/migrations/      SQL migrations (schema, RLS policies, storage bucket) — already applied
```

## Live infrastructure

A Supabase project (`freightcheck`, `ap-south-1`, project ref `sddznzftkkxfvfhqrzyc`)
has already been provisioned and the migrations in `supabase/migrations/` applied,
including Row-Level Security scoped by `company_id` on every table and a private
`documents` storage bucket (path convention `{company_id}/{category}/{transporter_id}/...`).
Security and performance advisors were run and all findings resolved.

## Running locally

```bash
cd apps/web
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

### Environment variables

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API (`https://sddznzftkkxfvfhqrzyc.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API → anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API → service_role key (**server-only secret** — used solely to bootstrap a company+user row right after signup, before RLS has anything to scope against; never exposed to the browser) |
| `ANTHROPIC_API_KEY` | An Anthropic API key with access to Claude Sonnet, for bill/rate-contract extraction |

### Commands

```bash
npm run dev      # local dev server
npm run build    # production build (type-checks + builds)
npm run lint     # eslint
npm test         # vitest — audit engine unit tests
```

## What's built (MVP)

- **Auth & onboarding** (FR-1): email + OTP signup, company creation, session middleware.
- **Rate contracts** (FR-2, FR-3): upload PDF/Excel, Claude extracts lane rates / vehicle
  types / detention terms into a **draft** rate master, mandatory human review + confirm
  screen before it can price a single bill.
- **Transporters** (FR-4): CRUD, linked to rate contracts.
- **Bill ingestion** (FR-5, FR-6, FR-7): upload PDF/image/Excel, Claude extracts every
  trip line with a self-reported + arithmetic-reconciliation confidence score (the *lower*
  of the two is used, per PRD Section 15.1); low-confidence trip lines are marked
  `needs_review` and surfaced with a badge in the UI.
- **Audit engine** (FR-8–FR-11), fully deterministic, no LLM involved, 34 unit tests:
  - Rate check (₹1-or-1% tolerance, matches Section 41 acceptance criteria)
  - Duplicate check (scoped per transporter, with fuzzy date-shift tolerance — Section 28)
  - Detention/extras check (missing POD, detention-date mismatch, no detention terms in contract)
  - Unknown-lane check
  - Plus a `no_active_contract` flag and most-recent-`valid_from` resolution for overlapping
    rate contract validity windows (Section 28 edge cases)
- **Flag review** (FR-12): Accept / Waive / Dispute per flag, immediate recalculation of bill
  totals, full audit trail (FR-18) via an append-only `audit_log` table.
- **Dashboard** (FR-15): company totals + 6-month trend.
- **Excel export** (FR-17): per-bill and per-month.
- **Security**: TLS everywhere (platform-level), Postgres RLS on every table scoped by
  `company_id`, private storage bucket with matching object-path RLS, service-role key
  confined to one narrowly-scoped bootstrap route.

## What's not built yet (by design — see PRD Sections 10, 31)

- **Queue-based extraction worker.** PRD Section 14 specifies SQS + a separate Fargate
  worker so uploads don't block on a synchronous Claude call. This build runs extraction
  + audit **synchronously inside the upload request** — the correct architecture for an
  MVP demo, documented debt before real concurrent-upload volume (Section 31).
- POD upload & matching UI (V1, FR-13/FR-14) — the `pods` table and the detention check's
  POD lookup already exist and work correctly with zero PODs uploaded (everything correctly
  flags `missing_pod`); only the bulk-upload screen is missing.
- Multi-user roles/invites, Settings screens, Razorpay billing, email-in, internal ops
  review queue/admin panel (Section 8.7), Mixpanel instrumentation, AWS/Terraform infra,
  Hindi/Telugu OCR, WhatsApp submission, dispute automation, transporter scorecards.
- `rate_basis: per_km / per_ton` rate lines are extracted and stored, but the rate check
  only verifies `per_trip` lines automatically — `trip_lines` doesn't yet capture distance
  or tonnage, so per-km/per-ton bills are intentionally left unflagged rather than guessed
  at (see the comment in `src/lib/audit/rateCheck.ts`).
- PDF export (Excel only for now).
