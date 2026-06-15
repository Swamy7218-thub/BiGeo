"""
Route optimization Lambda — BiGeo / Vaahan
POST /route/optimize

Algorithm:
  1. Resolve addresses via VAAHAN /parse/bulk + depot via /parse
  2. Build distance matrix (HERE Matrix API v8, fallback: Haversine × 1.4)
  3. Solve VRP with greedy nearest-neighbour + 2-opt improvement (pure Python)
  4. Return structured response
"""

import json
import math
import os
import time
import urllib.request
import urllib.error
from typing import Any

VAAHAN_API_URL = os.environ.get("VAAHAN_API_URL", "").rstrip("/")
VAAHAN_INTERNAL_KEY = os.environ.get("VAAHAN_INTERNAL_KEY", "")
HERE_API_KEY = os.environ.get("HERE_API_KEY", "")

HEADERS = {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}


# ── HTTP helpers ──────────────────────────────────────────────────────────────

def _post(url: str, payload: dict, headers: dict, timeout: int = 20) -> dict:
    body = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read())


def json_response(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": HEADERS,
        "body": json.dumps(body),
    }


# ── Step 1: Address resolution ────────────────────────────────────────────────

def resolve_depot(depot_address: str) -> dict | None:
    """Call /parse for a single depot address."""
    try:
        url = f"{VAAHAN_API_URL}/parse"
        result = _post(
            url,
            {"address": depot_address},
            {"Content-Type": "application/json", "x-api-key": VAAHAN_INTERNAL_KEY},
            timeout=25,
        )
        if result.get("lat") and result.get("lng"):
            return result
        return None
    except Exception as e:
        print(f"Depot resolve error: {e}")
        return None


def resolve_addresses_bulk(addresses: list) -> list:
    """Call /parse/bulk and return per-address results in order."""
    try:
        url = f"{VAAHAN_API_URL}/parse/bulk"
        result = _post(
            url,
            {"addresses": addresses},
            {"Content-Type": "application/json", "x-api-key": VAAHAN_INTERNAL_KEY},
            timeout=270,
        )
        # bulk returns {"results": [...]} ordered same as input
        return result.get("results", [])
    except Exception as e:
        print(f"Bulk resolve error: {e}")
        return []


# ── Step 2: Distance matrix ───────────────────────────────────────────────────

def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def haversine_matrix(points: list) -> list:
    """Straight-line × 1.4 road factor (km)."""
    n = len(points)
    matrix = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                d = haversine_km(
                    points[i]["lat"], points[i]["lng"],
                    points[j]["lat"], points[j]["lng"],
                )
                matrix[i][j] = round(d * 1.4, 4)
    return matrix


def here_matrix(points: list):
    """Call HERE Routing Matrix API v8. Returns km matrix or None on failure."""
    if not HERE_API_KEY:
        return None
    try:
        origins = [{"lat": p["lat"], "lng": p["lng"]} for p in points]
        url = (
            f"https://matrix.router.hereapi.com/v8/matrix"
            f"?async=false&apiKey={HERE_API_KEY}"
        )
        payload = {
            "origins": origins,
            "destinations": origins,
            "regionDefinition": {"type": "world"},
            "routingMode": "fast",
            "transportMode": "car",
            "matrixAttributes": ["distances"],
        }
        result = _post(url, payload, {"Content-Type": "application/json"}, timeout=30)
        raw = result.get("matrix", {}).get("distances", [])
        n = len(points)
        if len(raw) != n * n:
            print(f"HERE matrix size mismatch: got {len(raw)}, expected {n * n}")
            return None
        matrix = []
        for i in range(n):
            row = []
            for j in range(n):
                metres = raw[i * n + j]
                km = (metres / 1000.0) if metres >= 0 else 99999.0
                row.append(round(km, 4))
            matrix.append(row)
        return matrix
    except Exception as e:
        print(f"HERE matrix error: {e}")
        return None


def build_distance_matrix(points: list):
    """Try HERE first, fall back to Haversine. Returns (matrix, source_name)."""
    matrix = here_matrix(points)
    if matrix is not None:
        return matrix, "here-routing"
    return haversine_matrix(points), "haversine-road-factor"


# ── Step 3: VRP solver (greedy NN + 2-opt) ────────────────────────────────────

def nearest_neighbour_vrp(
    dist: list, n_vehicles: int, max_stops: int, time_limit_s: float = 3.0
) -> list:
    """
    Greedy nearest-neighbour multi-vehicle VRP.
    Node 0 = depot. Returns list of routes (each: list of node indices, depot excluded).
    """
    n = len(dist)
    unvisited = set(range(1, n))
    routes = [[] for _ in range(n_vehicles)]
    current = [0] * n_vehicles  # each vehicle starts at depot
    vehicle = 0
    start_t = time.time()

    while unvisited and (time.time() - start_t) < time_limit_s:
        v = vehicle % n_vehicles
        if len(routes[v]) >= max_stops:
            vehicle += 1
            # If all vehicles are full, bail
            if all(len(routes[vv]) >= max_stops for vv in range(n_vehicles)):
                break
            continue
        cur = current[v]
        # find nearest unvisited node
        best = min(unvisited, key=lambda j: dist[cur][j])
        routes[v].append(best)
        current[v] = best
        unvisited.discard(best)
        vehicle += 1

    return routes


