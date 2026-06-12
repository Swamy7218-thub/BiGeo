"""
BiGeo Route Optimizer — OR-Tools CVRP + Greedy VRP
Solves the Capacitated Vehicle Routing Problem for rural Indian logistics.
Falls back to greedy nearest-neighbor when OR-Tools unavailable.
"""

from __future__ import annotations

import json
import math
import os
import time
import uuid
from typing import Any

import boto3
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

AWS_REGION  = os.getenv("AWS_REGION", "ap-south-1")
ROUTES_TABLE = "bigeo-routes"
EVENT_BUS   = os.getenv("EVENT_BUS_NAME", "bigeo-logistics-events")

ddb    = boto3.resource("dynamodb", region_name=AWS_REGION)
events = boto3.client("events", region_name=AWS_REGION)

# Try to import OR-Tools (installed in Docker image)
try:
    from ortools.constraint_solver import pywrapcp, routing_enums_pb2
    ORTOOLS_AVAILABLE = True
except ImportError:
    ORTOOLS_AVAILABLE = False
    print("OR-Tools not available — using greedy fallback")

app = FastAPI(title="BiGeo Route Optimizer", version="1.0.0")

# ── Models ────────────────────────────────────────────────────────────────────

class Stop(BaseModel):
    id: str
    lat: float
    lng: float
    demand_kg: float = 0
    service_time_min: int = 10
    time_window: list[int] = []  # [earliest_min, latest_min] from midnight

class Vehicle(BaseModel):
    id: str
    capacity_kg: float = Field(default=1000, ge=1)
    start_lat: float
    start_lng: float
    speed_kmh: float = 45
    max_stops: int = 30
    max_hours: float = 10

class OptimizeRequest(BaseModel):
    hub_id: str
    vehicles: list[Vehicle]
    stops: list[Stop]
    optimize_for: str = "distance"  # distance | time | balanced
    algorithm: str = "auto"         # auto | ortools | greedy

# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "route-optimizer", "ortools": ORTOOLS_AVAILABLE}

# ── Optimize ──────────────────────────────────────────────────────────────────

@app.post("/optimize")
def optimize(req: OptimizeRequest) -> dict[str, Any]:
    if not req.stops:
        raise HTTPException(400, "At least one stop required")
    if not req.vehicles:
        raise HTTPException(400, "At least one vehicle required")

    job_id = f"ROUTE#{uuid.uuid4().hex[:8].upper()}"
    start_time = time.time()

    use_ortools = ORTOOLS_AVAILABLE and (req.algorithm == "ortools" or (req.algorithm == "auto" and len(req.stops) <= 200))

    if use_ortools:
        routes, solver_status = _ortools_cvrp(req)
    else:
        routes, solver_status = _greedy_vrp(req)

    elapsed_ms = round((time.time() - start_time) * 1000)

    total_distance = sum(r.get("distance_km", 0) for r in routes)
    total_load     = sum(r.get("load_kg", 0) for r in routes)
    unserved       = len(req.stops) - sum(len(r.get("stops", [])) for r in routes)

    result = {
        "job_id":      job_id,
        "hub_id":      req.hub_id,
        "algorithm":   "ortools_cvrp" if use_ortools else "greedy_nearest_neighbor",
        "solver_status": solver_status,
        "routes":      routes,
        "metrics": {
            "total_stops":       len(req.stops),
            "stops_served":      len(req.stops) - unserved,
            "stops_unserved":    unserved,
            "vehicles_used":     len(routes),
            "total_distance_km": round(total_distance, 2),
            "total_load_kg":     round(total_load, 2),
            "avg_utilization":   round(
                sum(r.get("load_kg", 0) / v.capacity_kg * 100 for r, v in zip(routes, req.vehicles[:len(routes)])) / max(len(routes), 1), 1
            ),
            "estimated_fuel_l":  round(total_distance * 0.12, 2),
            "solve_time_ms":     elapsed_ms,
        },
    }

    _persist(job_id, req.hub_id, result)
    _emit_event("RouteOptimized", {"job_id": job_id, "hub_id": req.hub_id, "routes": len(routes)})

    return result

# ── OR-Tools CVRP ─────────────────────────────────────────────────────────────

