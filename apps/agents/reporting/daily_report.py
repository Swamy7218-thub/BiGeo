"""Reporting Agent: builds the daily digest described in architecture doc
section 1 #20 -- jobs applied, interviews received, rejections, and
recommended opportunities sitting in the review queue.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date

from sqlalchemy import text

COUNTS_SQL = text(
    """
    SELECT
        COUNT(*) FILTER (WHERE status = 'submitted' AND submitted_at::date = :report_date) AS applied_count,
        COUNT(*) FILTER (WHERE status = 'interview') AS interview_count,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejection_count,
        COUNT(*) FILTER (WHERE status = 'pending_approval') AS pending_approval_count
    FROM applications WHERE user_id = :user_id
    """
)

RECOMMENDED_SQL = text(
    """
    SELECT j.company, j.title, a.score
    FROM applications a JOIN jobs j ON j.id = a.job_id
    WHERE a.user_id = :user_id AND a.status = 'pending_approval'
    ORDER BY a.score DESC LIMIT 10
    """
)

UPSERT_REPORT_SQL = text(
    """
    INSERT INTO daily_reports (user_id, report_date, applied_count, interview_count,
                                rejection_count, pending_approval_count, summary_text)
    VALUES (:user_id, :report_date, :applied_count, :interview_count,
            :rejection_count, :pending_approval_count, :summary_text)
    ON CONFLICT (user_id, report_date) DO UPDATE SET
        applied_count = EXCLUDED.applied_count,
        interview_count = EXCLUDED.interview_count,
        rejection_count = EXCLUDED.rejection_count,
        pending_approval_count = EXCLUDED.pending_approval_count,
        summary_text = EXCLUDED.summary_text
    """
)


@dataclass
class DailyReport:
    report_date: date
    applied_count: int
    interview_count: int
    rejection_count: int
    pending_approval_count: int
    recommended: list[dict]
    summary_text: str


def build_summary_text(counts: dict, recommended: list[dict]) -> str:
    lines = [
        f"Applied today: {counts['applied_count']}",
        f"Interviews (total open): {counts['interview_count']}",
        f"Rejections (total): {counts['rejection_count']}",
        f"Awaiting your approval: {counts['pending_approval_count']}",
    ]
    if recommended:
        lines.append("\nTop recommended opportunities awaiting approval:")
        for r in recommended:
            lines.append(f"  - {r['title']} at {r['company']} (score {r['score']})")
    return "\n".join(lines)


def build_daily_report(db, user_id: str, report_date: date) -> DailyReport:
    counts_row = db.execute(COUNTS_SQL, {"user_id": user_id, "report_date": report_date}).first()
    counts = dict(counts_row._mapping)

    recommended_rows = db.execute(RECOMMENDED_SQL, {"user_id": user_id}).fetchall()
    recommended = [dict(r._mapping) for r in recommended_rows]

    summary_text = build_summary_text(counts, recommended)

    db.execute(
        UPSERT_REPORT_SQL,
        {
            "user_id": user_id,
            "report_date": report_date,
            "summary_text": summary_text,
            **counts,
        },
    )
    db.commit()

    return DailyReport(report_date=report_date, recommended=recommended, summary_text=summary_text, **counts)
