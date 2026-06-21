"""'Ready to apply' packet generator for platforms whose ToS forbids
automated submission (LinkedIn, Indeed, Wellfound) -- see architecture doc
sections 0 and 6.

Discovery on these platforms stays manual: you paste in the job URL,
title, company, and description yourself (no scraping of login-walled
pages). From there the agent does everything else automatically -- scoring,
tailored resume, cover letter -- and hands back a packet plus a deep link.
Submission itself is always a human click, by design, never automated.
"""

from __future__ import annotations

import json
import uuid

from sqlalchemy import text

from agents.cover_letter.generate import generate_cover_letter
from agents.resume.ats_check import check_resume
from agents.resume.render import render_docx
from agents.resume.store import load_facts
from agents.resume.tailor import tailor_resume

UPSERT_MANUAL_JOB_SQL = text(
    """
    INSERT INTO jobs (source, external_id, company, title, location, apply_url, description, raw_json)
    VALUES ('manual', :external_id, :company, :title, :location, :apply_url, :description, :raw_json)
    ON CONFLICT (source, external_id) DO UPDATE SET
        title = EXCLUDED.title, description = EXCLUDED.description, apply_url = EXCLUDED.apply_url
    RETURNING id
    """
)

INSERT_PACKET_APPLICATION_SQL = text(
    """
    INSERT INTO applications (user_id, job_id, cover_letter_text, status, packet_only,
                               resume_file_url, cover_letter_file_url)
    VALUES (:user_id, :job_id, :cover_letter_text, 'pending_approval', true,
            :resume_file_url, :cover_letter_file_url)
    RETURNING id
    """
)


def create_packet(
    db,
    user_id: str,
    company: str,
    title: str,
    description: str,
    apply_url: str,
    location: str | None = None,
    output_dir: str = "out",
) -> dict:
    """Generates the resume + cover letter for a manually-pasted job listing
    and returns the packet metadata, including the apply_url deep link for
    the human to finish in a single click. Never submits anything itself.
    """
    external_id = str(uuid.uuid5(uuid.NAMESPACE_URL, apply_url))

    job_row = db.execute(
        UPSERT_MANUAL_JOB_SQL,
        {
            "external_id": external_id,
            "company": company,
            "title": title,
            "location": location,
            "apply_url": apply_url,
            "description": description,
            "raw_json": json.dumps({"source": "manual_paste"}),
        },
    ).first()
    job_id = job_row._mapping["id"]
    db.commit()

    facts = load_facts(db, user_id)
    resume_text = tailor_resume(title, description, facts)
    cover_letter = generate_cover_letter(company, title, description, facts)

    resume_path = f"{output_dir}/{external_id}_resume.docx"
    render_docx(resume_text, resume_path)
    ats_result = check_resume(resume_path)

    letter_path = f"{output_dir}/{external_id}_cover_letter.txt"
    with open(letter_path, "w") as f:
        f.write(cover_letter)

    application_row = db.execute(
        INSERT_PACKET_APPLICATION_SQL,
        {
            "user_id": user_id,
            "job_id": job_id,
            "cover_letter_text": cover_letter,
            "resume_file_url": resume_path,
            "cover_letter_file_url": letter_path,
        },
    ).first()
    db.commit()

    return {
        "application_id": str(application_row._mapping["id"]),
        "job_id": str(job_id),
        "apply_url": apply_url,
        "resume_file_url": resume_path,
        "cover_letter_file_url": letter_path,
        "ats_check_passed": ats_result.passed,
        "ats_check_issues": ats_result.issues,
    }
