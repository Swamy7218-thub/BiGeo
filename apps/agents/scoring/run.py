"""Scoring Agent entry point.

For a given user: load preferences + resume embedding, pull jobs that don't
yet have an application record, apply hard filters, score the survivors,
and create `applications` rows at status:
  - 'queued'           if score >= auto_queue_threshold
  - 'pending_approval' if score is in the review band
  - (discarded, no row) if below the review threshold or failing a hard filter
"""

from __future__ import annotations

import json
import logging

from sqlalchemy import text

from app.db.session import SessionLocal
from agents.scoring.embeddings import embed_texts
from agents.scoring.filters import Job, Preferences, passes_hard_filters
from agents.scoring.scorer import score_job

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("scoring_agent")

UNSCORED_JOBS_SQL = text(
    """
    SELECT j.* FROM jobs j
    LEFT JOIN applications a ON a.job_id = j.id AND a.user_id = :user_id
    WHERE a.id IS NULL
    """
)

PREFS_SQL = text("SELECT * FROM user_preferences WHERE user_id = :user_id")

INSERT_APPLICATION_SQL = text(
    """
    INSERT INTO applications (user_id, job_id, score, status, score_breakdown)
    VALUES (:user_id, :job_id, :score, :status, :score_breakdown)
    """
)


def _load_preferences(db, user_id: str) -> tuple[Preferences, float, float]:
    row = db.execute(PREFS_SQL, {"user_id": user_id}).first()
    if row is None:
        prefs = Preferences(
            countries=[], role_types=[], remote_types=[], min_salary=None,
            requires_visa_sponsorship=False, min_years_experience=0,
            max_years_experience=None,
        )
        return prefs, 75.0, 55.0

    m = row._mapping
    prefs = Preferences(
        countries=m["countries"] or [],
        role_types=m["role_types"] or [],
        remote_types=m["remote_types"] or [],
        min_salary=m["min_salary"],
        requires_visa_sponsorship=m["requires_visa_sponsorship"],
        min_years_experience=m["min_years_experience"] or 0,
        max_years_experience=m["max_years_experience"],
    )
    return prefs, m["score_auto_queue_threshold"], m["score_review_threshold"]


def run(user_id: str, resume_summary_text: str, years_have: float) -> dict:
    db = SessionLocal()
    stats = {"discarded_filter": 0, "discarded_score": 0, "queued": 0, "pending_approval": 0}
    try:
        prefs, auto_threshold, review_threshold = _load_preferences(db, user_id)
        resume_embedding = embed_texts([resume_summary_text])[0]

        rows = db.execute(UNSCORED_JOBS_SQL, {"user_id": user_id}).fetchall()
        for row in rows:
            m = row._mapping
            filter_job = Job(
                title=m["title"], location=m["location"], remote_type=m["remote_type"],
                salary_min=m["salary_min"], salary_max=m["salary_max"],
                visa_sponsorship=m["visa_sponsorship"], description=m["description"],
            )
            ok, reason = passes_hard_filters(filter_job, prefs)
            if not ok:
                stats["discarded_filter"] += 1
                logger.info("Discarded %s (%s): %s", m["title"], m["company"], reason)
                continue

            job_text = f"{m['title']}\n{m['description'] or ''}"
            job_embedding = embed_texts([job_text])[0]

            result = score_job(
                job=Job(
                    title=m["title"], location=m["location"], remote_type=m["remote_type"],
                    salary_min=m["salary_min"], salary_max=m["salary_max"],
                    visa_sponsorship=m["visa_sponsorship"], description=m["description"],
                ),
                prefs=prefs,
                resume_embedding=resume_embedding,
                job_embedding=job_embedding,
                years_required=None,
                years_have=years_have,
            )

            if result.total >= auto_threshold:
                status = "queued"
                stats["queued"] += 1
            elif result.total >= review_threshold:
                status = "pending_approval"
                stats["pending_approval"] += 1
            else:
                stats["discarded_score"] += 1
                continue

            db.execute(
                INSERT_APPLICATION_SQL,
                {
                    "user_id": user_id,
                    "job_id": m["id"],
                    "score": result.total,
                    "status": status,
                    "score_breakdown": json.dumps(result.breakdown),
                },
            )
            db.commit()

        return stats
    finally:
        db.close()


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("Usage: python run.py <user_id> <years_experience>")
        raise SystemExit(1)

    user_id_arg = sys.argv[1]
    years_arg = float(sys.argv[2])
    summary = "Software engineer with experience across backend systems, APIs, and cloud infra."
    result_stats = run(user_id_arg, summary, years_arg)
    logger.info("Scoring run complete: %s", result_stats)
