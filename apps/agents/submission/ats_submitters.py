"""ATS submission adapters.

These use each platform's own documented, employer-opted-in application
APIs -- not browser automation against a login-walled page. Coverage is
necessarily partial: an employer must have enabled the relevant API for
submission to work programmatically. Where they haven't, `submit()` raises
NotSupportedError and the application stays in `pending_approval` for a
human to submit manually via apply_url.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

import httpx

TIMEOUT = httpx.Timeout(30.0)


class NotSupportedError(Exception):
    """Raised when the target ATS/board does not support API submission."""


@dataclass
class SubmissionPayload:
    first_name: str
    last_name: str
    email: str
    phone: str | None
    resume_path: str
    cover_letter_text: str | None
    answers: dict[str, str] | None = None  # question_id -> answer, for custom questions


@dataclass
class SubmissionResult:
    ats_application_id: str
    raw_response: dict


def submit_greenhouse(board_token: str, job_external_id: str, payload: SubmissionPayload) -> SubmissionResult:
    """Greenhouse Job Board API application POST -- requires the employer to
    have enabled API-based applications for this board."""
    api_key = os.environ.get("GREENHOUSE_API_KEY")
    if not api_key:
        raise NotSupportedError("Greenhouse API submission not configured for this board")

    url = "https://harvest.greenhouse.io/v1/candidates"
    with open(payload.resume_path, "rb") as resume_file:
        files = {"resume": (os.path.basename(payload.resume_path), resume_file, "application/octet-stream")}
        data = {
            "first_name": payload.first_name,
            "last_name": payload.last_name,
            "email_addresses": [{"value": payload.email, "type": "personal"}],
            "applications": [{"job_id": job_external_id}],
        }
        resp = httpx.post(
            url, auth=(api_key, ""), data={"application": str(data)}, files=files, timeout=TIMEOUT
        )
    resp.raise_for_status()
    body = resp.json()
    return SubmissionResult(ats_application_id=str(body.get("id")), raw_response=body)


def submit_lever(company_slug: str, job_external_id: str, payload: SubmissionPayload) -> SubmissionResult:
    """Lever Postings API apply endpoint: POST /v0/postings/{slug}/{posting}."""
    url = f"https://api.lever.co/v0/postings/{company_slug}/{job_external_id}"
    with open(payload.resume_path, "rb") as resume_file:
        files = {"resume": (os.path.basename(payload.resume_path), resume_file, "application/octet-stream")}
        data = {
            "name": f"{payload.first_name} {payload.last_name}",
            "email": payload.email,
            "phone": payload.phone or "",
            "comments": payload.cover_letter_text or "",
        }
        resp = httpx.post(url, data=data, files=files, timeout=TIMEOUT)
    if resp.status_code == 404:
        raise NotSupportedError("Lever posting does not accept API applications")
    resp.raise_for_status()
    body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
    return SubmissionResult(ats_application_id=body.get("id", resp.headers.get("Location", "")), raw_response=body)


def submit_ashby(org_slug: str, job_external_id: str, payload: SubmissionPayload) -> SubmissionResult:
    """Ashby job board application API -- requires an Ashby API key with
    application-submission scope, configured per organization."""
    api_key = os.environ.get("ASHBY_API_KEY")
    if not api_key:
        raise NotSupportedError("Ashby API submission not configured for this org")

    url = "https://api.ashbyhq.com/applicationForm.submit"
    payload_json = {
        "jobPostingId": job_external_id,
        "applicant": {
            "name": f"{payload.first_name} {payload.last_name}",
            "email": payload.email,
            "phoneNumber": payload.phone,
        },
        "resumeFileHandle": payload.resume_path,  # requires prior file upload step in production
        "coverLetter": payload.cover_letter_text,
    }
    resp = httpx.post(url, auth=(api_key, ""), json=payload_json, timeout=TIMEOUT)
    resp.raise_for_status()
    body = resp.json()
    return SubmissionResult(ats_application_id=body.get("applicationId", ""), raw_response=body)


SUBMITTERS = {
    "greenhouse": submit_greenhouse,
    "lever": submit_lever,
    "ashby": submit_ashby,
}
