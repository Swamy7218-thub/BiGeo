-- Phase 5: daily reports + lessons-learned memory for the learning loop
CREATE TABLE daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    applied_count INT NOT NULL DEFAULT 0,
    interview_count INT NOT NULL DEFAULT 0,
    rejection_count INT NOT NULL DEFAULT 0,
    pending_approval_count INT NOT NULL DEFAULT 0,
    summary_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, report_date)
);

-- Weekly statistical reweighting notes fed into the Resume Agent's system
-- prompt context (architecture doc section 5: "simple statistical
-- reweighting, not full fine-tuning").
CREATE TABLE lessons_learned (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    insight_text TEXT NOT NULL,
    sample_size INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, week_start)
);
