import json
import os

from .address_resolver import AddressResolver
from .dynamo_client import ResolutionCache
from .s3_client import AddressGraphStore

_resolver = None


def _get_resolver() -> AddressResolver:
    global _resolver
    if _resolver is None:
        graph_store = AddressGraphStore(bucket=os.environ["ADDRESS_GRAPH_BUCKET"])
        cache = ResolutionCache(table_name=os.environ["RESOLUTION_CACHE_TABLE"])
        _resolver = AddressResolver(graph_store=graph_store, cache=cache)
    return _resolver


def lambda_handler(event, context):
    body = json.loads(event.get("body") or "{}")
    address = body.get("address")
    if not address:
        return {"statusCode": 400, "body": json.dumps({"error": "address is required"})}

    result = _get_resolver().resolve(address)
    return {"statusCode": 200, "body": json.dumps(result)}
