from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db

app = FastAPI(title="AI Job Application Agent API")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/jobs")
def list_jobs(db: Session = Depends(get_db), limit: int = 50) -> list[dict]:
    rows = db.execute(
        text(
            "SELECT id, source, company, title, location, apply_url, discovered_at "
            "FROM jobs ORDER BY discovered_at DESC LIMIT :limit"
        ),
        {"limit": limit},
    )
    return [dict(row._mapping) for row in rows]


@app.get("/fact-bank/{user_id}")
def list_facts(user_id: str, db: Session = Depends(get_db)) -> list[dict]:
    rows = db.execute(
        text("SELECT id, category, text, tags FROM fact_bank WHERE user_id = :uid"),
        {"uid": user_id},
    )
    return [dict(row._mapping) for row in rows]


@app.get("/applications")
def list_applications(status: str | None = None, db: Session = Depends(get_db)) -> list[dict]:
    query = (
        "SELECT a.id, a.status, a.score, a.score_breakdown, a.submitted_at, a.notes, "
        "j.company, j.title, j.apply_url "
        "FROM applications a JOIN jobs j ON j.id = a.job_id"
    )
    params: dict = {}
    if status:
        query += " WHERE a.status = :status"
        params["status"] = status
    query += " ORDER BY a.created_at DESC"
    rows = db.execute(text(query), params)
    return [dict(row._mapping) for row in rows]


@app.post("/applications/{application_id}/approve")
def approve_application(application_id: str, db: Session = Depends(get_db)) -> dict:
    """Human-gate: moves an application from pending_approval to queued so
    the Submission Agent will pick it up. This is the manual-mode click
    referenced throughout the architecture doc -- it never auto-fires."""
    result = db.execute(
        text(
            "UPDATE applications SET status = 'queued' "
            "WHERE id = :id AND status = 'pending_approval' RETURNING id"
        ),
        {"id": application_id},
    )
    row = result.first()
    db.commit()
    if row is None:
        return {"approved": False, "reason": "not found or not in pending_approval"}
    return {"approved": True, "application_id": application_id}


@app.post("/applications/{application_id}/reject")
def reject_application(application_id: str, db: Session = Depends(get_db)) -> dict:
    result = db.execute(
        text(
            "UPDATE applications SET status = 'withdrawn' "
            "WHERE id = :id AND status = 'pending_approval' RETURNING id"
        ),
        {"id": application_id},
    )
    row = result.first()
    db.commit()
    return {"rejected": row is not None}
