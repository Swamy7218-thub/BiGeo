"""Cover letter generation, template-constrained per architecture doc section 8:
hook -> 2 relevant achievements mapped to job requirements -> close.

Like the resume agent, this is constrained to the candidate's fact bank --
no inventing achievements to make the letter sound better.
"""

from __future__ import annotations

from agents.common.llm import complete
from agents.resume.tailor import FactRecord, retrieve_top_facts

SYSTEM_PROMPT = """You are a cover-letter-writing assistant. You will be given a job description, \
company name, and a list of FACTS about a candidate.

Rules:
1. Only use information present in the FACTS list. Never invent achievements, employers, or metrics.
2. Follow this structure exactly: (a) a 1-2 sentence hook specific to this company/role -- not \
generic enthusiasm, (b) two paragraphs each mapping one candidate achievement from FACTS to a \
specific requirement in the job description, (c) a short close.
3. Avoid generic AI-sounding phrases such as "I am excited to apply" or "I believe I would be a \
great fit" -- be specific and concrete instead.
4. Keep it under 350 words.
"""


def generate_cover_letter(
    company: str, job_title: str, job_description: str, facts: list[FactRecord]
) -> str:
    top_facts = retrieve_top_facts(job_description, facts, top_k=10)
    facts_block = "\n".join(f"[{f.id}] ({f.category}) {f.text}" for f in top_facts)

    prompt = (
        f"COMPANY: {company}\n"
        f"JOB TITLE: {job_title}\n\n"
        f"JOB DESCRIPTION:\n{job_description}\n\n"
        f"FACTS:\n{facts_block}\n\n"
        "Write the cover letter now."
    )
    return complete(prompt=prompt, system=SYSTEM_PROMPT)
