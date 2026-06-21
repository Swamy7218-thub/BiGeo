import uuid
from datetime import datetime

from pydantic import BaseModel


class JobIn(BaseModel):
    source: str
    external_id: str
    company: str
    title: str
    location: str | None = None
    remote_type: str | None = None
    salary_min: float | None = None
    salary_max: float | None = None
    currency: str | None = None
    description: str | None = None
    apply_url: str | None = None
    raw_json: dict | None = None


class JobOut(JobIn):
    id: uuid.UUID
    discovered_at: datetime

    class Config:
        from_attributes = True
