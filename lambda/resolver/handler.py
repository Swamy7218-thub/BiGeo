"""
BiGeo address resolution handler.

Flow: cache lookup -> deterministic rules/reference-data lookup -> Bedrock
(Haiku for structured/high-confidence inputs, escalating to Sonnet then
Opus for ambiguous free text) -> human review queue for anything under the
confidence bar. Never returns a silent failure: every input ends in
"resolved", "pending-review" (queued for a human), or "unresolvable" (only
ever set by the human review process, not by this handler).
"""

import hashlib
import json
import os
import re
import time
import uuid
from decimal import Decimal

import boto3

REGION = os.environ["AWS_REGION"]
REFERENCE_TABLE = os.environ["REFERENCE_DATA_TABLE"]
CACHE_TABLE = os.environ["RESOLUTION_CACHE_TABLE"]
REVIEW_QUEUE_URL = os.environ["REVIEW_QUEUE_URL"]
CACHE_TTL_SECONDS = int(os.environ.get("CACHE_TTL_SECONDS", 60 * 60 * 24 * 30))

# Bedrock global cross-Region inference profile IDs. Confirm the exact
# current IDs with `aws bedrock list-inference-profiles --region ap-south-1`
# before relying on these in production -- Bedrock's model catalog updates
# independently of this codebase.
MODEL_HAIKU = os.environ.get("BEDROCK_MODEL_HAIKU", "global.anthropic.claude-haiku-4-5-20251001-v1:0")
MODEL_SONNET = os.environ.get("BEDROCK_MODEL_SONNET", "global.anthropic.claude-sonnet-4-5-20250929-v1:0")
MODEL_OPUS = os.environ.get("BEDROCK_MODEL_OPUS", "global.anthropic.claude-opus-4-1-20250805-v1:0")

RESOLVED_CONFIDENCE_THRESHOLD = float(os.environ.get("RESOLVED_CONFIDENCE_THRESHOLD", "0.75"))

dynamodb = boto3.resource("dynamodb", region_name=REGION)
reference_table = dynamodb.Table(REFERENCE_TABLE)
cache_table = dynamodb.Table(CACHE_TABLE)
sqs = boto3.client("sqs", region_name=REGION)
bedrock = boto3.client("bedrock-runtime", region_name=REGION)

PIN_CODE_RE = re.compile(r"\b(\d{6})\b")

SYSTEM_PROMPT = """You are an address resolution engine for BiGeo, specialized in Indian \
addresses including structured addresses, partial addresses, landmarks, PIN codes, \
colloquial place names, and free-text descriptions.

Given a raw address input and any candidate reference-data matches, return ONLY a JSON \
object (no prose, no markdown fences) with this exact shape:
{
  "resolved_address": "<single-line canonical address, or null>",
  "address_components": {
    "line1": "<or null>", "landmark": "<or null>", "locality": "<or null>",
    "city": "<or null>", "district": "<or null>", "state": "<or null>",
    "pincode": "<or null>"
  },
  "latitude": <number or null>,
  "longitude": <number or null>,
  "confidence_score": <number between 0 and 1>,
  "reasoning": "<one sentence on why this confidence level>"
}

Be conservative with confidence_score: only score above 0.75 when you are certain of the \
canonical address and coordinates. Ambiguous, contradictory, or underspecified input should \
score low rather than guessing.
"""


