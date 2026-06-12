"""
BiGeo Hub Optimizer — OR-Tools K-means + CVRP-based hub placement
Runs as a Fargate task invoked via EventBridge or direct ECS RunTask.
"""

from __future__ import annotations

import json
import math
import os
import random
import uuid
from typing import Any

import boto3
from fastapi import FastAPI
from pydantic import BaseModel, Field

AWS_REGION   = os.getenv("AWS_REGION", "ap-south-1")
HUBS_TABLE   = "bigeo-hubs"
EVENT_BUS    = os.getenv("EVENT_BUS_NAME", "bigeo-logistics-events")

ddb    = boto3.resource("dynamodb", region_name=AWS_REGION)
events = boto3.client("events", region_name=AWS_REGION)

app = FastAPI(title="BiGeo Hub Optimizer", version="1.0.0")

# ── Models ────────────────────────────────────────────────────────────────────

class Point(BaseModel):
    id: str
    lat: float
    lng: float
    demand_kg: float = 0
    village: str = ""
    district: str = ""

class HubOptimizeRequest(BaseModel):
    points: list[Point]
    num_hubs: int = Field(default=5, ge=1, le=100)
    max_coverage_km: float = Field(default=50.0, ge=1, le=500)
    min_demand_per_hub: float = Field(default=0)
    algorithm: str = "kmeans_plus"  # kmeans_plus | elbow | genetic

# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "hub-optimizer"}

# ── Optimize ──────────────────────────────────────────────────────────────────

@app.post("/optimize")
def optimize(req: HubOptimizeRequest) -> dict[str, Any]:
    if len(req.points) < req.num_hubs:
        return {"error": "More hubs than points requested", "hubs": []}

    job_id = f"HUBOPT#{uuid.uuid4().hex[:8].upper()}"

    coords = [(p.lat, p.lng, p.demand_kg, p.id) for p in req.points]

    if req.algorithm == "elbow":
        k = _elbow_method(coords, max_k=min(req.num_hubs + 5, len(coords)))
    elif req.algorithm == "genetic":
        k = req.num_hubs
        coords = _genetic_reorder(coords, k)
    else:
        k = req.num_hubs

    hubs, assignments = _kmeans_plus_plus(coords, k=k, max_coverage_km=req.max_coverage_km)

    # Filter hubs below minimum demand threshold
    if req.min_demand_per_hub > 0:
        hubs = [h for h in hubs if h["total_demand_kg"] >= req.min_demand_per_hub]

    result = {
        "job_id":      job_id,
        "algorithm":   req.algorithm,
        "hubs":        hubs,
        "assignments": assignments,
        "metrics": {
            "total_points":    len(req.points),
            "hubs_placed":     len(hubs),
            "total_demand_kg": round(sum(p.demand_kg for p in req.points), 2),
            "coverage_pct":    round(len([a for a in assignments if a["hub_id"]]) / len(req.points) * 100, 1),
            "inertia":         _compute_inertia(coords, hubs),
        },
    }

    # Persist to DynamoDB
    table = ddb.Table(HUBS_TABLE)
    with table.batch_writer() as batch:
        for hub in hubs:
            batch.put_item(Item={
                "PK":     f"HUB#{hub['hub_id']}",
                "SK":     "CONFIG",
                "GSI1PK": f"JOB#{job_id}",
                "GSI1SK": f"HUB#{hub['hub_id']}",
                **hub,
            })

    _emit_event("HubOptimized", {"job_id": job_id, "hub_count": len(hubs)})

    return result

# ── K-Means ++ ────────────────────────────────────────────────────────────────

