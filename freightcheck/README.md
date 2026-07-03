# FreightCheck

AI freight bill audit for mid-market Indian road transport shippers.

*Email us your transporter bills. We find the money you're overpaying.*

## Why this exists

Mid-size Indian manufacturers and distributors (₹2–50 crore/year road freight
spend) check transporter bills manually against rate contracts, in Excel and
WhatsApp, under month-end pressure. Industry data says that recovers 20–40%
of what a full audit would catch — the rest, 2–6% of freight spend, leaks out
as duplicate bills, wrong lane rates, and unsupported detention claims.

FreightCheck reads scanned bills, handwritten LRs, and unstructured rate
contracts natively with Claude, and runs three checks against every trip:
rate mismatch, duplicate billing (exact and fuzzy), and unsupported
detention/POD claims.

## Status

MVP scaffold — the 5 features from the build plan, single-tenant (one
deployment per customer, no auth yet), no real transporter documents tested
against it yet. See "Before you trust this" below.

1. ✅ Rate contract upload → AI-parsed rate master → human confirms once (`/dashboard/contracts`)
2. ✅ Bill upload (PDF/image/Excel) → AI-extracted trip lines (`/dashboard`)
3. ✅ Audit engine: rate mismatch, duplicates, detention validity, missing POD (`lib/audit/engine.ts`)
4. ✅ Audit report dashboard + Excel export (`/dashboard/bills/[id]`, `/api/bills/[id]/export`)
5. ✅ POD bulk upload matched by LR number (`/dashboard/bills/[id]`)

No tracking, no booking, no payments, no transporter login — by design.

## Before you trust this

Every extraction prompt and audit rule here was written against **synthetic**
sample documents (`samples/*.txt`), not real transporter bills. Per the
original build plan: *do not write code before you have real documents* —
this scaffold exists so that the moment you have 3 real bills and a real rate
contract from someone in your network, you drop them in and find out where
reality breaks the assumptions below, rather than starting from zero.

Known simplifications to revisit against real data:
- Rate mismatch checking only works for `per_trip` contracts. `per_km` and
  `per_ton` lanes are matched (so they don't fire false `unknown_lane`
  flags) but not amount-checked, because trip lines don't capture distance
  or tonnage yet.
- Duplicate detection is exact LR match + a (vehicle, date, destination)
  fingerprint. Real transporters may have messier patterns worth adding.
- Detention validity is a blunt heuristic (no contract clause, or no POD on
  file, ⇒ flagged) — there's no attempt to model actual wait-day math.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in ANTHROPIC_API_KEY, Supabase keys
```

1. Create a Supabase project, then run `supabase/migrations/0001_init.sql`
   against it (SQL editor, or `supabase db push` if using the CLI).
2. Create a **private** Storage bucket named `documents` in that project.
3. Get an Anthropic API key from https://console.anthropic.com/.
4. `npm run dev` → http://localhost:3000

## Testing the extraction pipeline against samples

Before wiring in real bills, sanity-check that extraction reads the sample
documents correctly (Day 1-2 of the build plan):

```bash
npm run test:extraction
```

This calls Claude directly (no Supabase needed) against
`samples/rate-contract-abc-transport.txt` and two synthetic bills, then runs
the audit engine and prints what it expects to find: a rate mismatch, an
exact duplicate LR, a fuzzy duplicate (same vehicle/date/destination
re-billed under a new LR), and an unknown-lane flag. Swap in real documents
here first.

## Architecture

```
app/
  page.tsx                    landing page
  dashboard/                  bills list, rate contracts, bill detail (server components)
  api/
    rate-contracts/           upload + parse, list, confirm rate master
    bills/                    upload + extract + audit, list, detail, POD upload, Excel export
lib/
  anthropic.ts                Claude client + document content blocks (PDF/image/text)
  extraction/                 bill.ts, rateContract.ts — forced tool-use extraction + zod schemas
  audit/                      engine.ts — pure functions, no DB dependency, unit-testable
  db/                         Supabase queries (companies, transporters, bills, storage)
  supabase/server.ts          service-role client (single-tenant MVP, see migration notes)
supabase/migrations/0001_init.sql
samples/                      synthetic test fixtures (see caveats above)
scripts/test-extraction.ts    extraction + audit dry run against samples
```

One repo, one engineer, no microservices — per the build plan.

## Next up (not built yet)

- Auth / multi-tenant company scoping (currently one auto-created "Default
  Company" per deployment — see `supabase/migrations/0001_init.sql` RLS notes)
- Real-document validation pass once you have 3 bills + 1 rate contract from
  your network
- Email-in flow (Resend/SendGrid) so customers can just email bills instead
  of using the dashboard
- Razorpay billing
