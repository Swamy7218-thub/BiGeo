import os

import anthropic

from .dynamo_client import ResolutionCache
from .s3_client import AddressGraphStore

_RESOLUTION_PROMPT = (
    "Resolve this Indian village address to a normalized state/district/"
    "taluk/village structure using the Bharat Address Graph conventions. "
    "Address: {address}"
)


class AddressResolver:
    """Resolves an Indian village address using the Bharat Address Graph and Claude AI."""

    def __init__(
        self,
        graph_store: AddressGraphStore,
        cache: ResolutionCache,
        anthropic_client=None,
        model: str = "claude-sonnet-5",
    ):
        self.graph_store = graph_store
        self.cache = cache
        self.anthropic_client = anthropic_client or anthropic.Anthropic(
            api_key=os.environ["ANTHROPIC_API_KEY"]
        )
        self.model = model

    def resolve(self, address: str) -> dict:
        cached = self.cache.get(address)
        if cached is not None:
            return cached

        resolved = self._resolve_with_claude(address)
        self.cache.put(address, resolved)
        return resolved

    def _resolve_with_claude(self, address: str) -> dict:
        message = self.anthropic_client.messages.create(
            model=self.model,
            max_tokens=1024,
            messages=[
                {"role": "user", "content": _RESOLUTION_PROMPT.format(address=address)}
            ],
        )
        return {"raw_address": address, "resolution": message.content[0].text}