def _kmeans_plus_plus(
    points: list[tuple[float, float, float, str]],
    k: int,
    max_iterations: int = 50,
    max_coverage_km: float = 50.0,
) -> tuple[list[dict], list[dict]]:
    if not points:
        return [], []

    lats = [p[0] for p in points]
    lngs = [p[1] for p in points]
    demands = [p[2] for p in points]

    def dist(a, b):
        return _haversine(a[0], a[1], b[0], b[1])

    # k-means++ seed selection (demand-weighted)
    centers = [random.choice(list(zip(lats, lngs)))]
    for _ in range(k - 1):
        dists = [min(dist((la, ln), c) for c in centers) ** 2 * (d + 1) for la, ln, d, _ in points]
        total = sum(dists)
        r = random.uniform(0, total)
        acc = 0
        for i, d in enumerate(dists):
            acc += d
            if acc >= r:
                centers.append((lats[i], lngs[i]))
                break
        else:
            centers.append(centers[-1])

    # Iterative assignment + update
    assignments_idx = [0] * len(points)
    for iteration in range(max_iterations):
        new_assignments = [
            min(range(k), key=lambda ci: dist((la, ln), centers[ci]))
            for la, ln, _, _ in points
        ]
        if new_assignments == assignments_idx and iteration > 0:
            break
        assignments_idx = new_assignments

        # Update centroids (demand-weighted)
        new_centers = []
        for ci in range(k):
            cluster_pts = [(lats[i], lngs[i], demands[i]) for i, a in enumerate(assignments_idx) if a == ci]
            if cluster_pts:
                total_w = sum(d for _, _, d in cluster_pts) or len(cluster_pts)
                new_centers.append((
                    sum(la * (d or 1) for la, _, d in cluster_pts) / total_w,
                    sum(ln * (d or 1) for _, ln, d in cluster_pts) / total_w,
                ))
            else:
                new_centers.append(centers[ci])
        centers = new_centers

    # Build hub objects
    hubs = []
    assignments_out = []
    for ci, (lat, lng) in enumerate(centers):
        cluster = [(points[i], dist((lat, lng), (points[i][0], points[i][1]))) for i, a in enumerate(assignments_idx) if a == ci]
        if not cluster:
            continue

        hub_id = f"HUB{ci+1:02d}"
        max_dist = max(d for _, d in cluster)
        coverage_km = min(max_dist, max_coverage_km)

        hubs.append({
            "hub_id":             hub_id,
            "lat":                round(lat, 6),
            "lng":                round(lng, 6),
            "coverage_radius_km": round(coverage_km, 2),
            "assigned_points":    len(cluster),
            "total_demand_kg":    round(sum(p[2] for p, _ in cluster), 2),
            "avg_distance_km":    round(sum(d for _, d in cluster) / len(cluster), 2),
            "status":             "proposed",
        })

        for pt, d in cluster:
            assignments_out.append({
                "point_id": pt[3],
                "hub_id":   hub_id,
                "distance_km": round(d, 2),
            })

    return sorted(hubs, key=lambda h: h["assigned_points"], reverse=True), assignments_out

# ── Elbow Method (auto K) ─────────────────────────────────────────────────────

def _elbow_method(points, max_k: int) -> int:
    inertias = []
    for k in range(1, max_k + 1):
        hubs, _ = _kmeans_plus_plus(points, k=k, max_iterations=10)
        inertias.append(_compute_inertia(points, hubs))

    # Find elbow via second derivative
    if len(inertias) < 3:
        return max_k
    diffs2 = [inertias[i-1] - 2 * inertias[i] + inertias[i+1] for i in range(1, len(inertias) - 1)]
    return diffs2.index(max(diffs2)) + 2

# ── Genetic reorder (perturbation) ───────────────────────────────────────────

def _genetic_reorder(points, k: int, generations: int = 5) -> list:
    best = list(points)
    best_score = float("inf")
    for _ in range(generations):
        candidate = list(points)
        random.shuffle(candidate)
        hubs, _ = _kmeans_plus_plus(candidate, k=k, max_iterations=5)
        score = _compute_inertia(candidate, hubs)
        if score < best_score:
            best_score = score
            best = candidate
    return best

# ── Helpers ───────────────────────────────────────────────────────────────────

def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def _compute_inertia(points, hubs) -> float:
    if not hubs:
        return float("inf")
    total = 0
    for la, ln, d, _ in points:
        nearest = min(_haversine(la, ln, h["lat"], h["lng"]) for h in hubs)
        total += nearest ** 2
    return round(total, 2)


def _emit_event(detail_type: str, detail: dict):
    try:
        events.put_events(Entries=[{
            "EventBusName": EVENT_BUS,
            "Source":       "bigeo.hub-optimizer",
            "DetailType":   detail_type,
            "Detail":       json.dumps(detail),
        }])
    except Exception as exc:
        print(f"EventBridge: {exc}")
