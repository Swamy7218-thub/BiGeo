"""Loads fact_bank rows for a user, embedding any that don't have an
embedding yet, and returns them as FactRecord objects ready for retrieval.
"""

from __future__ import annotations

import json

from sqlalchemy import text

from agents.resume.tailor import FactRecord
from agents.scoring.embeddings import embed_texts

SELECT_FACTS_SQL = text(
    "SELECT id, category, text, embedding FROM fact_bank WHERE user_id = :user_id"
)

UPDATE_EMBEDDING_SQL = text("UPDATE fact_bank SET embedding = :embedding WHERE id = :id")


def load_facts(db, user_id: str) -> list[FactRecord]:
    rows = db.execute(SELECT_FACTS_SQL, {"user_id": user_id}).fetchall()

    to_embed_ids: list[str] = []
    to_embed_texts: list[str] = []
    records: list[FactRecord] = []

    for row in rows:
        m = row._mapping
        if m["embedding"] is None:
            to_embed_ids.append(str(m["id"]))
            to_embed_texts.append(m["text"])
        records.append(FactRecord(id=str(m["id"]), category=m["category"], text=m["text"], embedding=m["embedding"]))

    if to_embed_texts:
        new_embeddings = embed_texts(to_embed_texts)
        embedding_by_id = dict(zip(to_embed_ids, new_embeddings))
        for record in records:
            if record.id in embedding_by_id:
                record.embedding = embedding_by_id[record.id]
                db.execute(
                    UPDATE_EMBEDDING_SQL,
                    {"id": record.id, "embedding": json.dumps(record.embedding)},
                )
        db.commit()

    return records
