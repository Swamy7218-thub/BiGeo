"""ATS-parse round-trip self-check (architecture doc section 7.5).

Re-parses the generated .docx and verifies the expected section headers and
a minimum amount of extractable text survived -- catches resumes that would
silently fail to parse in a real ATS before they're ever submitted.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from docx import Document

EXPECTED_SECTIONS = {"summary", "skills", "experience", "education"}
MIN_TEXT_LENGTH = 200


@dataclass
class AtsCheckResult:
    passed: bool
    found_sections: set[str]
    missing_sections: set[str]
    extracted_text_length: int
    issues: list[str]


def check_resume(docx_path: str | Path) -> AtsCheckResult:
    doc = Document(str(docx_path))
    full_text = []
    found_sections: set[str] = set()

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
        full_text.append(text)
        if para.style.name.startswith("Heading"):
            found_sections.add(text.lower())

    joined = "\n".join(full_text)
    missing = EXPECTED_SECTIONS - found_sections

    issues = []
    if missing:
        issues.append(f"Missing expected section headers: {sorted(missing)}")
    if len(joined) < MIN_TEXT_LENGTH:
        issues.append(f"Extracted text too short ({len(joined)} chars) -- likely a parsing failure")

    return AtsCheckResult(
        passed=not issues,
        found_sections=found_sections,
        missing_sections=missing,
        extracted_text_length=len(joined),
        issues=issues,
    )
