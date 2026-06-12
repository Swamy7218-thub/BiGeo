# BiGeo / VAAHAN — Hub-and-Spoke Logistics Optimization Platform
## Complete System Architecture

**Version:** 1.0 | **Author:** BiGeo Engineering | **Status:** Production Blueprint

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [MVP vs Enterprise Architecture](#3-mvp-vs-enterprise)
4. [AWS Architecture](#4-aws-architecture)
5. [Cloudflare Architecture](#5-cloudflare-architecture)
6. [Database Design](#6-database-design)
7. [API Design](#7-api-design)
8. [Microservices Design](#8-microservices-design)
9. [AI/ML Pipeline](#9-aiml-pipeline)
10. [Optimization Algorithms](#10-optimization-algorithms)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Security Architecture](#12-security-architecture)
13. [AWS Cost Model](#13-aws-cost-model)
14. [90-Day Execution Plan](#14-90-day-execution-plan)
15. [Scaling to 100M Deliveries](#15-scaling-to-100m-deliveries)
16. [Repository Structure](#16-repository-structure)
17. [CI/CD Pipeline](#17-cicd-pipeline)
18. [Technical Risks](#18-technical-risks)
19. [Investor Architecture Summary](#19-investor-summary)

---

## 1. Executive Summary

BiGeo/VAAHAN is India's first AI-native logistics intelligence platform, combining:
- **Address Intelligence Layer** (Vaahan API — live): Resolve any Indian rural address in <2s
- **Hub Optimization Engine** (this platform): Place hubs optimally, assign spokes, route fleets
- **Logistics ML Layer**: Predict ETAs, failures, demand, and fleet utilization

**Unique Moat:**
1. Only platform trained on rural Indian address patterns (Bharat Address Graph)
2. Hybrid AI routing: Gemini Flash (cost) + Claude Sonnet (accuracy)
3. ONDC-protocol-native from day one
4. Village-to-city supply chain, not just urban last-mile

**Target Customers (90 days):**
- Tier-2/3 logistics companies (₹10,000–50,000/month SaaS)
- E-commerce companies expanding beyond Tier-1 cities
- Government agencies (ONDC, state procurement)
- Agri-logistics companies (direct BiGeo synergy)

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE EDGE                               │
│  WAF → Workers → CDN → R2 → Turnstile → Zero Trust                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────▼──────────────────────────────────────┐
│                      API GATEWAY LAYER                               │
│   CloudFront → API Gateway v2 → Cognito JWT Auth                    │
└────────┬──────────────┬───────────────┬───────────────┬─────────────┘
         │              │               │               │
    ┌────▼───┐    ┌──────▼──────┐  ┌────▼────┐   ┌──────▼──────┐
    │Address │    │  Logistics  │  │ Fleet   │   │ Analytics   │
    │Service │    │ Optimizer   │  │ Service │   │  Service    │
    │(Lambda)│    │ (Fargate)   │  │(Lambda) │   │ (Fargate)   │
    └────┬───┘    └──────┬──────┘  └────┬────┘   └──────┬──────┘
         │               │              │                │
┌────────▼───────────────▼──────────────▼────────────────▼───────────┐
│                        DATA LAYER                                    │
│  DynamoDB (ops) │ Aurora Serverless (geo) │ ElastiCache │ OpenSearch│
│  S3 (raw data)  │ EventBridge (events)    │ Bedrock ML  │ Athena    │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Hub Optimization Request
```
Client Request
  → Cloudflare WAF (threat filter)
  → Workers (rate limit, edge cache check)
  → CloudFront (SSL termination, cache)
  → API Gateway v2 (routing)
  → Cognito (JWT validation)
  → Hub Optimizer Service (Fargate)
    → Address Service: geocode all nodes
    → Clustering Engine: K-means on lat/lng
    → VRP Solver: OR-Tools optimization
    → ETA Service: Bedrock prediction
    → Cost Calculator: fuel + toll + time
  → Response with optimized hub placement + routes
  → EventBridge: publish HubOptimized event
  → Analytics Service: record metrics
  → S3: archive optimization result
```

---

## 3. MVP vs Enterprise Architecture

### MVP (Day 0–90): Target ₹15,000/month AWS burn

**What's in MVP:**
- ✅ Address intelligence (existing Vaahan API — live)
- ✅ Hub placement via K-means clustering
- ✅ Basic VRP with OR-Tools (up to 50 stops)
- ✅ Real-time ETA prediction via Bedrock
- ✅ REST API (FastAPI on Lambda)
- ✅ Next.js dashboard (basic)
- ✅ DynamoDB + ElastiCache for state
- ✅ Cloudflare Workers for edge caching

**What's NOT in MVP (Enterprise only):**
- ❌ Reinforcement learning routing
- ❌ Real-time GPS telemetry
- ❌ Multi-tenant enterprise isolation
- ❌ Custom ML model training
- ❌ SLA guarantees + dedicated infra
- ❌ EKS cluster
- ❌ Advanced CVRP (>500 stops)
- ❌ Fleet telematics integration

### Enterprise (Month 4+)

**Added:**
- EKS cluster for optimization workloads >500 vehicles
- Aurora Serverless v2 + PostGIS for spatial queries
- OpenSearch for geospatial analytics
- Bedrock fine-tuned models on customer data
- Step Functions orchestration for complex workflows
- Glue + Athena for batch analytics
- Multi-region failover

### Architecture Comparison

| Dimension | MVP | Enterprise |
|-----------|-----|------------|
| Compute | Lambda + small Fargate | Lambda + EKS + Fargate |
| Database | DynamoDB + ElastiCache | DynamoDB + Aurora Serverless + ElastiCache |
| AI/ML | Bedrock (Claude/Gemini) | Bedrock + fine-tuned SageMaker models |
| Optimization | OR-Tools on Lambda | OR-Tools + RL on Fargate/EKS |
| Auth | Cognito | Cognito + enterprise SSO/SAML |
| Monitoring | CloudWatch | CloudWatch + Grafana + Datadog |
| SLA | Best effort | 99.9% uptime SLA |
| Cost | ~$150/month | $800–3,000/month |
| Max fleet size | 100 vehicles | 10,000+ vehicles |
| Customers | 1–10 | 10–500 |

---

## 4. AWS Architecture

### 4.1 Compute Layer

```
┌─────────────────────────────────────────────────────────┐
│  Lambda Functions (Node.js 22 / Python 3.12)            │
│                                                         │
│  vaahan-parse-address   → Address parsing + geocoding   │
│  vaahan-authorizer      → API key validation            │
│  vaahan-register        → Customer registration         │
│  vaahan-usage           → Usage metrics                 │
│  vaahan-health          → Health check                  │
│  bigeo-hub-cluster      → K-means hub clustering        │
│  bigeo-route-simple     → Simple route optimization     │
│  bigeo-eta-predict      → ETA prediction via Bedrock    │
│  bigeo-fleet-assign     → Fleet-to-route assignment     │
│  bigeo-notification     → Webhook + email alerts        │
│                                                         │
│  ECS Fargate Tasks (auto-scaled)                        │
│                                                         │
│  bigeo-optimizer        → OR-Tools VRP solver           │
│  bigeo-analytics        → Metrics aggregation           │
│  bigeo-ml-pipeline      → Batch ML inference            │
└─────────────────────────────────────────────────────────┘
```

### 4.2 API Layer

```
HTTP API Gateway v2 (Vaahan — existing)
  /v1/parse              POST  - Address parsing
  /v1/register           POST  - API key registration
  /v1/health             GET   - Health check
  /v1/usage              GET   - Usage stats

REST API Gateway (New — Logistics Platform)
  /v2/hubs/optimize      POST  - Hub placement optimization
  /v2/routes/optimize    POST  - VRP route optimization
  /v2/fleet/assign       POST  - Fleet allocation
  /v2/eta/predict        POST  - ETA prediction
  /v2/network/simulate   POST  - Network simulation
  /v2/analytics/*        GET   - Analytics queries
  WebSocket API          -     - Real-time tracking updates
```

### 4.3 Data Layer

```
┌──────────────────────────────────────────────────────────────┐
│  DynamoDB (Primary Operational Store)                        │
│                                                              │
│  bigeo-address-graph      (existing) — address cache        │
│  bigeo-api-keys           (existing) — API auth             │
│  bigeo-producers          (new)      — producer profiles    │
│  bigeo-pickups            (new)      — pickup requests      │
│  bigeo-hubs               (new)      — hub definitions      │
│  bigeo-routes             (new)      — optimized routes     │
│  bigeo-fleet              (new)      — vehicle registry     │
│  bigeo-deliveries         (new)      — delivery tracking    │
│  bigeo-network-config     (new)      — customer networks    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Aurora Serverless v2 PostgreSQL + PostGIS (ENTERPRISE ONLY) │
│  - Geospatial polygon queries                               │
│  - Catchment area calculation                               │
│  - Service zone overlap detection                           │
│  - PostGIS ST_Distance, ST_Within, ST_ClusterKMeans         │
├──────────────────────────────────────────────────────────────┤
│  ElastiCache Serverless (Redis)                              │
│  - Route optimization result cache (30 min TTL)             │
│  - Real-time vehicle position cache (30s TTL)               │
│  - Rate limiting counters                                   │
│  - Session state                                            │
├──────────────────────────────────────────────────────────────┤
│  OpenSearch Serverless                                       │
│  - Address search autocomplete                              │
│  - Geospatial delivery queries (geo_distance, geo_bounding) │
│  - Analytics aggregations                                   │
│  - Log analytics                                            │
├──────────────────────────────────────────────────────────────┤
│  S3                                                          │
│  bigeo-optimization-archive  — Optimization results (JSON) │
│  bigeo-map-tiles             — Cached map tile data         │
│  bigeo-ml-datasets           — Training data               │
│  bigeo-reports               — Generated PDF reports        │
│  bigeo-raw-imports           — Customer data uploads        │
└──────────────────────────────────────────────────────────────┘
```

### 4.4 AI/ML Layer (Bedrock Only — No SageMaker)

```
┌──────────────────────────────────────────────────────────────┐
│  Amazon Bedrock                                              │
│                                                              │
│  Address Parsing:                                            │
│    claude-sonnet-4-6 (accuracy) via inference profile       │
│    (Gemini 2.0 Flash via Vertex AI — primary/cheap)         │
│                                                              │
│  ETA Prediction:                                             │
│    claude-3-haiku (fast, cheap): structured prediction      │
│    Input: distance, stops, time_of_day, weather, day_of_week│
│    Output: { eta_minutes, confidence, risk_factors }        │
│                                                              │
│  Route Reasoning:                                            │
│    claude-sonnet-4-6: explain optimization decisions         │
│    "Why was Hub X chosen over Hub Y?"                       │
│                                                              │
│  Demand Forecasting:                                         │
│    claude-3-haiku: analyze historical patterns              │
│    Input: last 90 days delivery data by zone                │
│    Output: next 7-day demand forecast per hub               │
│                                                              │
│  Anomaly Detection:                                          │
│    claude-3-haiku: flag unusual delivery patterns           │
│                                                              │
│  Embeddings (Titan):                                         │
│    Address similarity matching                              │
│    Route pattern clustering                                  │
└──────────────────────────────────────────────────────────────┘
```

### 4.5 Event Architecture

```
EventBridge Bus: bigeo-logistics-events

Events Published:
  bigeo.address.parsed          → Analytics, Cache warming
  bigeo.hub.optimized           → Notification, Analytics
  bigeo.route.optimized         → Fleet Service, Driver App
  bigeo.delivery.picked_up      → Tracking, ETA recalculate
  bigeo.delivery.out_for_delivery → Customer notification
  bigeo.delivery.completed      → Analytics, Billing
  bigeo.delivery.failed         → Alert, Re-route
  bigeo.fleet.low_fuel          → Maintenance alert
  bigeo.producer.registered     → Onboarding workflow

Step Functions Workflows:
  HubOptimizationWorkflow:
    1. ValidateInputAddresses
    2. GeocodeAllAddresses (parallel)
    3. RunKMeansClustering
    4. RunVRPOptimization
    5. PredictETAs (parallel)
    6. CalculateCosts
    7. GenerateReport
    8. NotifyCustomer

  DeliveryWorkflow:
    1. AssignToHub
    2. AssignToRoute
    3. AssignDriver
    4. MonitorProgress (loop)
    5. HandleExceptions
    6. CompleteDelivery
```

---

## 5. Cloudflare Architecture

### 5.1 Edge Layer Design

```
Internet → Cloudflare Network
  │
  ├─ WAF Rules
  │    ├── Block: SQL injection, XSS, path traversal
  │    ├── Rate limit: 1000 req/min per IP
  │    ├── Block: Known bad IPs (threat intelligence)
  │    └── Custom rule: Require x-api-key on /api/*
  │
  ├─ Turnstile (Bot Protection)
  │    └── On registration and demo endpoints
  │
  ├─ Workers (Compute at Edge)
  │    ├── geo-router.js    → Route by user location (India regions)
  │    ├── cache-check.js   → Check R2 for cached optimization results
  │    ├── rate-limit.js    → Per-customer rate limiting via Durable Objects
  │    ├── auth-validate.js → Validate JWT at edge (zero-latency auth)
  │    └── api-transform.js → Request/response transformation
  │
  ├─ R2 (Object Storage)
  │    ├── map-tiles/       → India road network map tiles
  │    ├── optimizations/   → Cached optimization results (24h TTL)
  │    ├── reports/         → Generated reports
  │    └── static-assets/   → Next.js build artifacts
  │
  ├─ D1 (SQLite at Edge)
  │    ├── api_keys         → Edge-local API key cache (sync from DynamoDB)
  │    ├── rate_limits      → Per-key request counts
  │    └── geo_cache        → Frequently resolved addresses
  │
  ├─ Durable Objects
  │    ├── RateLimiter      → Stateful per-customer rate limiting
  │    └── WebSocketRoom    → Real-time tracking rooms
  │
  └─ CDN
       ├── Portal: bigeo.in (bigeo-redesign.html)
       ├── API Docs: docs.bigeo.in
       └── Dashboard: app.bigeo.in
```

### 5.2 Workers Code Architecture

```javascript
// geo-router.js — Route to correct AWS region
export default {
  async fetch(request, env) {
    const country = request.cf?.country;
    const region = request.cf?.region;

    // Route Indian traffic to ap-south-1 (Mumbai)
    if (country === 'IN') {
      return fetch(env.AWS_INDIA_ENDPOINT + new URL(request.url).pathname, request);
    }
    return fetch(env.AWS_DEFAULT_ENDPOINT + new URL(request.url).pathname, request);
  }
}

// cache-check.js — Check optimization cache before hitting AWS
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return fetch(request);
    const body = await request.clone().json();
    const cacheKey = hashOptimizationRequest(body);
    const cached = await env.R2.get(`optimizations/${cacheKey}`);
    if (cached) {
      return new Response(cached.body, {
        headers: { 'X-Cache': 'HIT', 'Content-Type': 'application/json' }
      });
    }
    const response = await fetch(request);
    // Cache successful optimizations for 30 minutes
    if (response.ok) {
      const responseBody = await response.clone().text();
      await env.R2.put(`optimizations/${cacheKey}`, responseBody, {
        httpMetadata: { contentType: 'application/json' },
        customMetadata: { cached_at: Date.now().toString() }
      });
    }
    return response;
  }
}
```

---

## 6. Database Design

### 6.1 DynamoDB Table Designs

#### bigeo-hubs
```
PK: HUB#<hub_id>              SK: METADATA
  hub_id, customer_id, name, address, lat, lng,
  capacity_kg, capacity_parcels, vehicles_count,
  operating_hours, status, created_at

PK: CUSTOMER#<customer_id>    SK: HUB#<hub_id>
  (GSI for customer's hubs)
```

#### bigeo-routes
```
PK: ROUTE#<route_id>          SK: METADATA
  route_id, hub_id, customer_id, date, shift,
  vehicle_id, driver_id, total_stops, total_km,
  estimated_duration_min, actual_duration_min,
  status, created_at, algorithm_used

PK: ROUTE#<route_id>          SK: STOP#<seq_num>
  stop_seq, delivery_id, address, lat, lng,
  arrival_time, departure_time, status, notes
```

#### bigeo-deliveries
```
PK: DELIVERY#<delivery_id>    SK: METADATA
  delivery_id, customer_id, hub_id, route_id,
  pickup_address, delivery_address,
  pickup_lat, pickup_lng, delivery_lat, delivery_lng,
  weight_kg, dimensions, priority,
  scheduled_date, promised_eta, actual_eta,
  status, failure_reason, created_at

PK: DATE#<YYYY-MM-DD>         SK: DELIVERY#<delivery_id>
  (GSI for date-based queries)

PK: HUB#<hub_id>#DATE#<date>  SK: STATUS#<status>#<delivery_id>
  (GSI for hub-day status overview)
```

#### bigeo-fleet
```
PK: VEHICLE#<vehicle_id>      SK: METADATA
  vehicle_id, customer_id, registration_no,
  type (2W/3W/LCV/HCV), capacity_kg, capacity_volume_cbm,
  fuel_type, status, current_hub_id, driver_id

PK: VEHICLE#<vehicle_id>      SK: TELEMETRY#<timestamp>
  lat, lng, speed_kmph, fuel_level_pct, odometer_km
  (TTL: 7 days for telemetry)
```

#### bigeo-network-config
```
PK: NETWORK#<customer_id>     SK: METADATA
  customer_id, name, geography, hub_count,
  spoke_radius_km, optimization_objective,
  constraints, sla_config, billing_config

PK: NETWORK#<customer_id>     SK: HUB#<hub_id>
  hub assignment with service zones (polygon as JSON)
```

### 6.2 OpenSearch Index Designs

#### bigeo-addresses (geospatial)
```json
{
  "mappings": {
    "properties": {
      "address_id": { "type": "keyword" },
      "input_text": { "type": "text", "analyzer": "standard" },
      "structured": { "type": "text" },
      "village": { "type": "keyword" },
      "district": { "type": "keyword" },
      "state": { "type": "keyword" },
      "pincode": { "type": "keyword" },
      "location": { "type": "geo_point" },
      "confidence": { "type": "float" }
    }
  }
}
```

#### bigeo-deliveries-analytics
```json
{
  "mappings": {
    "properties": {
      "delivery_id": { "type": "keyword" },
      "pickup_location": { "type": "geo_point" },
      "delivery_location": { "type": "geo_point" },
      "hub_id": { "type": "keyword" },
      "status": { "type": "keyword" },
      "date": { "type": "date" },
      "eta_minutes": { "type": "integer" },
      "actual_minutes": { "type": "integer" },
      "weight_kg": { "type": "float" },
      "cost_inr": { "type": "float" }
    }
  }
}
```

---

## 7. API Design

### Base URLs
```
Production:  https://api.bigeo.in/v2
Staging:     https://api-staging.bigeo.in/v2
Development: http://localhost:8000/v2
```

### Authentication
```
All endpoints: x-api-key: <key>
Admin endpoints: Authorization: Bearer <cognito_jwt>
```

### Core Endpoints

#### POST /v2/hubs/optimize
```json
Request:
{
  "locations": [
    {"id": "D001", "address": "Near temple, Yellareddyguda, Siddipet", "daily_volume": 45},
    {"id": "D002", "address": "Behind school, Dubbak, Siddipet", "daily_volume": 32}
  ],
  "constraints": {
    "max_hubs": 3,
    "max_spoke_radius_km": 50,
    "vehicle_capacity_kg": 1000,
    "operating_hours": {"start": "06:00", "end": "20:00"}
  },
  "objective": "minimize_cost",  // or "minimize_time", "balance_load"
  "algorithm": "auto"  // or "kmeans", "genetic", "simulated_annealing"
}

Response:
{
  "optimization_id": "OPT-20260612-abc123",
  "algorithm_used": "kmeans+vrp",
  "hubs": [
    {
      "hub_id": "HUB-001",
      "recommended_location": {
        "address": "Siddipet Main Road, Siddipet",
        "lat": 18.1018, "lng": 78.8522
      },
      "spokes": ["D001", "D002", "D015"],
      "estimated_daily_volume_kg": 450,
      "estimated_vehicles_needed": 3,
      "service_radius_km": 42.3
    }
  ],
  "metrics": {
    "total_cost_inr_per_day": 4500,
    "vs_baseline_savings_pct": 31.2,
    "avg_delivery_time_min": 87,
    "hub_utilization_pct": 78.4,
    "co2_kg_per_day": 12.3
  },
  "routes": [...],
  "latency_ms": 1240
}
```

#### POST /v2/routes/optimize
```json
Request:
{
  "hub": {"lat": 18.1018, "lng": 78.8522},
  "deliveries": [
    {"id": "D001", "address": "...", "lat": 18.12, "lng": 78.87,
     "weight_kg": 5.2, "time_window": {"open": "09:00", "close": "13:00"}}
  ],
  "vehicles": [
    {"id": "V001", "capacity_kg": 500, "type": "LCV"}
  ],
  "algorithm": "cvrp",  // vrp, cvrp, tsp, genetic
  "max_computation_seconds": 30
}

Response:
{
  "routes": [
    {
      "vehicle_id": "V001",
      "total_stops": 12,
      "total_distance_km": 87.4,
      "estimated_duration_min": 214,
      "stops": [
        {"seq": 1, "delivery_id": "D001", "eta": "09:23", "lat": 18.12, "lng": 78.87}
      ]
    }
  ],
  "unassigned": [],
  "metrics": {
    "total_distance_km": 87.4,
    "fleet_utilization_pct": 82,
    "on_time_delivery_pct": 94.1,
    "fuel_cost_estimate_inr": 612
  }
}
```

#### POST /v2/eta/predict
```json
Request:
{
  "origin": {"lat": 18.10, "lng": 78.85},
  "destination": {"lat": 17.38, "lng": 78.49},
  "departure_time": "2026-06-12T09:00:00+05:30",
  "vehicle_type": "LCV",
  "stops_count": 8,
  "weather_conditions": "clear"
}

Response:
{
  "eta_minutes": 127,
  "eta_arrival": "2026-06-12T11:07:00+05:30",
  "confidence": 0.82,
  "risk_factors": ["market_day_in_route", "highway_construction_zone"],
  "alternatives": [
    {"route": "via_NH65", "eta_minutes": 119, "distance_km": 142},
    {"route": "via_state_road", "eta_minutes": 138, "distance_km": 128}
  ]
}
```

#### POST /v2/network/simulate
```json
// Simulate what-if scenarios: "What if I add a hub in Nizamabad?"
Request:
{
  "base_network_id": "NET-001",
  "changes": [
    {"action": "add_hub", "location": {"address": "Nizamabad, Telangana"}},
    {"action": "increase_fleet", "hub_id": "HUB-002", "vehicles_add": 2}
  ],
  "simulation_days": 30,
  "traffic_model": "historical_avg"
}
```

#### GET /v2/analytics/dashboard
```json
Response:
{
  "period": "2026-06-01/2026-06-12",
  "summary": {
    "total_deliveries": 4821,
    "on_time_rate_pct": 91.3,
    "avg_cost_per_delivery_inr": 47.20,
    "fleet_utilization_pct": 76.8,
    "hub_utilization_pct": 71.2
  },
  "heatmap_data": [...],
  "trends": [...],
  "alerts": [...]
}
```

---

## 8. Microservices Design

### Service Boundaries and Responsibilities

```
┌─────────────────────────────────────────────────────────────────┐
│  address-service (existing Vaahan)                               │
│  - Parse any Indian address to structured JSON + GPS             │
│  - Cache in DynamoDB (bigeo-address-graph)                       │
│  - Bedrock (Claude) + Vertex AI (Gemini) hybrid routing         │
│  - Translation API for Telugu/Hindi input                        │
│  Runtime: Lambda (Node.js 22) | Latency: <300ms cache, <2s miss │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  hub-optimizer-service                                           │
│  - K-means clustering of delivery locations                      │
│  - Hub feasibility scoring (population, road access, land cost)  │
│  - Service zone polygon generation                               │
│  - Spoke assignment optimization                                  │
│  - What-if simulation engine                                      │
│  Runtime: Fargate (Python 3.12) | Memory: 2GB | CPU: 1 vCPU     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  route-optimizer-service                                         │
│  - Vehicle Routing Problem (VRP) solver                          │
│  - Capacitated VRP (CVRP) with time windows                      │
│  - TSP for single-vehicle routes                                  │
│  - Dynamic re-routing on delivery failure/delay                   │
│  - Google OR-Tools as core solver                                 │
│  Runtime: Fargate (Python 3.12) | Memory: 4GB | CPU: 2 vCPU     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  fleet-service                                                   │
│  - Vehicle registry + capacity management                         │
│  - Driver assignment + availability tracking                      │
│  - Real-time position updates (via WebSocket)                     │
│  - Fuel and maintenance alerts                                    │
│  Runtime: Lambda (Node.js 22)                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  eta-service                                                     │
│  - Bedrock-powered ETA prediction                                 │
│  - Real-time recalculation on deviation                           │
│  - Traffic pattern learning from historical data                  │
│  - Customer-facing delivery notifications                         │
│  Runtime: Lambda (Python 3.12)                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  analytics-service                                               │
│  - Aggregation of delivery metrics                               │
│  - Heat map data generation                                      │
│  - Performance KPI calculation                                   │
│  - Athena queries for batch analytics                            │
│  - Looker Studio / QuickSight data source                        │
│  Runtime: Fargate (Python 3.12) + Athena (serverless SQL)        │
└─────────────────────────────────────────────────────────────────┘
```

### Inter-Service Communication

```
Synchronous (REST via API Gateway):
  Client → API Gateway → Lambda/Fargate

Asynchronous (EventBridge):
  address-service → bigeo.address.parsed → analytics-service
  route-optimizer → bigeo.route.optimized → fleet-service
  fleet-service   → bigeo.delivery.failed → eta-service (recalculate)

Queue (SQS FIFO):
  High-volume optimization requests → route-optimizer queue
  Batch geocoding jobs → address-service queue
```

---

## 9. AI/ML Pipeline

### 9.1 ETA Prediction (Production-ready on Bedrock)

```python
# Prompt engineering for Bedrock Claude Haiku (cheap + fast)
SYSTEM = """You are a logistics ETA prediction expert for Indian roads.
Given delivery parameters, predict the ETA in minutes.
Account for: rural road conditions, seasonal factors, local market days,
truck restrictions in urban areas, toll gates, and typical Indian traffic patterns.
Return JSON only."""

def predict_eta(params: dict) -> dict:
    prompt = f"""
    Predict delivery ETA for this route in India:
    - Origin: {params['origin_address']} ({params['origin_lat']}, {params['origin_lng']})
    - Destination: {params['dest_address']} ({params['dest_lat']}, {params['dest_lng']})
    - Distance: {params['distance_km']}km
    - Stops: {params['stops_count']}
    - Departure: {params['departure_time']} (day: {params['day_of_week']})
    - Vehicle: {params['vehicle_type']}
    - Weather: {params['weather']}
    - Historical avg for this route: {params['historical_avg_min']} min
    
    Return: {{"eta_minutes": int, "confidence": float, "risk_factors": [str]}}
    """
    # Call Bedrock Claude Haiku
```

### 9.2 Hub Demand Forecasting

```
Input (past 90 days per hub):
  - daily_volume[], weekly_pattern[], seasonal_index
  - special_events (market days, festivals, government schemes)
  - weather_impact_history

Bedrock Prompt Engineering:
  "Analyze this logistics demand time series and forecast next 7 days.
   Account for Indian agricultural seasonality and festival calendar."

Output:
  - Forecast: volume per hub for next 7 days
  - Confidence interval
  - Recommended pre-positioning of fleet
```

### 9.3 Delivery Failure Prediction

```
Features used (all from DynamoDB operational data):
  - delivery_attempt_count
  - address_confidence_score (from Vaahan)
  - time_of_day
  - day_of_week
  - customer_response_history
  - area_failure_rate (pincode-level)
  - distance_from_hub
  - weather_conditions

Prediction: P(failure) → flag risky deliveries for pre-call
Threshold: > 0.35 → auto-schedule customer confirmation call
```

### 9.4 ML Model Registry

```
Models (all Bedrock-powered, no SageMaker):
  bigeo-eta-v1        → Claude Haiku, updated monthly
  bigeo-failure-v1    → Claude Haiku with structured output
  bigeo-demand-v1     → Claude Sonnet for time-series reasoning
  bigeo-address-v2    → Gemini Flash + Claude hybrid

Training Data Pipeline:
  DynamoDB → Glue ETL → S3 (Parquet) → Athena (validation) → S3 (training set)
  Monthly batch update cycle (EventBridge cron)
```

---

## 10. Optimization Algorithms

### 10.1 Hub Placement — K-Means + Gravity Model

```
Algorithm:
1. Input: N delivery locations with lat/lng + volume weights
2. K-Means (weighted): cluster by geographic proximity + volume
3. Gravity adjustment: shift centroids toward road intersections
4. Feasibility check: population density, land availability, road access
5. Score each candidate: distance_score + cost_score + coverage_score
6. Output: top K hub recommendations with service zones

Parameters:
  K = max_hubs (user-specified or auto-detected via elbow method)
  Weight = daily_volume (heavier locations pull centroid)
  Convergence: < 0.1km centroid shift
  Max iterations: 300
```

### 10.2 Vehicle Routing Problem — OR-Tools CVRP

```
Problem formulation:
  Minimize: Σ distance(route) × fuel_cost/km
  Subject to:
    - Each delivery assigned exactly once
    - Vehicle capacity not exceeded (weight + volume)
    - Time windows satisfied (if specified)
    - Max route duration: 8 hours
    - Each route starts and ends at hub

Solver: Google OR-Tools CP-SAT / Routing Library
Time limit: 30 seconds for < 100 stops, 120s for > 100

Algorithm progression:
  1. Greedy initialization (nearest neighbor heuristic)
  2. Local search: 2-opt, 3-opt moves
  3. Large Neighborhood Search
  4. Guided Local Search metaheuristic

Result quality:
  < 20 stops: optimal solution
  20-100 stops: within 5% of optimal
  100-500 stops: within 15% of optimal (time-limited)
```

### 10.3 Real-Time Re-routing — Greedy Insertion

```
Trigger: delivery_failed OR vehicle_delayed > 30min

Algorithm:
  1. Extract remaining unvisited stops from affected route
  2. Calculate time windows remaining
  3. For each stop: score insertion cost in other routes
  4. Assign stops to best available routes/vehicles
  5. Re-sequence using 2-opt
  6. Publish updated routes via EventBridge

Latency target: < 5 seconds end-to-end
```

### 10.4 Algorithm Comparison Matrix

| Algorithm | Use Case | Stops | Quality | Speed | Cost |
|-----------|----------|-------|---------|-------|------|
| K-Means | Hub placement | Any | Good | Fast | $ |
| Nearest Neighbor | Quick routes | < 20 | Fair | Instant | $ |
| OR-Tools CVRP | Standard routing | 20-200 | Excellent | 30s | $$ |
| Genetic Algorithm | Complex constraints | 50-500 | Very Good | 2-5min | $$ |
| Simulated Annealing | Large fleets | 200-1000 | Good | 1-3min | $$ |
| RL (future) | Dynamic, real-time | Any | Excellent | Instant | $$$ |

---

## 11. Frontend Architecture

### 11.1 Next.js App Structure

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── overview/page.tsx          — KPI summary
│   │   ├── hubs/
│   │   │   ├── page.tsx               — Hub list
│   │   │   ├── [id]/page.tsx          — Hub detail
│   │   │   └── optimize/page.tsx      — Hub optimizer UI
│   │   ├── routes/
│   │   │   ├── page.tsx               — Route list
│   │   │   ├── [id]/page.tsx          — Route detail + map
│   │   │   └── optimize/page.tsx      — VRP optimizer UI
│   │   ├── fleet/page.tsx             — Vehicle registry
│   │   ├── deliveries/page.tsx        — Delivery tracking
│   │   ├── analytics/
│   │   │   ├── heatmap/page.tsx       — Delivery heatmap
│   │   │   ├── performance/page.tsx   — KPIs over time
│   │   │   └── costs/page.tsx         — Cost analysis
│   │   └── simulate/page.tsx          — Network simulator
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       └── proxy/[...path]/route.ts   — API proxy
├── components/
│   ├── ui/                            — ShadCN components
│   ├── maps/
│   │   ├── RouteMap.tsx               — Leaflet/Mapbox route viz
│   │   ├── HubMap.tsx                 — Hub placement map
│   │   ├── HeatMap.tsx                — Delivery density heat map
│   │   └── LiveTrackingMap.tsx        — Real-time vehicle positions
│   ├── optimization/
│   │   ├── HubOptimizer.tsx           — Hub optimization form + results
│   │   ├── RouteOptimizer.tsx         — VRP form + results
│   │   └── AlgorithmSelector.tsx      — Algorithm comparison UI
│   ├── analytics/
│   │   ├── KPICard.tsx
│   │   ├── TrendChart.tsx
│   │   └── CostBreakdown.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── CommandPalette.tsx
└── lib/
    ├── api.ts                         — API client
    ├── websocket.ts                   — Real-time connection
    └── optimization.ts                — Client-side utilities
```

### 11.2 Key UI Features

```
Map Components (Leaflet.js + OpenStreetMap — free, no API key needed):
  - Hub placement markers with service zone polygons
  - Route polylines with stop markers
  - Delivery heatmap overlay
  - Real-time vehicle position tracking
  - Click-to-geocode for address input

Optimization UI:
  - Drag-and-drop delivery location upload (CSV/Excel)
  - Real-time algorithm progress indicator
  - Side-by-side algorithm comparison
  - Cost/time trade-off slider
  - Export to PDF/Excel/JSON

Analytics:
  - Recharts for time series (lightweight, no license)
  - Framer Motion for animated KPI transitions
  - Mapbox GL or Leaflet.heat for density maps
```

---

## 12. Security Architecture

### 12.1 Defense in Depth

```
Layer 1 — Network (Cloudflare):
  - DDoS protection (Cloudflare Magic Transit)
  - WAF: OWASP Top 10 rules
  - Rate limiting: 1000/min per IP, 10000/min per customer
  - Bot protection: Turnstile on public endpoints
  - TLS 1.3 minimum

Layer 2 — API (API Gateway + Lambda Authorizer):
  - API key validation in Lambda authorizer
  - JWT validation for dashboard endpoints
  - Request size limits: 10MB max
  - Input sanitization in all Lambda handlers

Layer 3 — Compute (Lambda + Fargate):
  - No VPC (Lambda) — minimize attack surface for stateless compute
  - Fargate in private subnets (VPC) for optimization services
  - IAM roles: minimum privilege per function
  - Secrets in Secrets Manager (never env vars for sensitive data)

Layer 4 — Data (DynamoDB + S3):
  - DynamoDB: customer data isolated by customer_id partition key
  - S3: bucket policies + versioning + object lock for audit data
  - Encryption at rest: AWS KMS for all sensitive tables
  - DynamoDB Point-in-Time Recovery enabled

Layer 5 — Audit:
  - CloudTrail: all API calls logged
  - VPC Flow Logs (for Fargate)
  - CloudWatch Logs: all Lambda logs with structured JSON
  - GuardDuty: threat detection

Compliance:
  - Data residency: ap-south-1 only (India)
  - No PII in logs (phone/email masked)
  - DPDP Act (India) compliance via data minimization
```

### 12.2 Multi-Tenant Data Isolation

```
Strategy: Shared infrastructure + partition-key isolation

DynamoDB:
  Every item has customer_id as partition key prefix
  IAM condition: "dynamodb:LeadingKeys": "${cognito:sub}"
  Authorizer validates customer_id matches API key

S3:
  Prefix: s3://bigeo-data/{customer_id}/...
  Bucket policy: deny access to other customer prefixes

API:
  Customer context injected by authorizer into Lambda context
  Fargate: customer_id passed in request headers
```

---

## 13. AWS Cost Model

### MVP Cost (~₹15,000/month = ~$180/month)

| Service | Usage | Cost/month |
|---------|-------|------------|
| Lambda | 10M req/month × $0.0000002 | $2 |
| API Gateway v2 | 10M req × $1/M | $10 |
| DynamoDB on-demand | 50GB + 10M R/W | $25 |
| ElastiCache Serverless | 1GB cache | $15 |
| ECS Fargate | 2 tasks × 0.5 vCPU × 730h | $15 |
| Bedrock (Claude Haiku) | 5M tokens/month | $5 |
| Bedrock (Claude Sonnet) | 1M tokens/month | $15 |
| S3 | 100GB + transfers | $5 |
| CloudFront | 1TB transfer | $8 |
| CloudWatch | Logs + metrics | $5 |
| Secrets Manager | 5 secrets | $2 |
| SES | 10K emails | $1 |
| Misc (WAF, EventBridge) | | $10 |
| **TOTAL** | | **~$118/month** |

**AWS Credits cover 84+ months at MVP scale.**

### Scale Cost (~100K deliveries/day)

| Service | Usage | Cost/month |
|---------|-------|------------|
| Lambda | 300M req | $60 |
| API Gateway | 300M req | $300 |
| DynamoDB | 5TB + 500M R/W | $500 |
| ElastiCache | 50GB cluster | $150 |
| ECS Fargate | 10 tasks | $180 |
| EKS (optimizer) | 3 nodes t3.xlarge | $250 |
| Aurora Serverless v2 | 8 ACU avg | $200 |
| Bedrock | 100M tokens | $500 |
| OpenSearch Serverless | 4 OCU | $400 |
| CloudFront + S3 | 50TB transfer | $200 |
| **TOTAL** | | **~$2,740/month** |

---

## 14. 90-Day Execution Plan

### Sprint 0 (Days 1–7): Foundation
```
Infrastructure:
  ✓ Vaahan API (live — address parsing, auth, health, usage)
  ✓ GCP integration (Gemini Flash, Translation, BigQuery)
  ✓ DynamoDB tables (producers, pickups)
  → Deploy ElastiCache Serverless
  → Set up EventBridge bus: bigeo-logistics-events
  → Create Fargate cluster (ECS)
  → CI/CD pipeline (GitHub Actions → ECR → ECS)
  → Cloudflare Workers for edge routing

Deliverable: Deployable infrastructure scaffold
```

### Sprint 1 (Days 8–21): Core Optimization Engine
```
Backend:
  → Hub clustering service (K-means, Python)
  → Basic VRP solver (OR-Tools, single vehicle)
  → ETA prediction (Bedrock Haiku)
  → FastAPI gateway service on Fargate
  → /v2/hubs/optimize endpoint live

Deliverable: Working hub optimization API
```

### Sprint 2 (Days 22–42): VRP + Fleet
```
Backend:
  → CVRP solver (OR-Tools, multi-vehicle)
  → Fleet registry (vehicle + driver management)
  → Real-time re-routing on failure
  → Batch geocoding pipeline (S3 → Lambda → DynamoDB)
  → /v2/routes/optimize endpoint live

Frontend:
  → Next.js skeleton with auth (Cognito)
  → Map component (Leaflet + OpenStreetMap)
  → Basic route visualization

Deliverable: Multi-vehicle route optimization + basic dashboard
```

### Sprint 3 (Days 43–63): Dashboard + Analytics
```
Frontend:
  → Full dashboard with KPI cards
  → Route map with animated vehicles
  → Delivery heatmap
  → Optimization form (upload CSV → get optimized routes)
  → PDF report generation

Backend:
  → Analytics service (aggregation Lambda)
  → Athena queries for historical analysis
  → BigQuery sync (from DynamoDB)
  → WebSocket for real-time tracking

Deliverable: Customer-facing dashboard with live data
```

### Sprint 4 (Days 64–80): Network Simulator + Enterprise Features
```
  → What-if network simulation
  → Multi-customer tenant isolation
  → Billing integration (Razorpay/Stripe)
  → API documentation (auto-generated from FastAPI)
  → ONDC protocol adapter
  → CSV/Excel bulk import

Deliverable: Enterprise-ready, multi-tenant platform
```

### Sprint 5 (Days 81–90): Customer Onboarding + Sales
```
  → Onboarding flow (self-serve API key + dashboard access)
  → Pricing page and billing
  → Load testing (k6 — 1000 concurrent users)
  → Security penetration test
  → First 3 paying customers onboarded

Deliverable: Revenue-generating platform
```

---

## 15. Scaling to 100M Deliveries

### Phase 1: 0–10K deliveries/day (Current)
- Lambda + small Fargate (current setup)
- Single DynamoDB table design
- OR-Tools on Lambda (timeout: 30s)
- Single AWS region: ap-south-1

### Phase 2: 10K–100K deliveries/day
- ECS Fargate auto-scaling (target: 70% CPU)
- DynamoDB Global Tables for read replicas
- ElastiCache cluster (Multi-AZ)
- OpenSearch for analytics
- OR-Tools on dedicated Fargate tasks (4GB RAM, 2 vCPU)
- CloudFront + Cloudflare hybrid CDN

### Phase 3: 100K–1M deliveries/day
- EKS cluster for optimization workloads
- Aurora Serverless v2 + PostGIS for spatial
- Kinesis Data Streams for real-time telemetry
- Lambda@Edge for personalization
- Multi-region active-active (Mumbai + Singapore)
- Custom ML models on Bedrock fine-tuning

### Phase 4: 1M–100M deliveries/day
- Dedicated EKS per region (6 regions India)
- Custom routing AI (fine-tuned on BiGeo data)
- Apache Flink for stream processing
- Data mesh architecture per state/zone
- ₹0.01/delivery infrastructure cost target

---

## 16. Repository Structure

```
BiGeo/
├── vaahan/                        (existing — address intelligence API)
│   ├── parse-function/
│   ├── authorizer-function/
│   ├── register-function/
│   ├── usage-function/
│   ├── health-function/
│   ├── producer-webhook-function/
│   ├── daily-summary-function/
│   └── template.yaml
│
├── platform/                      (new — logistics optimization platform)
│   ├── apps/
│   │   ├── web/                   Next.js dashboard
│   │   └── docs/                  API documentation site
│   │
│   ├── services/
│   │   ├── api-gateway/           FastAPI main gateway
│   │   ├── hub-optimizer/         K-means + hub placement
│   │   ├── route-optimizer/       OR-Tools VRP solver
│   │   ├── fleet-service/         Vehicle + driver management
│   │   ├── eta-service/           Bedrock ETA prediction
│   │   └── analytics-service/     Metrics + reporting
│   │
│   ├── algorithms/                Core algorithm implementations
│   │   ├── vrp/                   Vehicle Routing Problem
│   │   ├── clustering/            K-means + geographic clustering
│   │   └── hub-spoke/             Hub-spoke optimization
│   │
│   ├── ml/
│   │   ├── eta-model/             ETA prediction pipeline
│   │   ├── demand-forecast/       Demand forecasting
│   │   └── failure-predict/       Delivery failure prediction
│   │
│   └── infrastructure/
│       ├── terraform/             AWS IaC
│       ├── cloudflare/            CF Workers + R2 + D1
│       └── docker/                Container definitions
│
├── gcp/                           Google Cloud integration
│   ├── bigquery-export/
│   ├── dialogflow/
│   └── setup/
│
├── portal/                        Marketing sites
│   ├── index.html                 Vaahan developer portal
│   └── bigeo-redesign.html        BiGeo corporate site
│
└── .github/
    └── workflows/
        ├── deploy-vaahan.yml      Vaahan API CI/CD
        ├── deploy-platform.yml    Platform CI/CD
        └── deploy-portal.yml      Portal CI/CD
```

---

## 17. CI/CD Pipeline

See `.github/workflows/deploy-platform.yml` — fully automated:
- Test → Build → ECR Push → ECS Deploy → Smoke Test → Rollback on failure

---

## 18. Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| OR-Tools timeout for large fleets (>200 vehicles) | Medium | High | Time-limit + warm-start from cached solution |
| Bedrock API rate limits during peak | Medium | Medium | Request queuing via SQS, Gemini fallback |
| DynamoDB hot partitions on popular hubs | Low | High | Write sharding with random suffix |
| Indian road data quality (OpenStreetMap) | High | Medium | Hybrid: OSM + HERE Maps API fallback |
| Map service costs (Google Maps) | Medium | Medium | Use Mapbox/HERE with free tier, OSM for backend |
| Lambda cold starts on optimization endpoints | Medium | Low | Keep-warm pings, move heavy work to Fargate |
| GCP credential rotation | Low | High | Secrets Manager auto-rotation + monitoring alarm |
| Customer data isolation breach | Low | Critical | IAM partition key conditions + automated testing |

---

## 19. Investor Summary

### Why BiGeo Wins

| Dimension | BiGeo | Competitors |
|-----------|-------|-------------|
| Rural address intelligence | **Native, proprietary graph** | Non-existent |
| AI model cost | Gemini Flash + Claude hybrid | Fixed tier |
| India-specific constraints | Built-in (mandals, tehsils, rural roads) | Generic global |
| ONDC readiness | Native protocol | Retrofit required |
| Data moat | Growing with every API call | Starts from zero |
| Time to first optimization | **< 2 minutes** via API | Days of onboarding |

### Technical Differentiation for Investors

```
1. Bharat Address Graph: proprietary dataset of 600M+ rural addresses
   → Grows automatically with every API call (network effect)
   → No competitor has rural India coverage

2. Hybrid AI routing: 
   → Gemini Flash for cost ($0.006/1K tokens)
   → Claude Sonnet for accuracy when needed
   → 10x cheaper than single-model approaches

3. Village-to-city logistics graph:
   → Built on real producer pickup data from Telangana pilot
   → Every delivery enriches the routing model

4. Serverless-first, zero fixed cost:
   → Zero infrastructure cost at zero load
   → Scales linearly with revenue
   → ₹200/month idle vs $5,000/month for competitors' servers
```
