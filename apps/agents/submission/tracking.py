"""Tracking Agent: classifies inbound application-status emails and updates
`applications.status` accordingly.

Email fetching (Gmail API) is intentionally not wired up here -- that
requires OAuth credentials specific to your account. This module takes
already-fetched email bodies so it can be tested independently and plugged
into a Gmail poller later.
"""

from __future__ import annotations

import json
import logging

from sqlalchemy import text

from agents.common.llm import complete

logger = logging.getLogger("tracking_agent")

CLASSIFY_SYSTEM_PROMPT = """Classify this job-application status email into exactly one of: \
rejected, interview, offer, no_change. Respond with only the single word."""

VALID_STATUSES = {"rejected", "interview", "offer"}

UPDATE_STATUS_SQL = text("UPDATE applications SET status = :status WHERE id = :application_id")
INSERT_EVENT_SQL = text(
    "INSERT INTO events (application_id, type, payload) VALUES (:application_id, 'status_email', :payload)"
)


def classify_email(email_body: str) -> str:
    result = complete(prompt=email_body, system=CLASSIFY_SYSTEM_PROMPT, max_tokens=10)
    return result.strip().lower()


def apply_status_update(db, application_id: str, email_body: str) -> str | None:
    status = classify_email(email_body)
    if status not in VALID_STATUSES:
        logger.info("No status change detected for application %s", application_id)
        return None

    db.execute(UPDATE_STATUS_SQL, {"status": status, "application_id": application_id})
    db.execute(
        INSERT_EVENT_SQL,
        {"application_id": application_id, "payload": json.dumps({"classified_status": status})},
    )
    db.commit()
    logger.info("Application %s -> %s", application_id, status)
    return status
