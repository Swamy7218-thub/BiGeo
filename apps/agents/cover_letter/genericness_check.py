"""Genericness check (architecture doc section 8.3): flags a new cover letter
as too templated if it's near-duplicate of a previously generated one, so
the agent can be told to regenerate with more job-specific detail.
"""

from __future__ import annotations

from dataclasses import dataclass

from agents.scoring.embeddings import cosine_similarity, embed_texts

SIMILARITY_THRESHOLD = 0.9


@dataclass
class GenericnessResult:
    too_generic: bool
    max_similarity: float
    most_similar_index: int | None


def check_genericness(new_letter: str, previous_letters: list[str]) -> GenericnessResult:
    if not previous_letters:
        return GenericnessResult(too_generic=False, max_similarity=0.0, most_similar_index=None)

    embeddings = embed_texts([new_letter, *previous_letters])
    new_embedding, prev_embeddings = embeddings[0], embeddings[1:]

    similarities = [cosine_similarity(new_embedding, e) for e in prev_embeddings]
    max_sim = max(similarities)
    max_idx = similarities.index(max_sim)

    return GenericnessResult(
        too_generic=max_sim > SIMILARITY_THRESHOLD,
        max_similarity=max_sim,
        most_similar_index=max_idx,
    )
