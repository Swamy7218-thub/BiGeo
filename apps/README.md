# Phase 0–1 — Foundations + Matching MVP

Implements the first milestones of the AI Job Application Agent
(see `docs/ai-job-application-agent/ARCHITECTURE.md`):

**Phase 0**
- `infra/sql/001_init.sql` — Postgres + pgvector schema (users, fact_bank, jobs, applications, events)
- `apps/agents/resume/fact_bank.py` — parses a PDF/DOCX resume into atomic, section-tagged facts
- `apps/agents/sourcing/connectors.py` — public, ToS-compliant listing connectors for Greenhouse, Lever, Ashby
- `apps/agents/sourcing/run.py` — sourcing run loop: fetches configured targets (`sources.json`) and upserts into `jobs`
- `apps/api` — FastAPI service exposing `/jobs` and `/fact-bank/{user_id}`

**Phase 1**
- `infra/sql/002_preferences.sql` — `user_preferences` table (hard-filter config + score thresholds)
- `apps/agents/scoring/filters.py` — hard filters (visa, location, remote type, salary floor) applied before scoring
- `apps/agents/scoring/scorer.py` — weighted 0–100 fit score (skill match via embeddings, experience, comp, location, role type, visa, company signal)
- `apps/agents/scoring/embeddings.py` — pluggable embedding client (OpenAI or Gemini via `EMBEDDING_PROVIDER`)
- `apps/agents/scoring/run.py` — scoring run loop: pulls unscored jobs, applies filters + scorer, creates `applications` rows at `queued` / `pending_approval` / discards below threshold

**Phase 2**
- `apps/agents/common/llm.py` — shared Claude API client (Sonnet default, Opus for high-stakes calls)
- `apps/agents/resume/store.py` — loads/embeds fact_bank rows into retrievable `FactRecord`s
- `apps/agents/resume/tailor.py` — retrieves top-matching facts for a job, LLM composes a resume constrained to *only* those facts (each bullet traceable to a fact_id — the anti-hallucination guardrail)
- `apps/agents/resume/render.py` — renders the tailored resume into an ATS-safe `.docx` (single column, standard headers, no tables/graphics)
- `apps/agents/resume/ats_check.py` — round-trip parse self-check: re-parses the generated `.docx` and flags missing sections or parse failures before submission
- `apps/agents/cover_letter/generate.py` — template-constrained cover letter generation (hook → 2 achievement-to-requirement mappings → close), fact-bank-only
- `apps/agents/cover_letter/genericness_check.py` — flags a new letter as too templated if it's near-duplicate (cosine > 0.9) of a previous one

## Setup

```bash
createdb job_agent
psql job_agent -f infra/sql/001_init.sql
psql job_agent -f infra/sql/002_preferences.sql

cd apps/api
pip install -r requirements.txt
export DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/job_agent
export PYTHONPATH=$PYTHONPATH:../..
uvicorn app.main:app --reload
```

## Run the sourcing agent

Edit `apps/agents/sourcing/sources.json` with real company board slugs, then:

```bash
cd apps/agents/sourcing
PYTHONPATH=../../../apps/api:.. python run.py
```

## Parse a resume into the fact bank

```python
from apps.agents.resume.fact_bank import extract_facts
facts = extract_facts("resume.pdf")
```

## Run the scoring agent

Requires `OPENAI_API_KEY` (or `GOOGLE_API_KEY` with `EMBEDDING_PROVIDER=gemini`)
and a row in `user_preferences` for the target user (insert manually for now —
dashboard UI for preferences comes in a later phase).

```bash
cd apps/agents/scoring
PYTHONPATH=../../../apps/api:.. python run.py <user_id> <years_of_experience>
```

**Phase 3**
- `apps/agents/submission/ats_submitters.py` — Greenhouse/Lever/Ashby application-submission adapters using each platform's own documented API (employer-opt-in required); raises `NotSupportedError` when a posting doesn't support it
- `apps/agents/submission/run.py` — Submission Agent: only acts on applications already at status `queued` (the human-approval boundary). Falls back to `pending_approval` + manual `apply_url` note when API submission isn't available
- `apps/agents/submission/tracking.py` — classifies inbound status-update emails (rejected/interview/offer) and updates `applications.status`
- `apps/api/app/main.py` — added `GET /applications`, `POST /applications/{id}/approve`, `POST /applications/{id}/reject` — the manual-mode human gate

**Phase 4**
- `infra/sql/003_manual_sources.sql` — adds `manual` as a job source, plus `packet_only`/file-url columns on `applications`
- `apps/agents/packet/generate_packet.py` — "ready to apply" packet for LinkedIn/Indeed/Wellfound: you paste in a job's title/company/description/URL (discovery there stays manual since automated scraping/submission would violate their ToS), the agent generates the tailored resume + cover letter and an ATS self-check, and hands back the original `apply_url` as a one-click deep link. Submission is always a human click here -- never automated.
- `POST /packets` API endpoint wraps this flow

