"""
BiGeo Platform API Gateway — FastAPI service
Orchestrates hub-optimizer, route-optimizer, eta-service, and analytics.
"""

from __future__ import annotations

import json
import os
import time
import uuid
from contextlib import asynccontextmanager
from typing import Any

import boto3
import httpx
import redis.asyncio as aioredis
from fastapi import FastAPI, HTTPException, Request, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel, Field

# ── Config ────────────────────────────────────────────────────────────────────

AWS_REGION     = os.getenv("AWS_REGION", "ap-south-1")
REDIS_URL      = os.getenv("REDIS_URL", "redis://localhost:6379")
EVENT_BUS_NAME = os.getenv("EVENT_BUS_NAME", "bigeo-logistics-events")
ENVIRONMENT    = os.getenv("ENVIRONMENT", "prod")

KEYS_TABLE     = "bigeo-api-keys"
HUBS_TABLE     = "bigeo-hubs"
ROUTES_TABLE   = "bigeo-routes"
DELIVERIES_TABLE = "bigeo-deliveries"

# ── Clients ───────────────────────────────────────────────────────────────────

ddb      = boto3.resource("dynamodb", region_name=AWS_REGION)
events   = boto3.client("events", region_name=AWS_REGION)
bedrock  = boto3.client("bedrock-runtime", region_name=AWS_REGION)

redis_client: aioredis.Redis | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client
    redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
    yield
    if redis_client:
        await redis_client.aclose()

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="BiGeo Platform API",
    description="Hub-and-Spoke Logistics Optimization — v2",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if ENVIRONMENT != "prod" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://bigeo.in", "https://app.bigeo.in"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Api-Key"],
)

api_key_header = APIKeyHeader(name="x-api-key", auto_error=False)

# ── Auth ──────────────────────────────────────────────────────────────────────

async def verify_api_key(api_key: str | None = Security(api_key_header)) -> dict:
    if not api_key:
        raise HTTPException(status_code=401, detail="x-api-key header required")

    cache_key = f"apikey:{api_key}"
    if redis_client:
        cached = await redis_client.get(cache_key)
        if cached:
            item = json.loads(cached)
            if item.get("status") != "active":
                raise HTTPException(status_code=403, detail="API key inactive")
            return item

    table = ddb.Table(KEYS_TABLE)
    resp  = table.get_item(Key={"PK": f"KEY#{api_key}", "SK": "META"})
    item  = resp.get("Item")

    if not item:
        raise HTTPException(status_code=401, detail="Invalid API key")
    if item.get("status") != "active":
        raise HTTPException(status_code=403, detail="API key inactive")

    if redis_client:
        await redis_client.setex(cache_key, 300, json.dumps({"status": item["status"], "company": item.get("company")}))

    return item

# ── Models ────────────────────────────────────────────────────────────────────

