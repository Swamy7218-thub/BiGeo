"""
BiGeo Booking Service — Phase 1 customer-facing FastAPI service.
Handles phone+OTP auth, price quotes, shipment bookings, document
uploads, and the ops dashboard listing/status endpoints.
"""

from __future__ import annotations

import json
import os
import random
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Any

import boto3
import httpx
import razorpay
import redis.asyncio as aioredis
from fastapi import Depends, FastAPI, HTTPException, Request, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel, Field

# ── Config ────────────────────────────────────────────────────────────────────

AWS_REGION   = os.getenv("AWS_REGION", "ap-south-1")
REDIS_URL    = os.getenv("REDIS_URL", "redis://localhost:6379")
ENVIRONMENT  = os.getenv("ENVIRONMENT", "prod")
VAAHAN_API_URL = os.getenv("VAAHAN_API_URL", "https://v34s17v3h2.execute-api.ap-south-1.amazonaws.com/v1")
VAAHAN_INTERNAL_KEY = os.getenv("VAAHAN_INTERNAL_KEY", "")
DOCS_BUCKET  = os.getenv("DOCS_BUCKET", "bigeo-booking-docs")
JWT_SECRET   = os.getenv("JWT_SECRET", "")
RAZORPAY_KEY_ID     = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

OTP_TABLE      = "bigeo-otp"
USERS_TABLE    = "bigeo-users"
BOOKINGS_TABLE = "bigeo-bookings"
PAYMENTS_TABLE = "bigeo-payments"

# ── Clients ───────────────────────────────────────────────────────────────────

ddb = boto3.resource("dynamodb", region_name=AWS_REGION)
sns = boto3.client("sns", region_name=AWS_REGION)
s3  = boto3.client("s3", region_name=AWS_REGION)
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)) if RAZORPAY_KEY_ID else None

redis_client: aioredis.Redis | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client
    redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
    yield
    if redis_client:
        await redis_client.aclose()


app = FastAPI(
    title="BiGeo Booking Service",
    description="Phase 1 — shipment booking, OTP auth, quotes, payments, ops dashboard",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if ENVIRONMENT != "prod" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://bigeo.in", "https://app.bigeo.in", "http://localhost:3000"],
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

api_key_header = APIKeyHeader(name="authorization", auto_error=False)

# ── Models ────────────────────────────────────────────────────────────────────

class SendOtpRequest(BaseModel):
    phone: str = Field(..., pattern=r"^\+91[6-9]\d{9}$")


class VerifyOtpRequest(BaseModel):
    phone: str = Field(..., pattern=r"^\+91[6-9]\d{9}$")
    otp: str = Field(..., min_length=4, max_length=6)
    role: str = Field(default="customer")  # customer | ops | driver


class QuoteRequest(BaseModel):
    origin_address: str
    destination_address: str
    weight_kg: float = Field(..., gt=0, le=20000)
    volume_cbm: float = Field(default=0, ge=0)
    service_level: str = Field(default="standard")  # standard | express


class BookingCreate(BaseModel):
    origin_address: str
    destination_address: str
    weight_kg: float = Field(..., gt=0, le=20000)
    volume_cbm: float = Field(default=0, ge=0)
    service_level: str = Field(default="standard")
    pickup_date: str
    consignee_name: str
    consignee_phone: str = Field(..., pattern=r"^\+91[6-9]\d{9}$")
    quoted_price_inr: float


class StatusUpdate(BaseModel):
    status: str  # booked | picked_up | in_transit | delivered | cancelled
    note: str = ""


# ── Auth helpers ──────────────────────────────────────────────────────────────

def _gen_otp() -> str:
    return f"{random.randint(0, 9999):04d}"


async def get_current_user(token: str | None = Security(api_key_header)) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="Authorization header required")
    token = token.removeprefix("Bearer ").strip()

    if redis_client:
        raw = await redis_client.get(f"session:{token}")
        if raw:
            return json.loads(raw)

    raise HTTPException(status_code=401, detail="Invalid or expired session")