**Phase 5**
- `infra/sql/004_reporting.sql` — `daily_reports` + `lessons_learned` tables
- `apps/agents/reporting/daily_report.py`, `run.py` — builds the daily digest (applied/interviews/rejections/recommended-pending) and emails it via SES (falls back to stdout if `REPORTS_FROM_EMAIL` isn't set)
- `apps/agents/learning/learning_loop.py` — weekly statistical reweighting (not fine-tuning): correlates role-type with interview rate and writes short, auditable "lessons" that get fed into the Resume Agent's system prompt as soft guidance
- `GET /reports/{user_id}/latest`, `GET /lessons/{user_id}` API endpoints

## Generate a tailored resume + cover letter

Requires `ANTHROPIC_API_KEY` in addition to the embedding provider key.

```python
from app.db.session import SessionLocal
from agents.resume.store import load_facts
from agents.resume.tailor import tailor_resume
from agents.resume.render import render_docx
from agents.resume.ats_check import check_resume
from agents.cover_letter.generate import generate_cover_letter

db = SessionLocal()
facts = load_facts(db, user_id="<uuid>")

resume_text = tailor_resume(job_title, job_description, facts)
docx_path = render_docx(resume_text, "out/resume.docx")
check = check_resume(docx_path)  # check.passed must be True before submission

letter = generate_cover_letter(company, job_title, job_description, facts)
```

## Approve and submit

```bash
# human approves a pending_approval row (or auto mode already queued it)
curl -X POST localhost:8000/applications/<id>/approve

# Submission Agent picks up everything at status='queued'
cd apps/agents/submission
PYTHONPATH=../../../apps/api:.. python -c "
from agents.submission.run import run
from agents.submission.ats_submitters import SubmissionPayload
run(SubmissionPayload(first_name='Jane', last_name='Doe', email='jane@example.com',
    phone=None, resume_path='out/resume.docx', cover_letter_text=open('out/letter.txt').read()))
"
```

## Generate a packet for LinkedIn/Indeed/Wellfound

```bash
curl -X POST localhost:8000/packets -H "Content-Type: application/json" -d '{
  "user_id": "<uuid>",
  "company": "Acme Inc",
  "title": "Backend Engineer",
  "description": "...paste the job description here...",
  "apply_url": "https://www.linkedin.com/jobs/view/12345"
}'
```

## Daily report + learning loop

```bash
cd apps/agents/reporting
PYTHONPATH=../../../apps/api:.. python run.py <user_id> you@example.com
```

```python
from agents.learning.learning_loop import run_weekly, get_recent_lessons_context
from datetime import date, timedelta
run_weekly(db, user_id, week_start=date.today() - timedelta(days=7))

# fed into resume generation automatically:
lessons = get_recent_lessons_context(db, user_id)
resume_text = tailor_resume(job_title, job_description, facts, lessons_context=lessons)
```

**Dashboard**
- `apps/dashboard` — Next.js 16 app with three pages:
  - `/` — applications by status (pending approval / queued / submitted / interview / rejected), with one-click Approve/Skip on the pending-approval queue (the human gate from sections 0 and 4)
  - `/packets` — paste a LinkedIn/Indeed/Wellfound job's details, generate a packet, get a deep link to apply manually
  - `/reports` — today's digest (applied/interviews/rejections/awaiting approval) and the learning loop's weekly lessons

```bash
cd apps/dashboard
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_BASE_URL and NEXT_PUBLIC_DEFAULT_USER_ID
npm run dev
```

Not yet implemented (next phase): browser-automation fallback for Workday-style
company portals, and an auth/preferences UI (the dashboard currently assumes a
single hardcoded user id from env, matching the single-tenant MVP scope).

## Deployment (AWS, Terraform)

`infra/terraform/` provisions the AWS architecture from section 14 of the
architecture doc:

- `network.tf` — VPC, 2 public + 2 private subnets, single NAT gateway
- `security_groups.tf` — ALB (80/443 public) → ECS service (8000, ALB-only) → RDS (5432, ECS-only)
- `rds.tf` — Postgres 16, single-AZ, encrypted, credentials in Secrets Manager
- `s3.tf` — `documents` bucket (resumes/cover letters/packets), encrypted, blocked public access, lifecycle to Glacier after 1 year
- `ecr.tf` — one repository per service image (`api`, `sourcing-agent`, `scoring-agent`, `resume-agent`, `submission-agent`, `reporting-agent`)
- `iam.tf` — ECS task execution role (pull images, read secrets) and task role (least-privilege: S3 documents bucket, Secrets Manager, SES)
- `secrets.tf` — `app-api-keys` secret (Anthropic/OpenAI/Gemini/Greenhouse/Ashby) — values must be set out-of-band, never via `terraform apply`
- `alb.tf` — public ALB + target group for the API service (HTTP only until a domain + ACM cert are available)
- `ecs.tf` — Fargate cluster + the always-on `api` service behind the ALB
- `agents.tf` — Fargate task definitions for each batch agent, run on a schedule via EventBridge Scheduler (sourcing/scoring/resume every 6h, submission hourly, reporting daily at 13:00 UTC) instead of as long-running services, since they're short batch jobs
- `monitoring.tf` — SNS alert topic (emails `var.alert_email`), CloudWatch alarms (ALB 5xx, low RDS free storage), SES sender identity for `var.reports_from_email`
- `outputs.tf` — ALB DNS name, ECR repo URLs, DB endpoint, documents bucket name, secret ARNs

```bash
cd infra/terraform
terraform init
terraform plan -var="alert_email=you@example.com" -var="reports_from_email=reports@example.com"
terraform apply
```

After `apply`, push images to the printed ECR repo URLs, fill in the real
values in the `app-api-keys` secret via the AWS console/CLI (Terraform only
seeds placeholders and never overwrites them on subsequent applies), and
verify the SES sender address via the email AWS sends.
