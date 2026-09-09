"""
Setu Lambda — BiGeo / Vaahan
POST /setu/book-pickup

Pipeline:
  1. Resolve village address via VAAHAN /parse
  2. Check Shiprocket serviceability (if token configured)
  3. Create Shiprocket order + request pickup (if serviceable)
  4. Mock mode if SHIPROCKET_TOKEN not set (VAAHAN still called for real)
  5. Log to DynamoDB SetuPickups (non-fatal)
"""

import json
import os
import re
import time
import uuid
import urllib.request
import urllib.error
from datetime import datetime, timezone
from typing import Any

import boto3
from botocore.exceptions import ClientError

# ── Env vars ──────────────────────────────────────────────────────────────────
VAAHAN_API_URL = os.environ.get("VAAHAN_API_URL", "").rstrip("/")
VAAHAN_INTERNAL_KEY = os.environ.get("VAAHAN_INTERNAL_KEY", "")
SHIPROCKET_TOKEN = os.environ.get("SHIPROCKET_TOKEN", "").strip()
SETU_TABLE = os.environ.get("SETU_TABLE", "SetuPickups")

SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external"

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Api-Key",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

_dynamodb = None


def _get_dynamo():
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource("dynamodb", region_name="ap-south-1")
    return _dynamodb


# ── HTTP helpers ──────────────────────────────────────────────────────────────

def _http_request(
    url: str,
    method: str = "GET",
    payload: dict | None = None,
    headers: dict | None = None,
    timeout: int = 20,
) -> tuple[int, dict]:
    """Generic HTTP request using stdlib urllib. Returns (status_code, body_dict)."""
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read())
        except Exception:
            body = {"error": str(e)}
        return e.code, body


def json_response(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, ensure_ascii=False),
    }


# ── Step 1: VAAHAN address resolution ────────────────────────────────────────

def resolve_village(village_address: str) -> dict | None:
    """
    Call VAAHAN /parse. Returns the parsed result dict or None on failure.
    """
    url = f"{VAAHAN_API_URL}/parse"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": VAAHAN_INTERNAL_KEY,
    }
    try:
        status, result = _http_request(
            url,
            method="POST",
            payload={"address": village_address},
            headers=headers,
            timeout=25,
        )
        if status == 200 and result.get("lat") and result.get("lng"):
            return result
        print(f"VAAHAN resolve returned status={status} body={json.dumps(result)[:200]}")
        return None
    except Exception as e:
        print(f"VAAHAN resolve error: {e}")
        return None


# ── Step 2: Shiprocket serviceability ────────────────────────────────────────

def check_serviceability(
    pickup_pincode: str,
    delivery_pincode: str,
    weight_kg: float,
    cod_amount: float,
) -> dict | None:
    """
    Returns Shiprocket serviceability data dict or None if unavailable.
    None triggers mock/fallback mode.
    """
    if not SHIPROCKET_TOKEN:
        return None

    params = (
        f"pickup_postcode={pickup_pincode}"
        f"&delivery_postcode={delivery_pincode}"
        f"&weight={weight_kg}"
        f"&cod={1 if cod_amount > 0 else 0}"
    )
    url = f"{SHIPROCKET_BASE}/courier/serviceability/?{params}"
    headers = {
        "Authorization": f"Bearer {SHIPROCKET_TOKEN}",
        "Content-Type": "application/json",
    }
    try:
        status, result = _http_request(url, method="GET", headers=headers, timeout=15)
        if status == 200:
            return result
        print(f"Shiprocket serviceability status={status} body={json.dumps(result)[:200]}")
        return None
    except Exception as e:
        print(f"Shiprocket serviceability error: {e}")
        return None


def pick_best_courier(serviceability_data: dict | None) -> tuple[str | None, float | None, str]:
    """
    Extract cheapest courier from serviceability response.
    Returns (courier_name, charge_inr, serviceability_status).
    """
    if not serviceability_data:
        return None, None, "unknown"

    data = serviceability_data.get("data", {})
    available = data.get("available_courier_companies", [])

    if not available:
        return None, None, "unserviceable"

    def get_charge(c: dict) -> float:
        return float(c.get("freight_charge", c.get("rate", 99999)) or 99999)

    cheapest = sorted(available, key=get_charge)[0]
    courier_name = cheapest.get("courier_name", "Unknown")
    charge = get_charge(cheapest)
    courier_id = cheapest.get("courier_company_id")
    return courier_name, charge, "serviceable"


# ── Step 3: Create Shiprocket order ──────────────────────────────────────────

