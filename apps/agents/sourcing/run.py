"""Sourcing Agent entry point: pulls listings from configured ATS targets
and upserts them into the `jobs` table.

Targets are configured in sources.json -- a flat list of
{"source": "greenhouse"|"lever"|"ashby", "slug": "<company-board-token>"}.
This keeps the connectors generic and lets you grow the target list without
touching code.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

from sqlalchemy import text

from app.db.session import SessionLocal
from agents.sourcing.connectors import CONNECTORS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sourcing_agent")

SOURCES_FILE = Path(__file__).parent / "sources.json"

UPSERT_SQL = text(
    """
    INSERT INTO jobs (source, external_id, company, title, location, remote_type,
                       description, apply_url, raw_json)
    VALUES (:source, :external_id, :company, :title, :location, :remote_type,
            :description, :apply_url, :raw_json)
    ON CONFLICT (source, external_id) DO UPDATE SET
        title = EXCLUDED.title,
        location = EXCLUDED.location,
        description = EXCLUDED.description,
        apply_url = EXCLUDED.apply_url,
        raw_json = EXCLUDED.raw_json
    """
)


def load_targets() -> list[dict]:
    if not SOURCES_FILE.exists():
        return []
    return json.loads(SOURCES_FILE.read_text())


def run() -> int:
    targets = load_targets()
    total = 0
    db = SessionLocal()
    try:
        for target in targets:
            fetch = CONNECTORS.get(target["source"])
            if fetch is None:
                logger.warning("Unknown source %s, skipping", target["source"])
                continue
            try:
                jobs = fetch(target["slug"])
            except Exception as exc:  # noqa: BLE001 - log and continue other targets
                logger.error("Failed to fetch %s/%s: %s", target["source"], target["slug"], exc)
                continue

            for job in jobs:
                db.execute(
                    UPSERT_SQL,
                    {
                        **job,
                        "remote_type": job.get("remote_type"),
                        "raw_json": json.dumps(job.get("raw_json")),
                    },
                )
            db.commit()
            total += len(jobs)
            logger.info("Upserted %d jobs from %s/%s", len(jobs), target["source"], target["slug"])
    finally:
        db.close()
    return total


if __name__ == "__main__":
    count = run()
    logger.info("Sourcing run complete: %d jobs processed", count)
