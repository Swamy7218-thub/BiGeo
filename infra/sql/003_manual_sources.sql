-- Phase 4: allow jobs sourced by the user pasting a listing from a platform
-- that doesn't offer a compliant submission API (LinkedIn, Indeed, Wellfound).
-- These are 'packet' jobs: the agent prepares everything, the human clicks apply.

ALTER TABLE jobs DROP CONSTRAINT jobs_source_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_source_check
    CHECK (source IN ('greenhouse', 'lever', 'ashby', 'manual'));

ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS resume_file_url TEXT,
    ADD COLUMN IF NOT EXISTS cover_letter_file_url TEXT,
    ADD COLUMN IF NOT EXISTS packet_only BOOLEAN NOT NULL DEFAULT false;
