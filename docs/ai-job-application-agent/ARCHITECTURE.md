# AI Job Application Agent — Engineering Blueprint

## 0. Feasibility verdict

Fully autonomous, no-human-in-the-loop, mass-scale job applications across LinkedIn, Indeed, Workday, etc. is **not buildable as specified**, for reasons that are policy/legal, not technical:

- **LinkedIn, Indeed, Wellfound, Workday ToS explicitly prohibit automated scraping and automated form submission.** Violating this risks permanent account bans and, in some jurisdictions, CFAA-style legal exposure (LinkedIn has sued scrapers — *hiQ v. LinkedIn* cuts both ways but enterprise ToS enforcement via account bans is routine and not litigated).
- **CAPTCHAs, device fingerprinting, and bot-detection (Cloudflare, PerimeterX, Akamai) are deliberately adversarial** to headless automation on these platforms. Defeating them on a major platform crosses from "automation" into "evasion," which this assistant won't help engineer.
- **ATS platforms (Greenhouse, Lever, Ashby, Workday) generally do *not* forbid automated submission via their own public APIs** — several expose application APIs explicitly for this purpose. This is the compliant path.
- Submitting "hundreds or thousands" of near-identical auto-generated applications also has a real **reputational/ethical cost**: it degrades recruiter trust and your own response rate, and several companies now explicitly auto-reject detected mass-applicants.

**What is realistically and compliantly buildable:** an agent that does steps 1–2, 4–9, 12–24 fully autonomously, and treats steps 3 and 10/11/15-16 as **"semi-autonomous with a human-confirmation gate"** rather than fully autonomous — the agent does 95% of the work (search via official/legal channels, score, draft, fill), and a human clicks "Submit" (or approves a batch submit) on platforms whose ToS forbid bot submission. On Greenhouse/Lever/Ashby (which support it), true end-to-end autonomous submission is fine.

This blueprint is designed around that compliant architecture: **maximize autonomy everywhere ToS and law allow it, insert a lightweight human-approval step everywhere they don't**, and make that gate as fast as a single click via a dashboard/Slack/email digest.

---

## 1. System Architecture

```
                         ┌─────────────────────────────────────────┐
                         │              Web Dashboard (Next.js)      │
                         │  Job feed · Approvals · Resume mgmt ·     │
                         │  Tracking · Daily report                  │
                         └───────────────┬───────────────────────────┘
                                          │ REST/GraphQL (tRPC)
                  ┌───────────────────────┴────────────────────────┐
                  │                  API Gateway (FastAPI)          │
                  └───────────────────────┬────────────────────────┘
                                          │
   ┌─────────────────────────────────────┼──────────────────────────────────────┐
   │                          Orchestrator (LangGraph / Temporal)                │
   │  Stateful multi-agent workflow, retries, human-in-loop pause/resume         │
   └──┬───────────┬───────────┬───────────┬───────────┬───────────┬─────────────┘
      │           │           │           │           │           │
 ┌────▼───┐  ┌────▼────┐ ┌────▼────┐ ┌────▼─────┐ ┌────▼────┐ ┌────▼─────┐
 │ Sourcing│  │ Matching│ │ Resume/ │ │ Form-Fill│ │ Tracking│ │ Reporting│
 │ Agent   │  │ & Scoring│ │ Cover  │ │ Agent    │ │ Agent   │ │ Agent    │
 │(ATS APIs│  │ Agent    │ │ Letter  │ │(Browser- │ │(DB sync)│ │(daily    │
 │+feeds)  │  │          │ │ Agent   │ │ Use, ATS │ │         │ │ digest)  │
 └────┬───┘  └────┬────┘ └────┬────┘ │ form APIs)│ └────┬────┘ └────┬─────┘
      │           │           │      └────┬─────┘      │           │
      └───────────┴───────────┴───────────┴─────────────┴───────────┘
                                          │
                  ┌───────────────────────┴────────────────────────┐
                  │   Shared Memory Layer: Postgres + pgvector       │
                  │   (jobs, applications, resumes, embeddings)      │
                  │   Redis (queues/cache) · S3/R2 (documents)       │
                  └──────────────────────────────────────────────────┘
```

