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

Not yet implemented (next phases): form-fill agent, dashboard UI, reporting,
tracking/learning loop.
