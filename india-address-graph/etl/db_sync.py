"""
Synchronous SQLAlchemy engine for ETL scripts (psycopg2, not asyncpg).
We use sync here for simplicity in ETL — no need for async.
"""
import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

# Convert asyncpg URL to psycopg2 for sync ETL use
_async_url = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://iag:iag_secret@localhost:5432/india_address_graph",
)
_sync_url = _async_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")

engine = create_engine(_sync_url, pool_pre_ping=True, echo=False)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
