"""Resume -> fact bank extraction.

Parses a resume (PDF or DOCX) into a flat list of atomic, source-tagged
facts (skills, experience bullets, projects, education, achievements).
This fact bank is the single source of truth the Resume Agent is later
constrained to compose from -- it never invents facts outside this list.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from pypdf import PdfReader
from docx import Document

CATEGORY_HEADERS = {
    "skill": ["skills", "technical skills", "technologies"],
    "experience": [
        "experience", "work experience", "employment",
        "founder experience",
    ],
    "project": ["projects", "personal projects"],
    "education": ["education"],
    "achievement": [
        "achievements", "awards", "certifications", "selected achievements",
    ],
    "grant": ["grants & institutional funding", "grants and institutional funding"],
    "fellowship": ["fellowships & global recognition", "fellowships and global recognition"],
}


@dataclass
class Fact:
    category: str
    text: str
    tags: list[str] = field(default_factory=list)


def _extract_text(path: Path) -> str:
    if path.suffix.lower() == ".pdf":
        reader = PdfReader(str(path))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    if path.suffix.lower() == ".docx":
        doc = Document(str(path))
        return "\n".join(p.text for p in doc.paragraphs)
    raise ValueError(f"Unsupported resume format: {path.suffix}")


def _despace(text: str) -> str:
    return text.replace(" ", "")


def _classify_section(line: str) -> str | None:
    lowered = line.strip().lower().rstrip(":")
    despaced = _despace(lowered)
    for category, headers in CATEGORY_HEADERS.items():
        for header in headers:
            # Direct match, or match against letter-spaced headers (e.g.
            # "S K I L L S") that some PDF designs render as individually
            # spaced glyphs -- pypdf extracts those verbatim, word
            # boundaries and all, so comparing fully despaced strings is
            # the only reliable way to recognize them.
            if lowered == header or despaced == _despace(header):
                return category
    return None


def extract_facts(resume_path: str | Path) -> list[Fact]:
    """Split resume text into section-tagged atomic facts (one per line/bullet)."""
    path = Path(resume_path)
    text = _extract_text(path)

    facts: list[Fact] = []
    current_category = "experience"  # sensible default if no header seen yet

    for raw_line in text.splitlines():
        line = raw_line.strip().lstrip("•-*").strip()
        if not line:
            continue

        section = _classify_section(line)
        if section:
            current_category = section
            continue

        if len(line) < 3:
            continue

        facts.append(Fact(category=current_category, text=line))

    return facts


def facts_to_records(facts: list[Fact], user_id: str) -> list[dict]:
    """Shape facts for insertion into the fact_bank table (embedding added later)."""
    return [
        {"user_id": user_id, "category": f.category, "text": f.text, "tags": f.tags}
        for f in facts
    ]
