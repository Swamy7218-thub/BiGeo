"""Resume tailoring: retrieve top-matching facts from the fact bank for a
given job, then have the LLM compose a resume selecting/reordering/
rephrasing *only* from those facts.

Hard constraint: the system prompt forbids inventing any fact not present
in the retrieved set. This is the anti-hallucination guardrail described
in architecture doc section 7.2 -- it is not optional.
"""

from __future__ import annotations

from dataclasses import dataclass

from agents.common.llm import complete
from agents.scoring.embeddings import cosine_similarity, embed_texts

SYSTEM_PROMPT = """You are a resume-writing assistant. You will be given a job description \
and a list of FACTS about a candidate, each tagged with a category and a fact_id.

Rules (must follow exactly):
1. You may only use information present in the FACTS list. Never invent, infer, or add any \
skill, employer, title, metric, or achievement not stated in a fact.
2. Select, reorder, and rephrase facts to best match the job description.
3. For every bullet you write, you must be able to trace it back to one or more fact_ids. \
Output each bullet with its source fact_id(s) in brackets, e.g. "Built X serving 1M req/day [fact_12]".
4. Use a single-column, plain-text-friendly structure: Summary, Skills, Experience, Projects, \
Education. No tables, no graphics, no text boxes -- this must parse cleanly through ATS software.
5. If the FACTS do not support a strong response to part of the job description, say so in a \
final "Coverage gaps" section rather than fabricating something to fill the gap.
"""


@dataclass
class FactRecord:
    id: str
    category: str
    text: str
    embedding: list[float]


def retrieve_top_facts(
    job_description: str, facts: list[FactRecord], top_k: int = 25
) -> list[FactRecord]:
    job_embedding = embed_texts([job_description])[0]
    scored = [
        (cosine_similarity(job_embedding, f.embedding), f) for f in facts
    ]
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [f for _, f in scored[:top_k]]


def tailor_resume(job_title: str, job_description: str, facts: list[FactRecord]) -> str:
    top_facts = retrieve_top_facts(job_description, facts)
    facts_block = "\n".join(f"[{f.id}] ({f.category}) {f.text}" for f in top_facts)

    prompt = (
        f"JOB TITLE: {job_title}\n\n"
        f"JOB DESCRIPTION:\n{job_description}\n\n"
        f"FACTS:\n{facts_block}\n\n"
        "Compose the tailored resume now."
    )
    return complete(prompt=prompt, system=SYSTEM_PROMPT)