def _ortools_cvrp(req: OptimizeRequest) -> tuple[list[dict], str]:
    from ortools.constraint_solver import pywrapcp, routing_enums_pb2

    # Index 0 = depot (first vehicle start point)
    depot_lat = req.vehicles[0].start_lat
    depot_lng = req.vehicles[0].start_lng
    locations = [(depot_lat, depot_lng)] + [(s.lat, s.lng) for s in req.stops]
    demands   = [0] + [int(s.demand_kg) for s in req.stops]

    n = len(locations)

    # Build distance matrix (km * 10 as integers)
    dist_matrix = [
        [round(_haversine(locations[i][0], locations[i][1], locations[j][0], locations[j][1]) * 10) for j in range(n)]
        for i in range(n)
    ]

    manager = pywrapcp.RoutingIndexManager(n, len(req.vehicles), 0)
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_idx, to_idx):
        return dist_matrix[manager.IndexToNode(from_idx)][manager.IndexToNode(to_idx)]

    transit_callback_idx = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_idx)

    # Capacity dimension
    def demand_callback(from_idx):
        return demands[manager.IndexToNode(from_idx)]

    demand_callback_idx = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_idx,
        0,
        [int(v.capacity_kg) for v in req.vehicles],
        True,
        "Capacity",
    )

    # Time windows if provided
    if any(s.time_window for s in req.stops):
        def time_callback(from_idx, to_idx):
            dist_km = dist_matrix[manager.IndexToNode(from_idx)][manager.IndexToNode(to_idx)] / 10
            speed   = req.vehicles[0].speed_kmh
            return int(dist_km / speed * 60) + req.stops[max(0, manager.IndexToNode(from_idx) - 1)].service_time_min

        time_callback_idx = routing.RegisterTransitCallback(time_callback)
        routing.AddDimension(time_callback_idx, 60, 24 * 60, False, "Time")
        time_dim = routing.GetDimensionOrDie("Time")
        for i, stop in enumerate(req.stops):
            if stop.time_window and len(stop.time_window) == 2:
                idx = manager.NodeToIndex(i + 1)
                time_dim.CumulVar(idx).SetRange(stop.time_window[0], stop.time_window[1])

    # Allow dropping stops (penalized)
    penalty = 10000
    for node in range(1, n):
        routing.AddDisjunction([manager.NodeToIndex(node)], penalty)

    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    params.time_limit.seconds = 10

    solution = routing.SolveWithParameters(params)

    status_map = {0: "not_solved", 1: "success", 2: "fail", 3: "fail_timeout", 4: "invalid"}
    solver_status = status_map.get(routing.status(), "unknown")

    if not solution:
        return _greedy_vrp(req)

    routes = []
    for vid in range(len(req.vehicles)):
        index = routing.Start(vid)
        route_stops = []
        route_dist  = 0
        route_load  = 0
        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            if node != 0:
                stop = req.stops[node - 1]
                route_stops.append({
                    "stop_id":        stop.id,
                    "lat":            stop.lat,
                    "lng":            stop.lng,
                    "demand_kg":      stop.demand_kg,
                    "service_time_min": stop.service_time_min,
                    "seq":            len(route_stops) + 1,
                })
                route_load += stop.demand_kg
            next_index = solution.Value(routing.NextVar(index))
            if not routing.IsEnd(next_index):
                route_dist += dist_matrix[manager.IndexToNode(index)][manager.IndexToNode(next_index)] / 10
            index = next_index

        if route_stops:
            vehicle = req.vehicles[vid]
            routes.append({
                "vehicle_id":  vehicle.id,
                "stops":       route_stops,
                "load_kg":     round(route_load, 2),
                "distance_km": round(route_dist, 2),
                "utilization": round(route_load / vehicle.capacity_kg * 100, 1),
            })

    return routes, solver_status

# ── Greedy VRP (fallback) ─────────────────────────────────────────────────────

def _greedy_vrp(req: OptimizeRequest) -> tuple[list[dict], str]:
    routes = []
    unassigned = list(req.stops)

    for vehicle in req.vehicles:
        if not unassigned:
            break
        current_load = 0.0
        route_stops  = []
        total_dist   = 0.0
        prev = (vehicle.start_lat, vehicle.start_lng)

        while unassigned and len(route_stops) < vehicle.max_stops:
            feasible = [s for s in unassigned if current_load + s.demand_kg <= vehicle.capacity_kg]
            if not feasible:
                break
            nearest = min(feasible, key=lambda s: _haversine(prev[0], prev[1], s.lat, s.lng))
            dist = _haversine(prev[0], prev[1], nearest.lat, nearest.lng)
            total_dist   += dist
            current_load += nearest.demand_kg
            route_stops.append({
                "stop_id":           nearest.id,
                "lat":               nearest.lat,
                "lng":               nearest.lng,
                "demand_kg":         nearest.demand_kg,
                "service_time_min":  nearest.service_time_min,
                "seq":               len(route_stops) + 1,
            })
            prev = (nearest.lat, nearest.lng)
            unassigned.remove(nearest)

        if route_stops:
            routes.append({
                "vehicle_id":  vehicle.id,
                "stops":       route_stops,
                "load_kg":     round(current_load, 2),
                "distance_km": round(total_dist, 2),
                "utilization": round(current_load / vehicle.capacity_kg * 100, 1),
            })

    return routes, "greedy"

# ── Helpers ───────────────────────────────────────────────────────────────────

def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def _persist(job_id: str, hub_id: str, result: dict):
    try:
        ddb.Table(ROUTES_TABLE).put_item(Item={
            "PK":     f"ROUTE#{job_id}",
            "SK":     "RESULT",
            "GSI1PK": f"HUB#{hub_id}",
            "GSI1SK": f"ROUTE#{job_id}",
            **{k: v for k, v in result.items() if k != "routes"},
            "route_count": len(result.get("routes", [])),
        })
    except Exception as exc:
        print(f"DynamoDB persist error: {exc}")


def _emit_event(detail_type: str, detail: dict):
    try:
        events.put_events(Entries=[{
            "EventBusName": EVENT_BUS,
            "Source":       "bigeo.route-optimizer",
            "DetailType":   detail_type,
            "Detail":       json.dumps(detail),
        }])
    except Exception as exc:
        print(f"EventBridge: {exc}")
