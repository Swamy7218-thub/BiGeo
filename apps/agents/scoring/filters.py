"""Hard filters applied before scoring.

Anything failing a hard filter is discarded before it ever reaches the
(costlier) embedding/LLM scoring step -- see architecture doc section 9.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Preferences:
    countries: list[str]
    role_types: list[str]
    remote_types: list[str]
    min_salary: float | None
    requires_visa_sponsorship: bool
    min_years_experience: float
    max_years_experience: float | None


@dataclass
class Job:
    title: str
    location: str | None
    remote_type: str | None
    salary_min: float | None
    salary_max: float | None
    visa_sponsorship: bool | None
    description: str | None


def passes_hard_filters(job: Job, prefs: Preferences) -> tuple[bool, str | None]:
    """Returns (passes, reason_if_rejected)."""
    if prefs.requires_visa_sponsorship and job.visa_sponsorship is False:
        return False, "no visa sponsorship"

    if prefs.countries and job.location:
        if not any(c.lower() in job.location.lower() for c in prefs.countries):
            return False, "location not in allowed countries"

    if prefs.remote_types and job.remote_type:
        if job.remote_type.lower() not in [r.lower() for r in prefs.remote_types]:
            return False, "remote type not allowed"

    if prefs.min_salary is not None and job.salary_max is not None:
        if job.salary_max < prefs.min_salary:
            return False, "salary below floor"

    return True, None
