"""Submission Agent.

Only acts on applications already in status 'queued' -- meaning they either
cleared the auto-queue score threshold (auto mode) or were explicitly
approved by the human via the dashboard/API (manual mode). This is the
human-gate boundary described in architecture doc sections 0 and 4: the
LangGraph-style interrupt is implemented here simply as "don't touch
anything that isn't 'queued'".

On NotSupportedError (the ATS doesn't accept programmatic submission for
this posting), the application is moved to 'pending_approval' with a note
pointing at apply_url so a human can submit manually in seconds.
"""

from __future__ import annotations

import json
import logging

from sqlalchemy import text

from app.db.session import SessionLocal
from agents.submission.ats_submitters import SUBMITTERS, NotSupportedError, SubmissionPayload

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("submission_agent")

QUEUED_APPLICATIONS_SQL = text(
    """
    SELECT a.id AS application_id, a.resume_id, a.cover_letter_text,
           j.source, j.external_id, j.company, j.apply_url,
           r.file_url_docx
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    LEFT JOIN resumes r ON r.id = a.resume_id
    WHERE a.status = 'queued'
    """
)

UPDATE_SUBMITTED_SQL = text(
    """
    UPDATE applications
    SET status = 'submitted', submitted_at = now(), ats_application_id = :ats_id
    WHERE id = :application_id
    """
)

UPDATE_NEEDS_MANUAL_SQL = text(
    """
    UPDATE applications
    SET status = 'pending_approval', notes = :notes
    WHERE id = :application_id
    """
)

INSERT_EVENT_SQL = text(
    "INSERT INTO events (application_id, type, payload) VALUES (:application_id, :type, :payload)"
)


def run(applicant: SubmissionPayload) -> dict:
    db = SessionLocal()
    stats = {"submitted": 0, "needs_manual": 0, "failed": 0}
    try:
        rows = db.execute(QUEUED_APPLICATIONS_SQL).fetchall()
        for row in rows:
            m = row._mapping
            submitter = SUBMITTERS.get(m["source"])

            if submitter is None:
                db.execute(
                    UPDATE_NEEDS_MANUAL_SQL,
                    {
                        "application_id": m["application_id"],
                        "notes": f"No API submitter for source={m['source']}; apply manually at {m['apply_url']}",
                    },
                )
                db.commit()
                stats["needs_manual"] += 1
                continue

            try:
                result = submitter(m["company"], m["external_id"], applicant)
            except NotSupportedError as exc:
                db.execute(
                    UPDATE_NEEDS_MANUAL_SQL,
                    {
                        "application_id": m["application_id"],
                        "notes": f"{exc}; apply manually at {m['apply_url']}",
                    },
                )
                db.commit()
                stats["needs_manual"] += 1
                logger.info("Needs manual submission: %s (%s)", m["company"], exc)
                continue
            except Exception as exc:  # noqa: BLE001 - log, mark failed, keep processing others
                logger.error("Submission failed for application %s: %s", m["application_id"], exc)
                stats["failed"] += 1
                db.execute(
                    INSERT_EVENT_SQL,
                    {
                        "application_id": m["application_id"],
                        "type": "submission_failed",
                        "payload": json.dumps({"error": str(exc)}),
                    },
                )
                db.commit()
                continue

            db.execute(
                UPDATE_SUBMITTED_SQL,
                {"application_id": m["application_id"], "ats_id": result.ats_application_id},
            )
            db.execute(
                INSERT_EVENT_SQL,
                {
                    "application_id": m["application_id"],
                    "type": "submitted",
                    "payload": json.dumps(result.raw_response),
                },
            )
            db.commit()
            stats["submitted"] += 1
            logger.info("Submitted application %s to %s", m["application_id"], m["company"])

        return stats
    finally:
        db.close()