class Location(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    address: str = ""

class DeliveryPoint(BaseModel):
    id: str
    location: Location
    demand_kg: float = Field(default=0, ge=0)
    time_window: list[str] = []

class OptimizeHubsRequest(BaseModel):
    delivery_points: list[DeliveryPoint]
    num_hubs: int = Field(default=5, ge=1, le=50)
    constraints: dict[str, Any] = {}

class OptimizeRouteRequest(BaseModel):
    hub_id: str
    vehicles: list[dict]
    stops: list[DeliveryPoint]
    optimize_for: str = "distance"  # distance | time | cost

class ETARequest(BaseModel):
    origin: Location
    destination: Location
    vehicle_type: str = "truck"
    cargo_kg: float = 0

class SimulateNetworkRequest(BaseModel):
    scenario: str
    params: dict[str, Any] = {}

class BulkDeliveriesRequest(BaseModel):
    deliveries: list[dict]
    auto_assign: bool = True

# ── Middleware: Request ID & Timing ───────────────────────────────────────────

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id
    start = time.time()
    response = await call_next(request)
    latency = round((time.time() - start) * 1000)
    response.headers["X-Request-Id"]  = request_id
    response.headers["X-Latency-Ms"]  = str(latency)
    return response

# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["system"])
async def health():
    checks: dict[str, str] = {}
    try:
        ddb.Table(HUBS_TABLE).table_status  # noqa: B018
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
    return {"status": status, "checks": checks, "version": "2.0.0"}

# ── Hub Optimization ──────────────────────────────────────────────────────────

@app.post("/v2/hubs/optimize", tags=["hubs"])
async def optimize_hubs(
    req: OptimizeHubsRequest,
    caller: dict = Security(verify_api_key),
):
    job_id = f"HUB#{uuid.uuid4().hex[:8].upper()}"

    cache_key = f"hub-opt:{hash(json.dumps([p.model_dump() for p in req.delivery_points], sort_keys=True))}"
    if redis_client:
        cached = await redis_client.get(cache_key)
        if cached:
            result = json.loads(cached)
            result["cache_hit"] = True
            return result

    hubs = _kmeans_hub_placement(
        [(p.location.lat, p.location.lng, p.demand_kg) for p in req.delivery_points],
        k=req.num_hubs,
    )

    result = {
        "job_id":    job_id,
        "status":    "completed",
        "hubs":      hubs,
        "metrics": {
            "total_points":    len(req.delivery_points),
            "hubs_placed":     len(hubs),
            "avg_coverage_km": round(sum(h["coverage_radius_km"] for h in hubs) / len(hubs), 2),
        },
        "cache_hit": False,
    }

    if redis_client:
        await redis_client.setex(cache_key, 3600, json.dumps(result))

    _emit_event("HubOptimized", {"job_id": job_id, "hub_count": len(hubs), "company": caller.get("company")})

    table = ddb.Table(HUBS_TABLE)
    for hub in hubs:
        table.put_item(Item={
            "PK": f"HUB#{hub['hub_id']}",
            "SK": "CONFIG",
            "GSI1PK": f"COMPANY#{caller.get('company', 'unknown')}",
            "GSI1SK": f"HUB#{hub['hub_id']}",
            **hub,
        })

    return result

# ── Route Optimization ────────────────────────────────────────────────────────

@app.post("/v2/routes/optimize", tags=["routes"])
async def optimize_routes(
    req: OptimizeRouteRequest,
    caller: dict = Security(verify_api_key),
):
    job_id = f"ROUTE#{uuid.uuid4().hex[:8].upper()}"

    routes = _greedy_vrp(
        hub_id=req.hub_id,
        vehicles=req.vehicles,
        stops=[(s.id, s.location.lat, s.location.lng, s.demand_kg) for s in req.stops],
        optimize_for=req.optimize_for,
    )

    total_distance = sum(r.get("distance_km", 0) for r in routes)
    result = {
        "job_id":  job_id,
        "hub_id":  req.hub_id,
        "status":  "completed",
        "routes":  routes,
        "metrics": {
            "vehicles_used":    len(routes),
            "total_stops":      len(req.stops),
            "total_distance_km": round(total_distance, 2),
            "estimated_fuel_l":  round(total_distance * 0.12, 2),
        },
    }

    table = ddb.Table(ROUTES_TABLE)
    table.put_item(Item={
        "PK": f"ROUTE#{job_id}",
        "SK": "RESULT",
        "GSI1PK": f"HUB#{req.hub_id}",
        "GSI1SK": f"ROUTE#{job_id}",
        **result,
    })

    return result

# ── ETA Prediction ────────────────────────────────────────────────────────────

@app.post("/v2/eta/predict", tags=["eta"])
async def predict_eta(
    req: ETARequest,
    caller: dict = Security(verify_api_key),
):
    distance_km = _haversine(req.origin.lat, req.origin.lng, req.destination.lat, req.destination.lng)

    speed_kmh = {"truck": 45, "bike": 35, "auto": 30}.get(req.vehicle_type, 40)
    loading_factor = 1 + (req.cargo_kg / 5000) * 0.2
    eta_hours = (distance_km / speed_kmh) * loading_factor
    eta_minutes = round(eta_hours * 60)

    return {
        "eta_minutes":   eta_minutes,
        "distance_km":   round(distance_km, 2),
        "speed_kmh":     speed_kmh,
        "confidence":    0.82,
        "breakdown": {
            "transit_minutes":  round((distance_km / speed_kmh) * 60),
            "loading_minutes":  round(req.cargo_kg / 100),
            "buffer_minutes":   10,
        },
    }

# ── Bulk Deliveries ───────────────────────────────────────────────────────────

@app.post("/v2/deliveries/bulk", tags=["deliveries"])
async def create_bulk_deliveries(
    req: BulkDeliveriesRequest,
    caller: dict = Security(verify_api_key),
):
    table = ddb.Table(DELIVERIES_TABLE)
    created = []
    with table.batch_writer() as batch:
        for d in req.deliveries[:500]:
            delivery_id = f"DEL#{uuid.uuid4().hex[:8].upper()}"
            item = {
                "PK": delivery_id,
                "SK": "META",
                "GSI1PK": f"STATUS#pending",
                "GSI1SK": delivery_id,
                "GSI2PK": f"COMPANY#{caller.get('company', 'unknown')}",
                "GSI2SK": delivery_id,
                "status": "pending",
                **d,
            }
            batch.put_item(Item=item)
            created.append(delivery_id)

    return {"created": len(created), "delivery_ids": created[:10], "status": "queued"}

# ── Network Simulation ────────────────────────────────────────────────────────

@app.post("/v2/network/simulate", tags=["network"])
async def simulate_network(
    req: SimulateNetworkRequest,
    caller: dict = Security(verify_api_key),
):
    prompt = f"""You are a logistics optimization AI for rural India.
Simulate this network scenario and return JSON:
{{
  "scenario": "{req.scenario}",
  "params": {json.dumps(req.params)},
  "findings": [
    {{"metric": "...", "current": "...", "projected": "...", "improvement_pct": 0}}
  ],
  "recommendation": "...",
  "risk_level": "low|medium|high",
  "confidence": 0.0
}}"""

    try:
        response = bedrock.invoke_model(
            modelId="global.anthropic.claude-sonnet-4-6",
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": prompt}],
            }),
        )
        body   = json.loads(response["body"].read())
        text   = body["content"][0]["text"]
        start  = text.find("{")
        end    = text.rfind("}") + 1
        result = json.loads(text[start:end])
        return {"simulation_id": f"SIM#{uuid.uuid4().hex[:8].upper()}", **result}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Simulation failed: {exc}") from exc

