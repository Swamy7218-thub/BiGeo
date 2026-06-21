-- Phase 0 schema: users, fact bank, jobs, applications
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    mode TEXT NOT NULL DEFAULT 'manual' CHECK (mode IN ('manual', 'auto')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version_label TEXT NOT NULL,
    file_url_pdf TEXT,
    file_url_docx TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fact_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('skill', 'experience', 'project', 'education', 'achievement')),
    text TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX fact_bank_user_idx ON fact_bank(user_id);

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL CHECK (source IN ('greenhouse', 'lever', 'ashby')),
    external_id TEXT NOT NULL,
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    location TEXT,
    remote_type TEXT,
    salary_min NUMERIC,
    salary_max NUMERIC,
    currency TEXT,
    visa_sponsorship BOOLEAN,
    description TEXT,
    apply_url TEXT,
    embedding vector(1536),
    discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    raw_json JSONB,
    UNIQUE (source, external_id)
);
CREATE INDEX jobs_company_idx ON jobs(company);

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id),
    cover_letter_text TEXT,
    score NUMERIC,
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'pending_approval', 'submitted', 'rejected', 'interview', 'offer', 'withdrawn')),
    submitted_at TIMESTAMPTZ,
    ats_application_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX applications_user_idx ON applications(user_id);
CREATE INDEX applications_job_idx ON applications(job_id);

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