### Agent responsibilities
| Agent | Job |
|---|---|
| **Sourcing Agent** | Pulls jobs from Greenhouse/Lever/Ashby/Workday public job-board APIs, RSS/JSON feeds, Indeed Publisher API (if approved), official LinkedIn Talent/Jobs APIs where available, YC Work at a Startup listing pages (public, scrape-tolerant), company career-page sitemaps. No login-walled scraping of LinkedIn. |
| **Matching/Scoring Agent** | Embeds job + resume, computes fit score 0–100, applies hard filters (visa, location, salary floor). |
| **Resume/Cover-Letter Agent** | RAG over your master resume + project/achievement bank, generates tailored resume (ATS-safe format) and cover letter per job. |
| **Form-Fill Agent** | Browser-automation (Playwright) for ATS-hosted forms (Greenhouse/Lever/Ashby/Workday) where ToS permits; uses official APIs first, browser automation as fallback only on compliant ATS domains. Detects CAPTCHA → pauses → notifies human. |
| **Tracking Agent** | Writes every action to Postgres; polls ATS status pages / parses confirmation emails (via Gmail API) for status changes. |
| **Reporting Agent** | Daily digest email/Slack: applied, scored-but-skipped, interviews, rejections. |

---

## 2. Tech Stack

- **Orchestration:** LangGraph (stateful agent graphs with human-in-the-loop interrupts) running on **Temporal** for durable execution, retries, and scheduling (critical for a system that runs continuously for months).
- **Backend:** Python 3.12, FastAPI, Pydantic v2.
- **Frontend:** Next.js 14 (App Router) + Tailwind + shadcn/ui, deployed on Vercel or AWS Amplify.
- **Browser automation:** Playwright (Python), run inside isolated containers (one per session) with `playwright-stealth` only to *avoid being misidentified as a bot during legitimate use* on ToS-compliant ATS domains — not for evading detection on platforms that forbid automation.
- **Database:** PostgreSQL (AWS RDS) + `pgvector` extension for embeddings.
- **Cache/Queue:** Redis (ElastiCache) + Celery/Temporal workers.
- **Object storage:** S3 (resumes, cover letters, screenshots, take-home artifacts).
- **Vector store:** pgvector (skip a separate vector DB — your scale doesn't need Pinecone).
- **CI/CD:** GitHub Actions (using your GitHub credits) → AWS ECS Fargate or EKS.
- **Observability:** AWS CloudWatch + Sentry.
- **Notifications:** SES (email), optional Slack webhook.

---

## 3. AI Models per Task

| Task | Model | Why |
|---|---|---|
| Resume/job semantic embeddings | `text-embedding-3-large` (OpenAI) or Gemini `text-embedding-004` | Cheap, fast, good for matching at scale |
| Job-fit scoring (0–100 + rationale) | Claude Sonnet 4.6 (via Claude API, you have credits-eligible access) or Gemini 2.5 Pro (Google AI Pro) | Strong structured reasoning, cites which resume lines matched |
| Resume rewriting / tailoring | Claude Sonnet 4.6 | Best at faithful, non-hallucinated rewriting from source facts |
| Cover letter generation | Claude Sonnet 4.6 | Tone control, avoids generic AI-sounding prose with good prompting |
| ATS keyword optimization | Sonnet 4.6 + deterministic keyword-extraction (spaCy/KeyBERT) | LLM for synthesis, classic NLP for verifiable keyword coverage |
| Application Q&A / short essays | Claude Sonnet 4.6, escalate to Opus 4.8 for high-stakes (referral-style) essays | Quality vs. cost tradeoff |
| Take-home assignment triage (not auto-submitting code blindly) | Opus 4.8, human review required before submission | Code correctness + judgment matters; never auto-submit a take-home without your review |
| Form-field classification (mapping resume fields → ATS form fields) | Small fine-tuned classifier or GPT-4o-mini / Haiku 4.5 (cheap, high volume) | Cost control — this runs per field, per form |
| Email parsing for status updates | Haiku 4.5 (cheap, high volume, classification task) | Status classification (rejected/interview/OA) doesn't need a big model |

**Use ChatGPT Go and Google AI Pro for your own ad-hoc review/chat use, not as the production API backbone** — those are consumer subscriptions without programmatic API access at scale for an autonomous backend. Production calls should go through the **Anthropic API** and/or **Google Gemini API** (pay-as-you-go, billed against AWS credits via marketplace where possible, or direct billing).

---

## 4. Multi-Agent Architecture (LangGraph graph)

```
START
  → SourcingNode (fan-out per ATS/source, parallel)
  → DedupeNode (hash on company+title+location)
  → ScoringNode (per job, parallel, batched)
  → [conditional] score < threshold → DISCARD (log only)
  → [conditional] score >= threshold →
        ResumeTailorNode → CoverLetterNode → ATSKeywordCheckNode
  → HumanGateNode (interrupt if mode=manual OR platform requires it)
  → FormFillNode
       → [CAPTCHA/anomaly detected] → PAUSE + NotifyHuman → WAIT for resume
       → [success] → TrackingNode
  → ReportingNode (aggregates daily)
END
```

LangGraph's `interrupt()` is used at `HumanGateNode` and on CAPTCHA detection — this is what makes "manual approval mode" and "auto mode" the *same graph*, just with the gate toggled by a user setting in the dashboard.

---

## 5. Memory System

Three layers:

1. **Long-term structured memory (Postgres):** every job seen, every application, every resume version, every interaction — full audit trail. This is the source of truth.
2. **Semantic memory (pgvector):** embeddings of (a) your resume content chunked by achievement/skill, (b) every job description seen, (c) past successful applications (got an interview) vs unsuccessful — used to *learn* which resume phrasing correlates with interview callbacks (requirement #21).
3. **Working memory (Redis):** per-run agent state, in-flight LangGraph checkpoints, rate-limit counters per ATS domain.

Learning loop (#21): weekly batch job computes correlation between (job category, resume version, keyword set) → (interview rate), feeds a short "lessons learned" summary into the system prompt of the Resume Agent — simple statistical reweighting, not full fine-tuning (avoids overfitting on small sample sizes).

---

## 6. Browser Automation Framework

- **Playwright** (not Selenium) — better modern site support, native async, built-in tracing for debugging failed fills.
- One **ephemeral container per application session** (AWS Fargate task or local Docker), destroyed after use — avoids session/cookie bleed and limits blast radius of a stuck/banned session.
- **CAPTCHA policy:** detect (via DOM selectors for hCaptcha/reCAPTCHA/Cloudflare Turnstile iframes) → **immediately pause and notify**, never solve/bypass programmatically. This is a hard line — CAPTCHA-solving services are designed for evasion and we won't integrate one.
- **Scope restriction at the code level:** the Form-Fill Agent's allowed domains are a config-driven allowlist of ATS vendor domains (`*.greenhouse.io`, `*.lever.co`, `jobs.ashbyhq.com`, `myworkdayjobs.com` company subdomains) plus any domain you've explicitly added after confirming its ToS permits automated submission. LinkedIn/Indeed/Wellfound are **excluded from the allowlist by design** — the Sourcing Agent may read their public job postings (where permitted, e.g. via official APIs or their own published RSS/feeds) but the Form-Fill Agent will never attempt to log in or submit there. For those platforms the dashboard instead generates a **"ready to apply" packet** (tailored resume + cover letter + suggested answers) and a one-click deep link for *you* to submit manually in ~10 seconds.

---

## 7. Resume Optimization Pipeline

1. Parse master resume (PDF/DOCX) → structured JSON (skills, roles, bullets, projects, education) using `pyresparser`/`unstructured` + LLM cleanup.
2. Maintain a **"fact bank"**: every bullet/achievement as an atomic, source-tagged fact — never invent new facts not in the bank (hard constraint in the system prompt) — this is your anti-hallucination guardrail (relevant to requirement #13's fabrication concern too).
3. For each job: extract required skills/keywords (KeyBERT + LLM) → retrieve top-matching facts from the fact bank via embedding similarity → LLM composes a tailored resume selecting/reordering/rephrasing only from retrieved facts.
4. ATS-safe rendering: single-column, standard section headers, no tables/text-boxes/graphics, exported as both `.docx` and `.pdf` (Jinja2 + python-docx template, not a design tool — Canva/visual exports are ATS-parsing-hostile, avoid them for the submitted resume).
5. Run output through an **ATS-parse simulator** (open-source `pyresparser` round-trip: re-parse the generated resume and diff against intended fields) to catch parsing failures before submission.
6. Version every output (`resume_v{n}_{company}_{role}.pdf`) and store in S3 with DB pointer.

---

## 8. Cover Letter Generation Pipeline

1. Retrieve: job description, company info (from ATS posting + optional company-page fetch), your fact bank, your stated tone preference.
2. Template-constrained generation (intro/hook → 2 relevant achievements mapped to job requirements → close) — constrains the LLM to a structure to avoid generic "I am excited to apply" filler.
3. Plagiarism/genericness check: embed against a corpus of your own previously generated letters; flag if cosine similarity > 0.9 (too templated) and regenerate with more job-specific detail.
4. Human-reviewable diff view in dashboard before first use of a new template style; after that, default-auto for low-risk applications.

---

## 9. Job Matching Algorithm

Score = weighted sum, each sub-score 0–100:

```
score = 0.30*skill_match + 0.20*experience_fit + 0.15*comp_fit
      + 0.10*location_fit + 0.10*role_type_fit + 0.10*visa_fit
      + 0.05*company_signal
```

- `skill_match`: cosine similarity (resume embedding vs JD embedding) blended with explicit required-skill overlap ratio.
- `experience_fit`: years-required vs your years, penalize both under- and over-qualification.
- `comp_fit`: parsed salary range (when published) vs your floor; 100 if unknown-but-startup-stage-acceptable.
- `visa_fit`: hard gate — if you require sponsorship and JD explicitly says "no sponsorship," score = 0 regardless of other factors.
- Hard filters applied *before* scoring (country allowlist, role-type allowlist) — anything failing a hard filter never reaches the LLM scorer, saving cost.
- Threshold: auto-queue ≥75, human-review queue 55–74, discard <55 (configurable in dashboard).

---

## 10. ATS Compatibility Strategy

| ATS | Strategy |
|---|---|
| Greenhouse | Public Job Board API for listings; "For Developers" Application API (where the employer enabled it) for submission — fully compliant programmatic path |
| Lever | Public Postings API for listings; Lever's hosted-apply form supports automation; some employers also expose direct application API |
| Ashby | Public job board JSON API for listings + job board apply endpoint |
| Workday | No public submission API generally — use Playwright on the employer's own `myworkdayjobs.com` career site (this is the employer's first-party site, not Workday's internal product login, so ToS exposure is materially different from LinkedIn) |
| LinkedIn / Indeed / Wellfound | **Sourcing only** via official APIs/feeds where available; **no automated submission** — generate the packet, human clicks submit |
| Google/Microsoft/Amazon Careers | Their own portals (often Workday/iCIMS under the hood) — same Workday-style Playwright approach on the company's own domain |

---

## 11. Database Schema (Postgres, simplified)

```sql
users(id, email, plan, mode_auto_or_manual, created_at)

resumes(id, user_id, version_label, source_fact_ids[], file_url_pdf, file_url_docx, created_at)

fact_bank(id, user_id, category, text, tags[], embedding vector(1536))

jobs(id, source, external_id, company, title, location, remote_type,
     salary_min, salary_max, currency, visa_sponsorship, description,
     embedding vector(1536), discovered_at, raw_json)

applications(id, user_id, job_id, resume_id, cover_letter_id,
     score, status enum('queued','pending_approval','submitted',
     'rejected','interview','offer','withdrawn'),
     submitted_at, ats_type, ats_application_id, notes)

cover_letters(id, application_id, text, file_url, created_at)

events(id, application_id, type, payload jsonb, created_at)  -- audit log

daily_reports(id, user_id, report_date, applied_count, interview_count,
     rejection_count, summary_text)
```

---

## 12. Authentication Flow

- **Dashboard auth:** NextAuth/Clerk with email+OTP or Google OAuth (your own login, single-tenant initially).
- **Per-platform credentials:** stored as AWS Secrets Manager entries (never in DB plaintext), one secret per ATS/account, decrypted only inside the ephemeral Playwright container at runtime, never logged.
- **2FA-protected accounts:** if an ATS account has 2FA, the Form-Fill Agent pauses and requests a one-time code via dashboard push notification (you approve in real time) rather than storing TOTP seeds — storing your own 2FA seed is a security anti-pattern even for your own automation.

---

## 13. Cost Estimation (monthly, at ~500 scored jobs/day, ~50 tailored applications/day)

| Item | Est. cost |
|---|---|
| LLM scoring (Sonnet, ~500 jobs/day, short context) | ~$150–250/mo |
| LLM resume+cover letter generation (50/day, longer context) | ~$300–500/mo |
| Embeddings (jobs+resumes) | ~$20/mo |
| AWS (RDS small, ECS Fargate workers, S3, SES, Secrets Manager) | ~$150–300/mo — covered by $10k AWS credits for 1–2 years |
| Browser automation compute (Fargate, ephemeral) | ~$50–150/mo depending on volume |
| **Total run-rate** | **~$700–1,200/mo**, fully covered by AWS credits + your existing Claude/Google subscriptions for ad-hoc dev work |

GitHub credits cover Actions CI minutes and GitHub Codespaces for dev; not a major recurring driver.

---

## 14. AWS Architecture

- **Compute:** ECS Fargate for API + worker services (no servers to patch); Fargate Spot for ephemeral browser-automation tasks.
- **DB:** RDS Postgres (Multi-AZ off initially, single-AZ to save credits; turn on Multi-AZ before scaling past prototype).
- **Cache:** ElastiCache Redis (or skip and use SQS + RDS at MVP scale to save cost).
- **Storage:** S3 (resumes/cover letters), with lifecycle policy to Glacier after 1 year.
- **Queue:** SQS for job-fan-out between Sourcing → Scoring stages; Temporal Cloud or self-hosted Temporal on Fargate for durable workflow orchestration.
- **Secrets:** Secrets Manager for ATS credentials and API keys.
- **Networking:** Single VPC, private subnets for workers/DB, public subnet + ALB only for the API/dashboard.
- **Email:** SES for daily reports; SES inbound (or Gmail API since you're a Google Workspace-ish user) to parse application-status emails.
- **IaC:** Terraform (or AWS CDK in TypeScript, pairs nicely with the Next.js dashboard team skillset).

---

## 15. GitHub Workflow

- Monorepo: `apps/dashboard` (Next.js), `apps/api` (FastAPI), `apps/agents` (LangGraph graphs), `infra/` (Terraform).
- Branch strategy: `main` protected, feature branches, PR review required, GitHub Actions runs lint+typecheck+unit tests+Playwright smoke tests on PR.
- `release` workflow on tag → builds Docker images → pushes to ECR → triggers ECS deploy.
- Use GitHub Environments for `staging`/`production` secrets separation.
- Dependabot enabled for the obvious supply-chain hygiene win.

---

## 16. Security Considerations

- Principle of least privilege: Form-Fill Agent containers get only the one ATS credential they need, scoped IAM role, no broad S3/DB access.
- All PII (resume contents, application history) encrypted at rest (RDS encryption, S3 SSE) and in transit (TLS everywhere).
- No credential ever enters an LLM prompt or log.
- Rate-limit and circuit-breaker per ATS domain to avoid behavior that looks like abuse even on compliant ATS endpoints (politeness delays, exponential backoff on errors, respect `robots.txt` and documented API rate limits).
- Audit log (`events` table) is append-only and is your evidence trail if any platform ever disputes your account's activity.
- Take-home assignment code: never auto-submit without your review — treat as a hard human-gate, since wrong/low-quality auto-submitted code is reputationally worse than a missed deadline.

---

## 17. Deployment Plan

1. **Local dev:** Docker Compose (Postgres+pgvector, Redis, FastAPI, Next.js) — develop and test Sourcing/Scoring/Resume agents entirely locally first against Greenhouse/Lever sandbox/public data.
2. **Staging on AWS:** small Fargate footprint, real ATS sandbox accounts (Greenhouse/Lever both offer test job boards) — validate full pipeline end-to-end safely before touching your real applications.
3. **Production:** promote via tagged release, start in **manual-approval mode** for first 2 weeks (every submission requires your click) to validate quality, then graduate categories (e.g., "Greenhouse + backend roles") to auto-mode once quality is proven.

---

## 18. Scaling Strategy

- Sourcing and Scoring are embarrassingly parallel — scale Fargate worker count horizontally with SQS queue depth as the autoscale metric.
- Cache job embeddings; don't re-embed unchanged JDs.
- Batch LLM scoring calls (process N jobs per API call where the model supports structured batch output) to cut cost.
- Move to Temporal Cloud if self-hosting orchestration becomes an operational burden at higher application volume.
- If expanding to multiple users later, add tenant_id everywhere now schema-wise (cheap to do at MVP, expensive to retrofit) even though you're building single-tenant.

---

## 19. Risks and Limitations

- **ToS/legal:** automated submission on LinkedIn/Indeed/Wellfound is against their terms; account bans are likely and (per their published policies) within their rights. This blueprint deliberately excludes that capability rather than building it and hoping not to get caught.
- **Quality vs. volume tension:** mass-applying with AI-generated content is increasingly detected by employer-side AI screeners and can backfire (auto-rejection, or a worse signal to recruiters who recognize templated language). The matching threshold and human-review queue exist specifically to keep volume from degrading quality.
- **Hallucination risk in resume/cover letter content:** mitigated by the fact-bank-only constraint (section 7.2) — but you must still spot-check periodically.
- **Take-home assignments:** flagged as **not appropriate for full automation** — these typically have their own honor-code/anti-AI clauses and reputational stakes; the agent assists/drafts, you submit.
- **References:** the agent may format a references document from references *you provide*, and may draft a template for you to send a request to a referee — it must never invent a name, title, or contact for a reference. This is a hard rule, not a feature flag.
- **CAPTCHA/2FA:** by design, not bypassed — these are intentional human checkpoints and are treated as escalation triggers, not obstacles to engineer around.
- **Workday automation on employer sites:** lower legal risk than LinkedIn but still subject to each employer's own career-site terms; recommend a spot-check of a sample of target employers' terms before turning on full auto-mode there.

---

## 20. Phased Roadmap

**Phase 0 (Week 1–2): Foundations**
Resume parser + fact bank, Postgres schema, basic dashboard skeleton, Greenhouse/Lever/Ashby listings ingestion.

**Phase 1 (Week 3–4): Matching MVP**
Embedding + scoring pipeline, hard filters, manual review queue UI. No submission yet.

**Phase 2 (Week 5–6): Generation pipeline**
Resume tailoring + cover letter generation + ATS-parse self-check. Output reviewable in dashboard.

**Phase 3 (Week 7–8): Compliant submission**
Greenhouse/Lever/Ashby API-based submission in manual-approval mode only. Tracking + status sync.

**Phase 4 (Week 9–10): LinkedIn/Indeed-compliant assist mode**
"Ready to apply" packet + deep link flow (no automated submission) for non-allowlisted platforms.

**Phase 5 (Week 11–12): Reporting + learning loop**
Daily digest, interview-rate feedback loop into resume agent, dashboard analytics.

**Phase 6 (ongoing): Workday/company-portal expansion**
Add Playwright flows per target employer career site, gated by per-employer ToS spot-check, still manual-approval-first for 2 weeks per new domain before allowing auto-mode.

---

## 21. Recommended Open-Source / APIs

- **Orchestration:** LangGraph, Temporal
- **Browser automation:** Playwright
- **Resume parsing:** `unstructured`, `pyresparser`, `python-docx`
- **Keyword extraction:** KeyBERT, spaCy
- **Vector search:** pgvector
- **Job listing APIs:** Greenhouse Job Board API, Lever Postings API, Ashby Job Board API, company Workday `myworkdayjobs.com` JSON endpoints (public, no-login listing pages)
- **Email parsing:** Gmail API
- **LLMs:** Anthropic Claude API (Sonnet 4.6 default, Opus 4.8 for high-stakes), Google Gemini API

---

## 22. Folder Structure

```
bigeo-job-agent/
├── apps/
│   ├── dashboard/            # Next.js frontend
│   ├── api/                  # FastAPI gateway
│   └── agents/
│       ├── sourcing/
│       ├── scoring/
│       ├── resume/
│       ├── cover_letter/
│       ├── form_fill/
│       ├── tracking/
│       └── reporting/
├── packages/
│   ├── shared_types/
│   └── prompts/
├── infra/
│   └── terraform/
├── scripts/
│   └── seed_fact_bank.py
└── docs/
    └── ai-job-application-agent/
        └── ARCHITECTURE.md   # this file
```

---

## 23. Step-by-Step Implementation Plan

1. Parse your resume into the fact bank; manually review for accuracy (zero tolerance for hallucinated facts downstream).
2. Stand up Postgres schema + dashboard skeleton (jobs list, empty states).
3. Build Sourcing Agent for Greenhouse/Lever/Ashby first (best API support, lowest compliance risk) — get real jobs flowing into `jobs` table.
4. Build Scoring Agent; tune weights against ~50 jobs you'd manually rate, to calibrate thresholds before trusting it.
5. Build Resume/Cover-Letter agents; manually review first 20 outputs before trusting auto-generation.
6. Build Form-Fill Agent against Greenhouse/Lever sandbox boards; add CAPTCHA-detection pause logic and verify it actually halts correctly.
7. Run two weeks in manual-approval mode on real applications; track interview-rate signal.
8. Add LinkedIn/Indeed/Wellfound "packet generator + deep link" flow (no submission automation).
9. Add daily reporting + learning loop.
10. Expand to Workday/company portals one employer at a time, manual-approval-first.
11. Only after sustained quality validation, flip qualifying categories to auto-mode.