# ── Optimization Algorithms ───────────────────────────────────────────────────

def _kmeans_hub_placement(
    points: list[tuple[float, float, float]],  # (lat, lng, demand)
    k: int,
) -> list[dict]:
    import math, random

    if not points:
        return []

    k = min(k, len(points))

    # Weight centroids by demand
    def weighted_centroid(cluster):
        total_w = sum(d for _, _, d in cluster) or len(cluster)
        lat = sum(la * (d or 1) for la, _, d in cluster) / total_w
        lng = sum(ln * (d or 1) for _, ln, d in cluster) / total_w
        return lat, lng

    # k-means++ initialization
    centers = [random.choice([(la, ln) for la, ln, _ in points])]
    for _ in range(k - 1):
        dists = [min(_haversine(p[0], p[1], c[0], c[1]) for c in centers) for p in points]
        total = sum(dists)
        r = random.uniform(0, total)
        acc = 0
        for p, d in zip(points, dists):
            acc += d
            if acc >= r:
                centers.append((p[0], p[1]))
                break

    for _ in range(20):
        clusters: list[list] = [[] for _ in range(k)]
        for pt in points:
            idx = min(range(k), key=lambda i: _haversine(pt[0], pt[1], centers[i][0], centers[i][1]))
            clusters[idx].append(pt)

        new_centers = []
        for i, cluster in enumerate(clusters):
            if cluster:
                new_centers.append(weighted_centroid(cluster))
            else:
                new_centers.append(centers[i])

        if new_centers == centers:
            break
        centers = new_centers

    hubs = []
    for i, (lat, lng) in enumerate(centers):
        cluster = clusters[i]
        if not cluster:
            continue
        max_dist = max((_haversine(lat, lng, p[0], p[1]) for p in cluster), default=0)
        hubs.append({
            "hub_id":            f"HUB{i+1:02d}",
            "lat":               round(lat, 6),
            "lng":               round(lng, 6),
            "coverage_radius_km": round(max_dist, 2),
            "assigned_points":   len(cluster),
            "total_demand_kg":   round(sum(p[2] for p in cluster), 2),
        })

    return sorted(hubs, key=lambda h: h["assigned_points"], reverse=True)


def _greedy_vrp(
    hub_id: str,
    vehicles: list[dict],
    stops: list[tuple[str, float, float, float]],  # (id, lat, lng, demand)
    optimize_for: str = "distance",
) -> list[dict]:
    routes = []
    unassigned = list(stops)

    for vehicle in vehicles:
        if not unassigned:
            break
        capacity = vehicle.get("capacity_kg", 1000)
        max_stops = vehicle.get("max_stops", 20)
        current_load = 0
        route_stops = []
        prev_lat = vehicle.get("start_lat", stops[0][1] if stops else 0)
        prev_lng = vehicle.get("start_lng", stops[0][2] if stops else 0)
        total_dist = 0

        remaining = list(unassigned)
        while remaining and len(route_stops) < max_stops:
            # Nearest neighbor heuristic
            candidates = [(s, _haversine(prev_lat, prev_lng, s[1], s[2])) for s in remaining if current_load + s[3] <= capacity]
            if not candidates:
                break
            best_stop, dist = min(candidates, key=lambda x: x[1])
            route_stops.append({"stop_id": best_stop[0], "lat": best_stop[1], "lng": best_stop[2], "demand_kg": best_stop[3], "seq": len(route_stops) + 1})
            current_load += best_stop[3]
            total_dist   += dist
            prev_lat, prev_lng = best_stop[1], best_stop[2]
            remaining.remove(best_stop)
            unassigned.remove(best_stop)

        if route_stops:
            routes.append({
                "vehicle_id":   vehicle.get("id", f"V{len(routes)+1}"),
                "stops":        route_stops,
                "load_kg":      round(current_load, 2),
                "distance_km":  round(total_dist, 2),
                "utilization":  round(current_load / capacity * 100, 1),
            })

    return routes


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    import math
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def _emit_event(detail_type: str, detail: dict):
    try:
        events.put_events(Entries=[{
            "EventBusName": EVENT_BUS_NAME,
            "Source":       "bigeo.platform",
            "DetailType":   detail_type,
            "Detail":       json.dumps(detail),
        }])
    except Exception as exc:
        print(f"EventBridge publish failed: {exc}")


# ── Error Handlers ────────────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": "Internal server error", "request_id": getattr(request.state, "request_id", "unknown")})
