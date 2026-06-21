"""Embedding client abstraction.

Kept provider-agnostic so the Scoring Agent doesn't hardcode a vendor.
Set EMBEDDING_PROVIDER=openai|gemini and the matching API key env var.
"""

from __future__ import annotations

import math
import os

import httpx

TIMEOUT = httpx.Timeout(30.0)


def _embed_openai(texts: list[str]) -> list[list[float]]:
    api_key = os.environ["OPENAI_API_KEY"]
    resp = httpx.post(
        "https://api.openai.com/v1/embeddings",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"model": "text-embedding-3-large", "input": texts},
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    data = resp.json()
    return [item["embedding"] for item in data["data"]]


def _embed_gemini(texts: list[str]) -> list[list[float]]:
    api_key = os.environ["GOOGLE_API_KEY"]
    out: list[list[float]] = []
    for text in texts:
        resp = httpx.post(
            "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent",
            params={"key": api_key},
            json={"model": "models/text-embedding-004", "content": {"parts": [{"text": text}]}},
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        out.append(resp.json()["embedding"]["value"])
    return out


PROVIDERS = {"openai": _embed_openai, "gemini": _embed_gemini}


def embed_texts(texts: list[str]) -> list[list[float]]:
    provider = os.environ.get("EMBEDDING_PROVIDER", "openai")
    fn = PROVIDERS.get(provider)
    if fn is None:
        raise ValueError(f"Unknown EMBEDDING_PROVIDER: {provider}")
    return fn(texts)


def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