def lambda_handler(event, context):
    body = json.loads(event.get("body") or "{}")
    raw_input = (body.get("address") or "").strip()

    if not raw_input:
        return _response(400, {"error": "Field 'address' is required"})

    input_hash = hashlib.sha256(raw_input.lower().encode("utf-8")).hexdigest()

    cached = _get_cached(input_hash)
    if cached:
        return _response(200, {**cached, "resolution_method": "cache"})

    rules_result = _try_rules_based(raw_input)
    if rules_result:
        _write_cache(input_hash, rules_result)
        return _response(200, {**rules_result, "resolution_method": "rules"})

    model_id, tier = _select_model(raw_input)
    bedrock_result = _resolve_with_bedrock(raw_input, model_id)

    # Escalate once to a stronger model if the fast tier wasn't confident.
    if tier == "haiku" and bedrock_result["confidence_score"] < RESOLVED_CONFIDENCE_THRESHOLD:
        bedrock_result = _resolve_with_bedrock(raw_input, MODEL_SONNET)
        tier = "sonnet"
    if tier == "sonnet" and bedrock_result["confidence_score"] < 0.4:
        bedrock_result = _resolve_with_bedrock(raw_input, MODEL_OPUS)
        tier = "opus"

    result = {
        "input": raw_input,
        "resolved_address": bedrock_result["resolved_address"],
        "address_components": bedrock_result["address_components"],
        "geocoordinates": _coords(bedrock_result),
        "confidence_score": bedrock_result["confidence_score"],
    }

    if bedrock_result["confidence_score"] >= RESOLVED_CONFIDENCE_THRESHOLD:
        result["status"] = "resolved"
        _write_cache(input_hash, result)
    else:
        review_id = _queue_for_review(raw_input, result)
        result["status"] = "pending-review"
        result["review_id"] = review_id

    return _response(200, {**result, "resolution_method": f"bedrock:{tier}"})


def _select_model(raw_input: str):
    """Structured, PIN-anchored input -> fast/cheap Haiku. Free text or
    multiple ambiguous landmarks -> Sonnet, the default reasoning tier."""
    has_pin = bool(PIN_CODE_RE.search(raw_input))
    is_short_and_structured = has_pin and len(raw_input.split(",")) <= 4
    if is_short_and_structured:
        return MODEL_HAIKU, "haiku"
    return MODEL_SONNET, "sonnet"


def _try_rules_based(raw_input: str):
    """Deterministic lookups: exact PIN code hit, or exact known-landmark
    string match. Cheap and instant -- always tried before Bedrock."""
    pin_match = PIN_CODE_RE.search(raw_input)
    if pin_match:
        pincode = pin_match.group(1)
        item = reference_table.get_item(Key={"pk": f"PINCODE#{pincode}", "sk": "META"}).get("Item")
        if item and _is_exact_landmark_match(raw_input, item):
            return {
                "input": raw_input,
                "status": "resolved",
                "resolved_address": item["canonical_address"],
                "address_components": item.get("components", {}),
                "geocoordinates": {"lat": float(item["lat"]), "lng": float(item["lng"])},
                "confidence_score": 0.95,
            }
    return None


def _is_exact_landmark_match(raw_input: str, reference_item: dict) -> bool:
    landmark = (reference_item.get("landmark_name") or "").strip().lower()
    return bool(landmark) and landmark in raw_input.lower()


def _resolve_with_bedrock(raw_input: str, model_id: str) -> dict:
    payload = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1024,
        "system": SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": raw_input}],
    }
    response = bedrock.invoke_model(modelId=model_id, body=json.dumps(payload))
    completion = json.loads(response["body"].read())
    text = completion["content"][0]["text"]
    parsed = json.loads(text)
    return {
        "resolved_address": parsed.get("resolved_address"),
        "address_components": parsed.get("address_components"),
        "latitude": parsed.get("latitude"),
        "longitude": parsed.get("longitude"),
        "confidence_score": float(parsed.get("confidence_score", 0)),
    }


def _coords(bedrock_result: dict):
    lat, lng = bedrock_result.get("latitude"), bedrock_result.get("longitude")
    return {"lat": lat, "lng": lng} if lat is not None and lng is not None else None


def _queue_for_review(raw_input: str, best_guess: dict) -> str:
    review_id = str(uuid.uuid4())
    sqs.send_message(
        QueueUrl=REVIEW_QUEUE_URL,
        MessageBody=json.dumps({"review_id": review_id, "input": raw_input, "best_guess": best_guess}),
    )
    return review_id


def _get_cached(input_hash: str):
    item = cache_table.get_item(Key={"input_hash": input_hash}).get("Item")
    if not item:
        return None
    return json.loads(item["result_json"], parse_float=str)


def _write_cache(input_hash: str, result: dict):
    cache_table.put_item(
        Item={
            "input_hash": input_hash,
            "result_json": json.dumps(result),
            "expires_at": int(time.time()) + CACHE_TTL_SECONDS,
        }
    )


def _response(status_code: int, body: dict):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body, default=lambda o: float(o) if isinstance(o, Decimal) else str(o)),
    }