def require_role(*roles: str):
    async def _checker(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Insufficient role")
        return user
    return _checker


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["system"])
async def health():
    checks: dict[str, str] = {}
    try:
        ddb.Table(BOOKINGS_TABLE).table_status  # noqa: B018
        checks["dynamodb"] = "ok"
    except Exception:
        checks["dynamodb"] = "error"
    try:
        if redis_client:
            await redis_client.ping()
        checks["redis"] = "ok"
    except Exception:
        checks["redis"] = "degraded"
    status = "ok" if all(v == "ok" for v in checks.values()) else "degraded"
    return {"status": status, "checks": checks, "version": "1.0.0"}


# ── Auth: Phone + OTP ─────────────────────────────────────────────────────────

@app.post("/auth/otp/send", tags=["auth"])
async def send_otp(req: SendOtpRequest):
    otp = _gen_otp()
    table = ddb.Table(OTP_TABLE)
    table.put_item(Item={
        "PK": f"OTP#{req.phone}",
        "SK": "META",
        "otp": otp,
        "attempts": 0,
        "expires_at": int((datetime.now(timezone.utc) + timedelta(minutes=5)).timestamp()),
    })

    if ENVIRONMENT == "prod":
        sns.publish(PhoneNumber=req.phone, Message=f"Your BiGeo OTP is {otp}. Valid for 5 minutes.")

    return {"status": "sent", "expires_in_seconds": 300, **({"otp_debug": otp} if ENVIRONMENT != "prod" else {})}


@app.post("/auth/otp/verify", tags=["auth"])
async def verify_otp(req: VerifyOtpRequest):
    table = ddb.Table(OTP_TABLE)
    resp = table.get_item(Key={"PK": f"OTP#{req.phone}", "SK": "META"})
    item = resp.get("Item")

    if not item:
        raise HTTPException(status_code=400, detail="No OTP requested for this number")
    if item.get("attempts", 0) >= 5:
        raise HTTPException(status_code=429, detail="Too many attempts, request a new OTP")
    if int(item["expires_at"]) < int(time.time()):
        raise HTTPException(status_code=400, detail="OTP expired")
    if item["otp"] != req.otp:
        table.update_item(
            Key={"PK": f"OTP#{req.phone}", "SK": "META"},
            UpdateExpression="SET attempts = attempts + :one",
            ExpressionAttributeValues={":one": 1},
        )
        raise HTTPException(status_code=400, detail="Incorrect OTP")

    table.delete_item(Key={"PK": f"OTP#{req.phone}", "SK": "META"})

    users = ddb.Table(USERS_TABLE)
    users.update_item(
        Key={"PK": f"USER#{req.phone}", "SK": "META"},
        UpdateExpression="SET #r = :role, last_login = :now",
        ExpressionAttributeNames={"#r": "role"},
        ExpressionAttributeValues={":role": req.role, ":now": datetime.now(timezone.utc).isoformat()},
    )

    session_token = uuid.uuid4().hex
    session = {"phone": req.phone, "role": req.role}
    if redis_client:
        await redis_client.setex(f"session:{session_token}", 60 * 60 * 24 * 7, json.dumps(session))

    return {"token": session_token, "role": req.role, "expires_in_seconds": 60 * 60 * 24 * 7}


# ── Quote Calculator ──────────────────────────────────────────────────────────

RATE_PER_KG_KM = {"standard": 0.45, "express": 0.85}
BASE_FARE_INR = {"standard": 60, "express": 120}


@app.post("/quote", tags=["booking"])
async def get_quote(req: QuoteRequest):
    distance_km = await _resolve_distance_km(req.origin_address, req.destination_address)
    billable_kg = max(req.weight_kg, req.volume_cbm * 167)  # volumetric weight heuristic

    rate = RATE_PER_KG_KM.get(req.service_level, RATE_PER_KG_KM["standard"])
    base = BASE_FARE_INR.get(req.service_level, BASE_FARE_INR["standard"])
    price = round(base + billable_kg * rate * (distance_km / 100), 2)

    eta_hours = max(4, distance_km / 40)
    if req.service_level == "express":
        eta_hours *= 0.6

    return {
        "distance_km": round(distance_km, 1),
        "billable_kg": round(billable_kg, 2),
        "service_level": req.service_level,
        "price_inr": price,
        "eta_hours": round(eta_hours, 1),
    }


