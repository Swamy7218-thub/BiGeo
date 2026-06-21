"""Thin Claude API client shared by generation agents.

Centralized so every generation call goes through the same place --
useful for swapping models per task (Sonnet default, Opus for high-stakes)
without touching callers.
"""

from __future__ import annotations

import os

import httpx

TIMEOUT = httpx.Timeout(60.0)
ANTHROPIC_VERSION = "2023-06-01"

DEFAULT_MODEL = "claude-sonnet-4-6"
HIGH_STAKES_MODEL = "claude-opus-4-8"


def complete(prompt: str, system: str, model: str = DEFAULT_MODEL, max_tokens: int = 2000) -> str:
    api_key = os.environ["ANTHROPIC_API_KEY"]
    resp = httpx.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": ANTHROPIC_VERSION,
            "content-type": "application/json",
        },
        json={
            "model": model,
            "max_tokens": max_tokens,
            "system": system,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    data = resp.json()
    return "".join(block["text"] for block in data["content"] if block["type"] == "text")
