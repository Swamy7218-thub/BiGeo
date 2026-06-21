# Phase 0 — Foundations

Implements the first milestone of the AI Job Application Agent
(see `docs/ai-job-application-agent/ARCHITECTURE.md`):

- `infra/sql/001_init.sql` — Postgres + pgvector schema (users, fact_bank, jobs, applications, events)
- `apps/agents/resume/fact_bank.py` — parses a PDF/DOCX resume into atomic, section-tagged facts
- `apps/agents/sourcing/connectors.py` — public, ToS-compliant listing connectors for Greenhouse, Lever, Ashby
- `apps/agents/sourcing/run.py` — sourcing run loop: fetches configured targets (`sources.json`) and upserts into `jobs`
- `apps/api` — FastAPI service exposing `/jobs` and `/fact-bank/{user_id}`

## Setup

```bash
createdb job_agent
psql job_agent -f infra/sql/001_init.sql

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

Not yet implemented (next phases): scoring/matching, resume tailoring generation,
cover letters, form-fill, dashboard UI, reporting.
