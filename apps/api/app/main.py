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