async def _resolve_distance_km(origin: str, destination: str) -> float:
    """Resolve both addresses via VAAHAN and haversine the result.
    Falls back to a flat estimate if VAAHAN is unreachable so the
    quote flow never hard-fails on a geocoding hiccup."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            o, d = await client.get(
                f"{VAAHAN_API_URL}/parse", params={"address": origin}, headers={"x-api-key": VAAHAN_INTERNAL_KEY}
            ), await client.get(
                f"{VAAHAN_API_URL}/parse", params={"address": destination}, headers={"x-api-key": VAAHAN_INTERNAL_KEY}
            )
            o, d = o.json(), d.json()
            return _haversine(o["lat"], o["lng"], d["lat"], d["lng"])
    except Exception:
        return 150.0  # conservative flat fallback


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    import math
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


# ── Bookings ──────────────────────────────────────────────────────────────────

@app.post("/bookings", tags=["booking"])
async def create_booking(req: BookingCreate, user: dict = Depends(require_role("customer"))):
    booking_id = f"BK{uuid.uuid4().hex[:10].upper()}"
    now = datetime.now(timezone.utc).isoformat()

    item = {
        "PK": f"BOOKING#{booking_id}",
        "SK": "META",
        "GSI1PK": f"STATUS#booked",
        "GSI1SK": booking_id,
        "GSI2PK": f"CUSTOMER#{user['phone']}",
        "GSI2SK": booking_id,
        "booking_id": booking_id,
        "customer_phone": user["phone"],
        "status": "booked",
        "created_at": now,
        "updated_at": now,
        **req.model_dump(),
    }
    ddb.Table(BOOKINGS_TABLE).put_item(Item=item)

    payment_order = None
    if razorpay_client:
        payment_order = razorpay_client.order.create({
            "amount": int(req.quoted_price_inr * 100),
            "currency": "INR",
            "receipt": booking_id,
        })

    return {"booking_id": booking_id, "status": "booked", "payment_order": payment_order}


@app.get("/bookings/{booking_id}", tags=["booking"])
async def get_booking(booking_id: str):
    resp = ddb.Table(BOOKINGS_TABLE).get_item(Key={"PK": f"BOOKING#{booking_id}", "SK": "META"})
    item = resp.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Booking not found")
    return item


@app.get("/bookings", tags=["ops"])
async def list_bookings(status: str | None = None, user: dict = Depends(require_role("ops", "customer"))):
    table = ddb.Table(BOOKINGS_TABLE)
    if user["role"] == "customer":
        resp = table.query(
            IndexName="GSI2",
            KeyConditionExpression="GSI2PK = :pk",
            ExpressionAttributeValues={":pk": f"CUSTOMER#{user['phone']}"},
        )
    elif status:
        resp = table.query(
            IndexName="GSI1",
            KeyConditionExpression="GSI1PK = :pk",
            ExpressionAttributeValues={":pk": f"STATUS#{status}"},
        )
    else:
        resp = table.scan(Limit=100)
    return {"bookings": resp.get("Items", [])}


@app.patch("/bookings/{booking_id}/status", tags=["ops"])
async def update_status(booking_id: str, req: StatusUpdate, user: dict = Depends(require_role("ops", "driver"))):
    table = ddb.Table(BOOKINGS_TABLE)
    now = datetime.now(timezone.utc).isoformat()
    table.update_item(
        Key={"PK": f"BOOKING#{booking_id}", "SK": "META"},
        UpdateExpression="SET #s = :status, GSI1PK = :gsi1pk, updated_at = :now, last_note = :note",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={
            ":status": req.status,
            ":gsi1pk": f"STATUS#{req.status}",
            ":now": now,
            ":note": req.note,
        },
    )
    return {"booking_id": booking_id, "status": req.status, "updated_at": now}


@app.post("/bookings/{booking_id}/documents/presign", tags=["booking"])
async def presign_document_upload(booking_id: str, filename: str, user: dict = Depends(get_current_user)):
    key = f"bookings/{booking_id}/{uuid.uuid4().hex[:8]}-{filename}"
    url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": DOCS_BUCKET, "Key": key, "ContentType": "application/octet-stream"},
        ExpiresIn=300,
    )
    return {"upload_url": url, "key": key}


# ── Error Handlers ────────────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": "Internal server error"})
