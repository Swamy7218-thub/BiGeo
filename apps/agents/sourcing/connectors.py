"""Sourcing connectors for ATS platforms with public, ToS-compliant job-listing APIs.

Each connector returns a list of normalized job dicts. These hit only the
public, unauthenticated "job board" listing endpoints that Greenhouse, Lever,
and Ashby publish for this exact purpose -- no login, no scraping of
login-walled pages.
"""

from __future__ import annotations

import httpx

TIMEOUT = httpx.Timeout(15.0)


def fetch_greenhouse_jobs(board_token: str) -> list[dict]:
    """Greenhouse Job Board API: https://boards-api.greenhouse.io/v1/boards/{token}/jobs"""
    url = f"https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs"
    resp = httpx.get(url, params={"content": "true"}, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()

    jobs = []
    for item in data.get("jobs", []):
        jobs.append(
            {
                "source": "greenhouse",
                "external_id": str(item["id"]),
                "company": board_token,
                "title": item.get("title", ""),
                "location": (item.get("location") or {}).get("name"),
                "apply_url": item.get("absolute_url"),
                "description": item.get("content"),
                "raw_json": item,
            }
        )
    return jobs


def fetch_lever_jobs(company_slug: str) -> list[dict]:
    """Lever Postings API: https://api.lever.co/v0/postings/{slug}?mode=json"""
    url = f"https://api.lever.co/v0/postings/{company_slug}"
    resp = httpx.get(url, params={"mode": "json"}, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()

    jobs = []
    for item in data:
        categories = item.get("categories", {})
        jobs.append(
            {
                "source": "lever",
                "external_id": item["id"],
                "company": company_slug,
                "title": item.get("text", ""),
                "location": categories.get("location"),
                "remote_type": categories.get("commitment"),
                "apply_url": item.get("applyUrl") or item.get("hostedUrl"),
                "description": item.get("descriptionPlain") or item.get("description"),
                "raw_json": item,
            }
        )
    return jobs


def fetch_ashby_jobs(org_slug: str) -> list[dict]:
    """Ashby public job board API: https://api.ashbyhq.com/posting-api/job-board/{slug}"""
    url = f"https://api.ashbyhq.com/posting-api/job-board/{org_slug}"
    resp = httpx.get(url, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()

    jobs = []
    for item in data.get("jobs", []):
        jobs.append(
            {
                "source": "ashby",
                "external_id": item["id"],
                "company": org_slug,
                "title": item.get("title", ""),
                "location": item.get("location"),
                "remote_type": "remote" if item.get("isRemote") else None,
                "apply_url": item.get("applyUrl") or item.get("jobUrl"),
                "description": item.get("descriptionHtml") or item.get("description"),
                "raw_json": item,
            }
        )
    return jobs


CONNECTORS = {
    "greenhouse": fetch_greenhouse_jobs,
    "lever": fetch_lever_jobs,
    "ashby": fetch_ashby_jobs,
}