def two_opt(route: list, dist: list, depot: int = 0, time_limit_s: float = 1.0) -> list:
    """2-opt improvement on a single vehicle route (depot not in list)."""
    if len(route) < 4:
        return route
    best = route[:]
    improved = True
    start_t = time.time()
    while improved and (time.time() - start_t) < time_limit_s:
        improved = False
        for i in range(len(best) - 1):
            for j in range(i + 2, len(best)):
                a = best[i - 1] if i > 0 else depot
                b = best[i]
                c = best[j]
                d = best[j + 1] if j + 1 < len(best) else depot
                if dist[a][b] + dist[c][d] > dist[a][c] + dist[b][d] + 1e-6:
                    best[i : j + 1] = best[i : j + 1][::-1]
                    improved = True
    return best


def solve_vrp(dist: list, n_vehicles: int, max_stops: int) -> list:
    """Returns list of routes (node index lists, depot=0 excluded)."""
    t0 = time.time()
    routes = nearest_neighbour_vrp(dist, n_vehicles, max_stops, time_limit_s=3.0)
    remaining = 5.0 - (time.time() - t0)
    per_route = max(0.3, remaining / max(1, n_vehicles))
    return [
        two_opt(r, dist, depot=0, time_limit_s=per_route) if r else []
        for r in routes
    ]


def route_distance_km(route: list, dist: list) -> float:
    if not route:
        return 0.0
    total = dist[0][route[0]]
    for k in range(len(route) - 1):
        total += dist[route[k]][route[k + 1]]
    total += dist[route[-1]][0]
    return round(total, 2)


# ── Lambda handler ────────────────────────────────────────────────────────────

def lambda_handler(event: dict, context: Any) -> dict:
    t_start = time.time()

    # OPTIONS pre-flight
    method = event.get("requestContext", {}).get("http", {}).get("method", "")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    # Parse body
    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return json_response(400, {"error": "Invalid JSON body"})

    depot_addr = body.get("depot", "")
    addresses = body.get("addresses", [])
    n_vehicles = body.get("vehicles", 3)
    max_stops = body.get("max_stops_per_vehicle", 50)

    # Validate
    if not depot_addr or not isinstance(depot_addr, str) or len(depot_addr.strip()) < 3:
        return json_response(400, {"error": "depot address is required"})
    if not isinstance(addresses, list):
        return json_response(400, {"error": "addresses must be an array"})
    if len(addresses) < 2 or len(addresses) > 150:
        return json_response(400, {"error": "addresses must have 2–150 entries"})
    try:
        n_vehicles = int(n_vehicles)
        max_stops = int(max_stops)
    except (TypeError, ValueError):
        return json_response(400, {"error": "vehicles and max_stops_per_vehicle must be integers"})
    if not (1 <= n_vehicles <= 10):
        return json_response(400, {"error": "vehicles must be between 1 and 10"})

    # ── Step 1: Resolve addresses ─────────────────────────────────────────────
    depot_result = resolve_depot(depot_addr.strip())
    bulk_results = resolve_addresses_bulk(addresses)

    if not depot_result or not depot_result.get("lat"):
        return json_response(502, {
            "error": "Could not resolve depot address",
            "depot": depot_addr,
        })

    depot_point = {
        "lat": float(depot_result["lat"]),
        "lng": float(depot_result["lng"]),
        "address": depot_addr,
    }

    resolved_stops = []
    unresolved = []

    for i, addr in enumerate(addresses):
        res = bulk_results[i] if i < len(bulk_results) else {}
        lat = res.get("lat") if res else None
        lng = res.get("lng") if res else None
        if lat and lng:
            resolved_stops.append({
                "orig_idx": i,
                "address": addr,
                "village": res.get("village"),
                "lat": float(lat),
                "lng": float(lng),
                "confidence": res.get("confidence_score", 0.0),
            })
        else:
            unresolved.append(addr)

    if not resolved_stops:
        return json_response(422, {
            "error": "No addresses could be resolved",
            "unresolved": unresolved,
        })

    # ── Step 2: Distance matrix ───────────────────────────────────────────────
    all_points = [depot_point] + resolved_stops  # depot at index 0
    dist_matrix, matrix_source = build_distance_matrix(all_points)

    # ── Step 3: Solve VRP ─────────────────────────────────────────────────────
    t_solve = time.time()
    routes_indices = solve_vrp(dist_matrix, n_vehicles, max_stops)
    solve_ms = int((time.time() - t_solve) * 1000)

    # ── Step 4: Build response ────────────────────────────────────────────────
    output_routes = []
    for v_idx, route in enumerate(routes_indices):
        if not route:
            continue
        stops_out = []
        for seq, node_idx in enumerate(route, start=1):
            # node_idx 1..N maps to resolved_stops[node_idx - 1]
            stop = resolved_stops[node_idx - 1]
            stops_out.append({
                "sequence": seq,
                "address": stop["address"],
                "village": stop["village"],
                "lat": stop["lat"],
                "lng": stop["lng"],
                "confidence": stop["confidence"],
            })
        output_routes.append({
            "vehicle": v_idx + 1,
            "stops": stops_out,
            "total_distance_km": route_distance_km(route, dist_matrix),
            "estimated_stops": len(stops_out),
        })

    total_ms = int((time.time() - t_start) * 1000)

    return json_response(200, {
        "routes": output_routes,
        "depot": {
            "address": depot_addr,
            "lat": depot_point["lat"],
            "lng": depot_point["lng"],
        },
        "total_addresses": len(addresses),
        "resolved": len(resolved_stops),
        "unresolved": unresolved,
        "solver": "greedy-nn-2opt",
        "matrix_source": matrix_source,
        "solve_time_ms": solve_ms,
        "total_time_ms": total_ms,
    })