def create_shiprocket_order(params: dict) -> dict | None:
    """
    POST to Shiprocket adhoc order endpoint.
    Returns Shiprocket response dict or None on failure.
    """
    if not SHIPROCKET_TOKEN:
        return None

    payment_method = "COD" if params["cod_amount"] > 0 else "Prepaid"
    sub_total = max(1, params["cod_amount"])

    order_payload = {
        "order_id": params["order_id"],
        "order_date": params["order_date"],
        "pickup_location": "Primary",
        "billing_customer_name": params["buyer_name"],
        "billing_address": params["buyer_address"],
        "billing_city": params.get("delivery_city", "Delhi"),
        "billing_pincode": params.get("delivery_pincode", "110001"),
        "billing_state": params.get("delivery_state", "Delhi"),
        "billing_country": "India",
        "billing_email": "noreply@bigeo.in",
        "billing_phone": params["seller_phone"],
        "shipping_is_billing": True,
        "order_items": [
            {
                "name": f"Village Produce - {params.get('pickup_village', 'Rural India')}",
                "sku": f"SETU-{params['order_id']}",
                "units": 1,
                "selling_price": sub_total,
            }
        ],
        "payment_method": payment_method,
        "sub_total": sub_total,
        "length": params["length_cm"],
        "breadth": params["breadth_cm"],
        "height": params["height_cm"],
        "weight": params["weight_kg"],
    }

    url = f"{SHIPROCKET_BASE}/orders/create/adhoc"
    headers = {
        "Authorization": f"Bearer {SHIPROCKET_TOKEN}",
        "Content-Type": "application/json",
    }
    try:
        status, result = _http_request(
            url, method="POST", payload=order_payload, headers=headers, timeout=30
        )
        if status in (200, 201):
            return result
        print(f"Shiprocket create order status={status} body={json.dumps(result)[:300]}")
        return None
    except Exception as e:
        print(f"Shiprocket create order error: {e}")
        return None


# ── Step 5: DynamoDB log ──────────────────────────────────────────────────────

def log_to_dynamo(item: dict) -> None:
    """Write pickup record. Non-fatal — swallows all errors so booking never fails."""
    try:
        table = _get_dynamo().Table(SETU_TABLE)
        table.put_item(Item=item)
        print(f"DynamoDB log OK: pickup_id={item.get('pickup_id')}")
    except ClientError as e:
        print(f"DynamoDB ClientError (non-fatal): {e.response['Error']['Message']}")
    except Exception as e:
        print(f"DynamoDB log error (non-fatal): {e}")


# ── Lambda handler ────────────────────────────────────────────────────────────

