"""Job-fit scoring per architecture doc section 9:

score = 0.30*skill_match + 0.20*experience_fit + 0.15*comp_fit
      + 0.10*location_fit + 0.10*role_type_fit + 0.10*visa_fit
      + 0.05*company_signal

Sub-scores are 0-100. Hard filters (filters.py) run first and short-circuit
to a discard before this module is ever invoked, so visa/location here are
soft signals layered on top of the hard gate, not duplicating it.
"""

from __future__ import annotations

from dataclasses import dataclass

from agents.scoring.embeddings import cosine_similarity
from agents.scoring.filters import Job, Preferences

WEIGHTS = {
    "skill_match": 0.30,
    "experience_fit": 0.20,
    "comp_fit": 0.15,
    "location_fit": 0.10,
    "role_type_fit": 0.10,
    "visa_fit": 0.10,
    "company_signal": 0.05,
}


@dataclass
class ScoreResult:
    total: float
    breakdown: dict[str, float]


def skill_match_score(resume_embedding: list[float], job_embedding: list[float]) -> float:
    sim = cosine_similarity(resume_embedding, job_embedding)
    return max(0.0, min(100.0, sim * 100))


def experience_fit_score(years_required: float | None, years_have: float) -> float:
    if years_required is None:
        return 80.0  # unspecified requirement, mild benefit of the doubt
    gap = years_have - years_required
    if gap >= 0:
        return max(40.0, 100.0 - gap * 5)  # over-qualification penalty, gentler
    return max(0.0, 100.0 + gap * 25)  # under-qualification penalty, steeper


def comp_fit_score(job: Job, prefs: Preferences) -> float:
    if prefs.min_salary is None or job.salary_max is None:
        return 70.0  # unknown range, neutral-positive default
    if job.salary_max >= prefs.min_salary:
        return 100.0
    ratio = job.salary_max / prefs.min_salary
    return max(0.0, ratio * 100)


def location_fit_score(job: Job, prefs: Preferences) -> float:
    if not prefs.countries or not job.location:
        return 70.0
    return 100.0 if any(c.lower() in job.location.lower() for c in prefs.countries) else 30.0


def role_type_fit_score(job: Job, prefs: Preferences) -> float:
    if not prefs.role_types:
        return 70.0
    title = job.title.lower()
    return 100.0 if any(rt.lower() in title for rt in prefs.role_types) else 40.0


def visa_fit_score(job: Job, prefs: Preferences) -> float:
    if not prefs.requires_visa_sponsorship:
        return 100.0
    if job.visa_sponsorship is True:
        return 100.0
    if job.visa_sponsorship is None:
        return 60.0  # unknown, not yet disqualified
    return 0.0  # explicit no -- hard filter should already have removed this


def company_signal_score(_job: Job) -> float:
    # Placeholder for funding stage / Glassdoor signal enrichment in a later phase.
    return 60.0


def score_job(
    job: Job,
    prefs: Preferences,
    resume_embedding: list[float],
    job_embedding: list[float],
    years_required: float | None,
    years_have: float,
) -> ScoreResult:
    breakdown = {
        "skill_match": skill_match_score(resume_embedding, job_embedding),
        "experience_fit": experience_fit_score(years_required, years_have),
        "comp_fit": comp_fit_score(job, prefs),
        "location_fit": location_fit_score(job, prefs),
        "role_type_fit": role_type_fit_score(job, prefs),
        "visa_fit": visa_fit_score(job, prefs),
        "company_signal": company_signal_score(job),
    }
    total = sum(breakdown[k] * WEIGHTS[k] for k in WEIGHTS)
    return ScoreResult(total=round(total, 2), breakdown=breakdown)
