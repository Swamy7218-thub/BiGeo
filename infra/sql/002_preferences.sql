-- Phase 1: user preferences for hard filters used by the Scoring Agent
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    countries TEXT[] NOT NULL DEFAULT '{}',         -- allowlist, empty = no restriction
    role_types TEXT[] NOT NULL DEFAULT '{}',        -- e.g. {'backend','ai','product'}, empty = no restriction
    remote_types TEXT[] NOT NULL DEFAULT '{}',      -- e.g. {'remote','hybrid'}, empty = no restriction
    min_salary NUMERIC,
    requires_visa_sponsorship BOOLEAN NOT NULL DEFAULT false,
    min_years_experience NUMERIC NOT NULL DEFAULT 0,
    max_years_experience NUMERIC,
    score_auto_queue_threshold NUMERIC NOT NULL DEFAULT 75,
    score_review_threshold NUMERIC NOT NULL DEFAULT 55,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS score_breakdown JSONB;
