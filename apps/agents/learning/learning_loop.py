"""Learning loop (architecture doc section 5): weekly batch job that checks
whether any (role-type, resume version) combination correlates with a
higher interview rate, and writes a short "lessons learned" note that gets
injected into the Resume Agent's system prompt context.

Deliberately simple statistical reweighting, not fine-tuning -- this avoids
overfitting on what will usually be a small weekly sample size, and keeps
the loop auditable (you can read every "lesson" it draws).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from sqlalchemy import text

WEEKLY_OUTCOMES_SQL = text(
    """
    SELECT j.title, a.status, a.score_breakdown
    FROM applications a JOIN jobs j ON j.id = a.job_id
    WHERE a.user_id = :user_id
      AND a.submitted_at >= :week_start
      AND a.submitted_at < :week_end
      AND a.status IN ('submitted', 'interview', 'rejected', 'offer')
    """
)

INSERT_LESSON_SQL = text(
    """
    INSERT INTO lessons_learned (user_id, week_start, insight_text, sample_size)
    VALUES (:user_id, :week_start, :insight_text, :sample_size)
    ON CONFLICT (user_id, week_start) DO UPDATE SET
        insight_text = EXCLUDED.insight_text, sample_size = EXCLUDED.sample_size
    """
)

LATEST_LESSONS_SQL = text(
    """
    SELECT insight_text FROM lessons_learned
    WHERE user_id = :user_id
    ORDER BY week_start DESC LIMIT 4
    """
)

MIN_SAMPLE_SIZE_FOR_INSIGHT = 8
INTERVIEW_RATE_DELTA_THRESHOLD = 0.15


@dataclass
class WeeklyInsight:
    week_start: date
    sample_size: int
    insight_text: str


def _interview_rate(rows: list[dict]) -> float:
    if not rows:
        return 0.0
    interviewed = sum(1 for r in rows if r["status"] in ("interview", "offer"))
    return interviewed / len(rows)


def compute_weekly_insight(db, user_id: str, week_start: date) -> WeeklyInsight | None:
    week_end = week_start + timedelta(days=7)
    rows = [
        dict(r._mapping)
        for r in db.execute(
            WEEKLY_OUTCOMES_SQL, {"user_id": user_id, "week_start": week_start, "week_end": week_end}
        ).fetchall()
    ]

    if len(rows) < MIN_SAMPLE_SIZE_FOR_INSIGHT:
        return None

    overall_rate = _interview_rate(rows)

    # Group by title keyword (first word of title as a crude role-type proxy)
    by_role: dict[str, list[dict]] = {}
    for row in rows:
        role_key = row["title"].split()[0].lower() if row["title"] else "unknown"
        by_role.setdefault(role_key, []).append(row)

    findings = []
    for role_key, role_rows in by_role.items():
        if len(role_rows) < MIN_SAMPLE_SIZE_FOR_INSIGHT // 2:
            continue
        role_rate = _interview_rate(role_rows)
        if role_rate - overall_rate >= INTERVIEW_RATE_DELTA_THRESHOLD:
            findings.append(
                f"Applications with title containing '{role_key}' had a higher interview "
                f"rate ({role_rate:.0%} vs overall {overall_rate:.0%}, n={len(role_rows)}) -- "
                f"weight resume tailoring toward this role type when ambiguous."
            )
        elif overall_rate - role_rate >= INTERVIEW_RATE_DELTA_THRESHOLD:
            findings.append(
                f"Applications with title containing '{role_key}' underperformed "
                f"({role_rate:.0%} vs overall {overall_rate:.0%}, n={len(role_rows)}) -- "
                f"consider whether the resume framing matches this role type's expectations."
            )

    if not findings:
        insight_text = f"Overall interview rate this week: {overall_rate:.0%} (n={len(rows)}). No standout pattern."
    else:
        insight_text = "\n".join(findings)

    return WeeklyInsight(week_start=week_start, sample_size=len(rows), insight_text=insight_text)


def run_weekly(db, user_id: str, week_start: date) -> WeeklyInsight | None:
    insight = compute_weekly_insight(db, user_id, week_start)
    if insight is None:
        return None
    db.execute(
        INSERT_LESSON_SQL,
        {
            "user_id": user_id,
            "week_start": insight.week_start,
            "insight_text": insight.insight_text,
            "sample_size": insight.sample_size,
        },
    )
    db.commit()
    return insight


def get_recent_lessons_context(db, user_id: str) -> str:
    """Returns recent lessons formatted for injection into the Resume Agent's
    system prompt -- additional context, never a license to invent facts."""
    rows = db.execute(LATEST_LESSONS_SQL, {"user_id": user_id}).fetchall()
    if not rows:
        return ""
    lessons = "\n".join(f"- {r._mapping['insight_text']}" for r in rows)
    return f"\nRecent performance lessons (use as soft guidance only, never as license to invent facts):\n{lessons}"