def lambda_handler(event: dict, context: Any) -> dict:
    t_start = time.time()

    # OPTIONS pre-flight — no auth required
    method = event.get("requestContext", {}).get("http", {}).get("method", "")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    # ── Parse + validate body ─────────────────────────────────────────────────
    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return json_response(400, {"error": "Invalid JSON body"})

    required = ["village_address", "weight_kg", "seller_name", "seller_phone",
                "buyer_name", "buyer_address"]
    missing = [f for f in required if not body.get(f)]
    if missing:
        return json_response(400, {
            "error": f"Missing required fields: {', '.join(missing)}",
        })

    village_address = str(body["village_address"]).strip()
    weight_kg = float(body.get("weight_kg", 0.5))
    length_cm = int(body.get("length_cm", 10))
    breadth_cm = int(body.get("breadth_cm", 10))
    height_cm = int(body.get("height_cm", 10))
    cod_amount = float(body.get("cod_amount", 0))
    seller_name = str(body["seller_name"]).strip()
    seller_phone = str(body["seller_phone"]).strip()
    buyer_name = str(body["buyer_name"]).strip()
    buyer_address = str(body["buyer_address"]).strip()
    preferred_date = body.get(
        "preferred_date", datetime.now(timezone.utc).strftime("%Y-%m-%d")
    )
    order_id = str(body.get("order_id", f"SETU-{int(time.time())}"))

    # ── Step 1: Resolve village address via VAAHAN ────────────────────────────
    print(f"Resolving address: {village_address}")
    vaahan_result = resolve_village(village_address)

    if not vaahan_result:
        return json_response(422, {
            "status": "address_unresolved",
            "message": "Could not resolve village address to GPS. Please provide more details.",
            "village_address": village_address,
            "suggestion": "Try adding district or state name to the address",
        })

    lat = float(vaahan_result.get("lat", 0))
    lng = float(vaahan_result.get("lng", 0))
    confidence = float(vaahan_result.get("confidence_score", 0))
    resolved_pincode = str(vaahan_result.get("pincode", "") or "")
    resolved_village = str(vaahan_result.get("village", "") or "")
    resolved_district = str(vaahan_result.get("district", "") or "")
    resolved_state = str(vaahan_result.get("state", "") or "")

    # Build human-readable resolved address
    parts = [p for p in [resolved_village, resolved_district, resolved_state, resolved_pincode] if p]
    resolved_addr = ", ".join(parts) if parts else village_address

    if confidence < 0.5:
        return json_response(422, {
            "status": "address_unresolved",
            "message": (
                f"Address resolved with low confidence ({confidence:.2f}). "
                "Please provide more details."
            ),
            "village_address": village_address,
            "partial_match": {"lat": lat, "lng": lng, "confidence": confidence},
            "suggestion": "Try adding district or state name to the address",
        })

    pickup_address_obj = {
        "original": village_address,
        "resolved": resolved_addr,
        "lat": lat,
        "lng": lng,
        "confidence": round(confidence, 4),
    }

    # ── Shared metadata ───────────────────────────────────────────────────────
    now_iso = datetime.now(timezone.utc).isoformat()
    pickup_id = str(uuid.uuid4())

    # ── Step 4: Mock mode — SHIPROCKET_TOKEN not configured ───────────────────
    if not SHIPROCKET_TOKEN:
        mock_tracking = f"MOCK-{int(time.time())}"
        print(f"Mock mode: SHIPROCKET_TOKEN not set. Returning mock booking.")
        log_to_dynamo({
            "pickup_id": pickup_id,
            "order_id": order_id,
            "village_address": village_address,
            "resolved_pincode": resolved_pincode,
            "lat": str(lat),
            "lng": str(lng),
            "courier": "mock",
            "tracking_id": mock_tracking,
            "status": "booked_mock",
            "created_at": now_iso,
            "seller_phone": seller_phone,
        })
        return json_response(200, {
            "status": "booked_mock",
            "order_id": order_id,
            "tracking_id": mock_tracking,
            "courier": "MockCourier",
            "pickup_address": pickup_address_obj,
            "estimated_pickup": preferred_date,
            "tracking_url": f"https://shiprocket.co/tracking/{mock_tracking}",
            "courier_charge_inr": 0.0,
            "serviceability": "mock",
            "message": "Mock booking — configure SHIPROCKET_TOKEN for live bookings",
        })

    # ── Step 2: Shiprocket serviceability check ───────────────────────────────
    # Extract 6-digit pincode from buyer_address
    delivery_pincode_match = re.search(r"\b(\d{6})\b", buyer_address)
    delivery_pincode = delivery_pincode_match.group(1) if delivery_pincode_match else "110001"

    if not resolved_pincode:
        return json_response(422, {
            "status": "address_unresolved",
            "message": "Address resolved but pincode could not be determined.",
            "village_address": village_address,
            "pickup_address": pickup_address_obj,
            "suggestion": "Add pincode or district to the address",
        })

    svc_data = check_serviceability(
        resolved_pincode, delivery_pincode, weight_kg, cod_amount
    )
    courier_name, charge_inr, svc_status = pick_best_courier(svc_data)

    if svc_status == "unserviceable":
        log_to_dynamo({
            "pickup_id": pickup_id,
            "order_id": order_id,
            "village_address": village_address,
            "resolved_pincode": resolved_pincode,
            "lat": str(lat),
            "lng": str(lng),
            "courier": "none",
            "tracking_id": "N/A",
            "status": "unserviceable",
            "created_at": now_iso,
            "seller_phone": seller_phone,
        })
        return json_response(200, {
            "status": "unserviceable",
            "pincode": resolved_pincode,
            "message": "No courier services this pincode currently. Will be added to waitlist.",
            "fallback": "India Post covers this area — contact 1800-266-6868",
        })

    # ── Step 3: Create Shiprocket order ──────────────────────────────────────
    order_result = create_shiprocket_order({
        "order_id": order_id,
        "order_date": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
        "pickup_pincode": resolved_pincode,
        "pickup_village": resolved_village or village_address,
        "seller_name": seller_name,
        "seller_phone": seller_phone,
        "buyer_name": buyer_name,
        "buyer_address": buyer_address,
        "delivery_pincode": delivery_pincode,
        "weight_kg": weight_kg,
        "length_cm": length_cm,
        "breadth_cm": breadth_cm,
        "height_cm": height_cm,
        "cod_amount": cod_amount,
    })

    if not order_result:
        return json_response(502, {
            "status": "booking_failed",
            "message": "Address resolved successfully but courier booking failed. Please retry.",
            "pickup_address": pickup_address_obj,
            "order_id": order_id,
        })

    # Extract tracking ID from Shiprocket response (multiple possible keys)
    payload = order_result.get("payload", {}) or {}
    tracking_id = (
        payload.get("awb_code")
        or order_result.get("awb_code")
        or payload.get("shipment_id")
        or order_result.get("shipment_id")
        or f"SR-{order_id}"
    )
    final_courier = (
        payload.get("courier_name")
        or order_result.get("courier_name")
        or courier_name
        or "Shiprocket"
    )

    total_ms = int((time.time() - t_start) * 1000)
    print(f"Setu booking complete in {total_ms}ms: tracking={tracking_id} courier={final_courier}")

    # ── Step 5: Log to DynamoDB ───────────────────────────────────────────────
    log_to_dynamo({
        "pickup_id": pickup_id,
        "order_id": order_id,
        "village_address": village_address,
        "resolved_pincode": resolved_pincode,
        "lat": str(lat),
        "lng": str(lng),
        "courier": str(final_courier),
        "tracking_id": str(tracking_id),
        "status": "booked",
        "created_at": now_iso,
        "seller_phone": seller_phone,
    })

    return json_response(200, {
        "status": "booked",
        "order_id": order_id,
        "tracking_id": str(tracking_id),
        "courier": str(final_courier),
        "pickup_address": pickup_address_obj,
        "estimated_pickup": preferred_date,
        "tracking_url": f"https://shiprocket.co/tracking/{tracking_id}",
        "courier_charge_inr": round(float(charge_inr or 0.0), 2),
        "serviceability": svc_status,
        "message": "Pickup booked successfully via Shiprocket",
    })
