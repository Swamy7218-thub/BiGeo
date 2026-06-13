# BiGeo Product Documentation

## Overview

BiGeo is Rural India's Last-Mile Operating System — an AI-powered address intelligence and logistics optimization platform purpose-built for the complexity of rural Indian geography. Where standard mapping tools fail on abbreviated, dialect-inflected, and landmark-based addresses common across India's 640,000+ villages, BiGeo understands context.

The platform combines Claude Sonnet's language understanding, HERE Maps routing data, Amazon Location Service geocoding, and a continuously growing village-level knowledge graph to deliver structured, actionable location intelligence to logistics operators, FMCG distributors, agri-input companies, pharma chains, and government agencies operating in Tier-3 and rural India.

---

## Core Problem Statement

Over 65% of India's population lives in villages and small towns. Yet most logistics and mapping software was designed for urban India. The result:

- A delivery driver in Telangana receives an address like "Ramprasad ke ghar ke paas, Narsapur mandal" and has no GPS path to follow.
- An FMCG distributor tries to optimize 200 delivery stops across 8 mandals but their routing tool treats all roads as paved highways.
- A pharma company wants to open a cold-chain hub but has no data on which mandal headquarters can serve the most villages within 30 km.

BiGeo solves all three problems with a single API stack.

---

## Product Modules

### 1. Address Parser
Converts unstructured, colloquial, multi-lingual rural addresses into structured geographic data.

### 2. Route Optimizer
Generates efficient delivery sequences across rural road networks, accounting for road quality, seasonal access, and vehicle type.

### 3. Hub Optimizer
Recommends optimal hub/warehouse placement given a set of delivery locations and coverage radius requirements.

### 4. ETA Predictor
Predicts realistic delivery ETAs factoring in rural road conditions, distance to nearest motorable road, mandal-level traffic patterns, and seasonal factors.

---

## Base URL

```
https://v34s17v3h2.execute-api.ap-south-1.amazonaws.com/v1
```

All endpoints are versioned under `/v1`. Future versions will be introduced as `/v2` with backwards compatibility guarantees for 18 months.

---

## Authentication

All requests require an API key passed in the `X-API-Key` header.

```http
X-API-Key: bge_live_xxxxxxxxxxxxxxxxxxxx
```

Test keys use the prefix `bge_test_` and operate against a sandbox environment with mocked geocoding responses. Test mode is rate-limited to 50 calls/day.

---

## API Endpoints

---

### POST /parse-address

Parses an unstructured rural Indian address string and returns structured geographic components including village, mandal, district, state, pincode, and GPS coordinates.

**Request**

```http
POST /parse-address
Content-Type: application/json
X-API-Key: bge_live_xxxxxxxxxxxxxxxxxxxx
```

```json
{
  "address": "Yellareddy palli village near bore well, Dubbak mandal, Siddipet dist, Telangana",
  "hint_district": "Siddipet",
  "hint_state": "Telangana",
  "language": "en"
}
```

**Request Fields**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `address` | string | Yes | Raw address string, any language or script |
| `hint_district` | string | No | Candidate district to narrow parsing |
| `hint_state` | string | No | State context to narrow parsing |
| `language` | string | No | ISO 639-1 code. Defaults to `auto` |
| `return_alternatives` | boolean | No | Return up to 3 candidate parses. Default false |

**Response**

```json
{
  "status": "success",
  "request_id": "req_01HXYZ1234567890ABCDEFGH",
  "parsed": {
    "raw_input": "Yellareddy palli village near bore well, Dubbak mandal, Siddipet dist, Telangana",
    "village": "Yellareddy Palli",
    "village_lgd_code": "574321",
    "hamlet": null,
    "landmark": "bore well",
    "mandal": "Dubbak",
    "mandal_lgd_code": "1234",
    "district": "Siddipet",
    "district_lgd_code": "543",
    "state": "Telangana",
    "state_code": "TS",
    "pincode": "502375",
    "coordinates": {
      "latitude": 17.9923,
      "longitude": 78.8512,
      "accuracy_meters": 250,
      "accuracy_level": "village_centroid"
    },
    "confidence_score": 0.91,
    "components_identified": ["village", "landmark", "mandal", "district", "state"],
    "components_missing": ["house_number", "street"],
    "normalization_notes": [
      "Expanded abbreviation 'dist' to 'district'",
      "Matched 'Yellareddy palli' to canonical village name 'Yellareddy Palli'",
      "Mandal confirmed via district-mandal hierarchy lookup"
    ]
  },
  "processing_time_ms": 312,
  "model_used": "claude-sonnet-4-5",
  "geocoder_used": "amazon_location_service"
}
```

**Confidence Score Interpretation**

| Score Range | Meaning |
|-------------|---------|
| 0.90 – 1.00 | High confidence. Village matched in BiGeo database with geocoordinates |
| 0.70 – 0.89 | Moderate confidence. Village inferred from mandal/district context |
| 0.50 – 0.69 | Low confidence. District or mandal identified but village uncertain |
| Below 0.50 | Very low confidence. Recommend human review |

**Accuracy Levels**

- `exact_door`: Precise door/plot coordinates (rare in rural India)
- `street_segment`: Within 50m of named street
- `village_centroid`: Village-level center point, ±250m typical
- `mandal_centroid`: Mandal-level fallback, ±2km typical
- `district_centroid`: District-level fallback, ±10km typical

---

### POST /optimize-route

Takes a list of delivery stops and returns an optimized sequence minimizing total travel time or distance on actual rural road networks.

**Request**

```http
POST /optimize-route
Content-Type: application/json
X-API-Key: bge_live_xxxxxxxxxxxxxxxxxxxx
```

```json
{
  "depot": {
    "name": "Siddipet Main Warehouse",
    "coordinates": {
      "latitude": 18.1016,
      "longitude": 78.8521
    }
  },
  "stops": [
    {
      "stop_id": "del_001",
      "address": "Chegunta village, Chegunta mandal, Medak",
      "time_window": {
        "earliest": "08:00",
        "latest": "13:00"
      },
      "service_time_minutes": 15,
      "priority": "high"
    },
    {
      "stop_id": "del_002",
      "address": "Narsapur town, Medak district",
      "time_window": {
        "earliest": "10:00",
        "latest": "17:00"
      },
      "service_time_minutes": 20,
      "priority": "normal"
    },
    {
      "stop_id": "del_003",
      "address": "Toopran mandal HQ, Medak",
      "time_window": null,
      "service_time_minutes": 10,
      "priority": "normal"
    }
  ],
  "vehicle": {
    "type": "tempo",
    "max_stops": 25,
    "start_time": "07:30",
    "max_route_hours": 10
  },
  "optimize_for": "time",
  "road_quality_aware": true,
  "return_to_depot": true
}
```

**Request Fields**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `depot` | object | Yes | Starting location with name and coordinates |
| `stops` | array | Yes | List of delivery stops (max 100 per request on Growth plan) |
| `vehicle.type` | string | Yes | `bike`, `auto`, `tempo`, `truck` |
| `optimize_for` | string | No | `time` (default) or `distance` |
| `road_quality_aware` | boolean | No | Apply rural road penalty factors. Default true |
| `return_to_depot` | boolean | No | Route ends at depot. Default true |

**Response**

```json
{
  "status": "success",
  "request_id": "req_01HXYZ9876543210FEDCBA98",
  "route": {
    "optimized_sequence": [
      {
        "sequence": 1,
        "stop_id": "depot_start",
        "name": "Siddipet Main Warehouse",
        "arrival_time": "07:30",
        "departure_time": "07:30",
        "driving_time_from_prev_minutes": 0,
        "distance_from_prev_km": 0
      },
      {
        "sequence": 2,
        "stop_id": "del_003",
        "address_parsed": "Toopran, Medak",
        "coordinates": { "latitude": 17.5312, "longitude": 78.2841 },
        "arrival_time": "08:45",
        "departure_time": "08:55",
        "driving_time_from_prev_minutes": 75,
        "distance_from_prev_km": 52.3,
        "road_quality": "mixed_paved_kachcha",
        "road_quality_penalty_applied": 1.3
      },
      {
        "sequence": 3,
        "stop_id": "del_001",
        "address_parsed": "Chegunta, Medak",
        "coordinates": { "latitude": 17.6102, "longitude": 78.1983 },
        "arrival_time": "09:42",
        "departure_time": "09:57",
        "driving_time_from_prev_minutes": 47,
        "distance_from_prev_km": 31.1,
        "road_quality": "paved_state_highway",
        "road_quality_penalty_applied": 1.0
      },
      {
        "sequence": 4,
        "stop_id": "del_002",
        "address_parsed": "Narsapur, Medak",
        "coordinates": { "latitude": 17.7301, "longitude": 78.2812 },
        "arrival_time": "10:51",
        "departure_time": "11:11",
        "driving_time_from_prev_minutes": 54,
        "distance_from_prev_km": 38.7,
        "road_quality": "paved_state_highway",
        "road_quality_penalty_applied": 1.0
      },
      {
        "sequence": 5,
        "stop_id": "depot_end",
        "name": "Siddipet Main Warehouse",
        "arrival_time": "13:20",
        "departure_time": null,
        "driving_time_from_prev_minutes": 129,
        "distance_from_prev_km": 89.4
      }
    ],
    "summary": {
      "total_stops": 3,
      "total_distance_km": 211.5,
      "total_driving_time_minutes": 305,
      "total_service_time_minutes": 45,
      "total_route_time_minutes": 350,
      "estimated_completion_time": "13:20",
      "all_time_windows_met": true,
      "time_window_violations": []
    },
    "savings_vs_naive": {
      "distance_saved_km": 41.2,
      "time_saved_minutes": 68
    }
  },
  "processing_time_ms": 891,
  "routing_engine": "here_maps_matrix_routing"
}
```

---

### POST /optimize-hubs

Given a set of village delivery locations, recommends optimal hub placements to minimize average delivery distance and maximize coverage.

**Request**

```http
POST /optimize-hubs
Content-Type: application/json
X-API-Key: bge_live_xxxxxxxxxxxxxxxxxxxx
```

```json
{
  "delivery_locations": [
    { "village": "Gajwel", "mandal": "Gajwel", "district": "Siddipet", "monthly_orders": 450 },
    { "village": "Mulugu", "mandal": "Mulugu", "district": "Siddipet", "monthly_orders": 120 },
    { "village": "Wargal", "mandal": "Wargal", "district": "Siddipet", "monthly_orders": 340 },
    { "village": "Kohir", "mandal": "Kohir", "district": "Sangareddy", "monthly_orders": 210 },
    { "village": "Narayankhed", "mandal": "Narayankhed", "district": "Sangareddy", "monthly_orders": 180 }
  ],
  "constraints": {
    "max_hubs": 2,
    "max_coverage_radius_km": 50,
    "must_be_mandal_hq": true,
    "road_access_required": "motorable_year_round"
  },
  "optimize_for": "coverage_weighted_by_volume"
}
```

**Response**

```json
{
  "status": "success",
  "request_id": "req_01HXYZABCDEF1234567890AB",
  "recommended_hubs": [
    {
      "rank": 1,
      "location": "Gajwel",
      "mandal": "Gajwel",
      "district": "Siddipet",
      "coordinates": { "latitude": 17.9923, "longitude": 78.6731 },
      "is_mandal_hq": true,
      "coverage_villages": ["Gajwel", "Mulugu", "Wargal"],
      "villages_within_50km": 34,
      "monthly_orders_covered": 910,
      "coverage_percentage": 70.2,
      "road_access_quality": "state_highway_connected",
      "hub_score": 0.88
    },
    {
      "rank": 2,
      "location": "Narayankhed",
      "mandal": "Narayankhed",
      "district": "Sangareddy",
      "coordinates": { "latitude": 17.7423, "longitude": 77.6891 },
      "is_mandal_hq": true,
      "coverage_villages": ["Kohir", "Narayankhed"],
      "villages_within_50km": 28,
      "monthly_orders_covered": 390,
      "coverage_percentage": 30.1,
      "road_access_quality": "state_highway_connected",
      "hub_score": 0.81
    }
  ],
  "combined_coverage": {
    "total_villages_covered": 62,
    "total_monthly_orders_covered": 1300,
    "coverage_percentage": 100.0,
    "average_distance_to_hub_km": 18.4
  },
  "processing_time_ms": 1240
}
```

---

### POST /predict-eta

Predicts realistic delivery ETA for a single origin-destination pair, accounting for rural road conditions, current season, and time of day.

**Request**

```http
POST /predict-eta
Content-Type: application/json
X-API-Key: bge_live_xxxxxxxxxxxxxxxxxxxx
```

```json
{
  "origin": {
    "name": "Siddipet Hub",
    "coordinates": { "latitude": 18.1016, "longitude": 78.8521 }
  },
  "destination": {
    "address": "Cheriyal village, Husnabad mandal, Siddipet"
  },
  "vehicle_type": "tempo",
  "departure_datetime": "2025-08-15T09:00:00+05:30",
  "include_seasonal_adjustment": true
}
```

**Response**

```json
{
  "status": "success",
  "request_id": "req_01HXYZQWERTY0987654321ZZ",
  "eta": {
    "estimated_travel_time_minutes": 94,
    "estimated_arrival": "2025-08-15T10:34:00+05:30",
    "distance_km": 61.2,
    "route_summary": {
      "highway_km": 38.1,
      "state_road_km": 15.4,
      "village_road_km": 7.7
    },
    "seasonal_factor": {
      "season": "kharif_monsoon",
      "adjustment_applied": 1.25,
      "reason": "Monsoon season — village roads in Husnabad mandal may have reduced passability. August is peak Kharif season with increased agricultural traffic."
    },
    "confidence": "medium",
    "alternate_route_available": false,
    "notes": [
      "Last 7.7 km on village road — recommend confirming road condition before dispatch",
      "Husnabad mandal receives high rainfall in August. Allow 15-minute buffer."
    ]
  },
  "processing_time_ms": 445
}
```

---

### GET /health

Returns API health status and live system statistics.

**Request**

```http
GET /health
X-API-Key: bge_live_xxxxxxxxxxxxxxxxxxxx
```

**Response**

```json
{
  "status": "healthy",
  "timestamp": "2025-06-13T10:22:00Z",
  "region": "ap-south-1",
  "stats": {
    "addresses_parsed_total": 112,
    "districts_covered": 3,
    "villages_in_database": 4821,
    "parse_accuracy_rate": 0.94,
    "avg_response_time_ms": 387
  },
  "services": {
    "lambda": "operational",
    "dynamodb": "operational",
    "claude_api": "operational",
    "here_maps": "operational",
    "amazon_location_service": "operational"
  },
  "current_coverage": [
    "Siddipet, Telangana",
    "Medak, Telangana",
    "Sangareddy, Telangana"
  ]
}
```

---

### GET /districts

Returns list of currently supported districts with coverage metadata.

**Response**

```json
{
  "status": "success",
  "districts": [
    {
      "name": "Siddipet",
      "state": "Telangana",
      "mandals_covered": 26,
      "villages_in_database": 1847,
      "coverage_status": "full",
      "added_date": "2025-01-15"
    },
    {
      "name": "Medak",
      "state": "Telangana",
      "mandals_covered": 26,
      "villages_in_database": 1621,
      "coverage_status": "full",
      "added_date": "2025-02-01"
    },
    {
      "name": "Sangareddy",
      "state": "Telangana",
      "mandals_covered": 26,
      "villages_in_database": 1353,
      "coverage_status": "full",
      "added_date": "2025-03-10"
    }
  ],
  "total_districts": 3,
  "expansion_pipeline": ["Nizamabad", "Karimnagar", "Nalgonda", "Warangal Urban"]
}
```

---

## Error Codes

| HTTP Code | Error Code | Description |
|-----------|------------|-------------|
| 400 | `INVALID_ADDRESS` | Address string is empty or unparseable |
| 400 | `MISSING_REQUIRED_FIELD` | Required request field not provided |
| 401 | `INVALID_API_KEY` | API key not found or revoked |
| 403 | `PLAN_LIMIT_EXCEEDED` | Monthly call quota exhausted |
| 404 | `DISTRICT_NOT_COVERED` | Requested district not in coverage area |
| 422 | `GEOCODING_FAILED` | Address parsed but coordinates could not be resolved |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests per minute (60 req/min limit) |
| 500 | `INTERNAL_ERROR` | Server error — contact support |
| 503 | `SERVICE_UNAVAILABLE` | Downstream service (HERE Maps, Amazon Location) temporarily unavailable |

---

## Tech Stack

### Compute
- **AWS Lambda** — All API endpoints run as serverless functions in `ap-south-1` (Mumbai). Cold start optimized to under 800ms via provisioned concurrency on the address parser endpoint.
- **API Gateway** — REST API management, throttling, and API key validation.

### AI / Language Understanding
- **Claude Sonnet (claude-sonnet-4-5)** — Powers address parsing NLU. Receives raw address strings and a structured system prompt containing the BiGeo village knowledge graph for the target district. Returns structured JSON with village, mandal, district, landmark extractions.
- Model temperature: 0.1 (low, for consistency in extraction tasks)
- Context window usage: ~2,000 tokens per parse request (system prompt + address + response)

### Mapping and Geocoding
- **HERE Maps Routing API** — Matrix routing for route optimization. Used for distance/time calculations between stop pairs.
- **HERE Maps Geocoding** — Fallback geocoding for known place names.
- **Amazon Location Service** — Primary geocoding service. Used for village centroid resolution and address-to-coordinate conversion.

### Database
- **Amazon DynamoDB** — Stores the village knowledge graph (villages, mandals, districts, pincodes, LGD codes, coordinates). Table design:
  - Partition key: `district#mandal`
  - Sort key: `village_name`
  - GSI on pincode for pincode-based lookups
  - GSI on LGD code for government data cross-referencing

### Monitoring and Observability
- **AWS CloudWatch** — Lambda function logs, API Gateway access logs, custom metrics for parse accuracy tracking.
- **AWS X-Ray** — Distributed tracing across Lambda → DynamoDB → external API calls.

### Infrastructure as Code
- **AWS CDK (TypeScript)** — All infrastructure defined in code.
- **GitHub Actions** — CI/CD pipeline. Push to `main` triggers CDK deploy to production.

---

## Pricing Plans

### Free Tier
- **Cost**: ₹0/month forever
- **API calls**: 500 calls/month across all endpoints
- **Rate limit**: 10 requests/minute
- **Districts**: All currently live districts (Siddipet, Medak, Sangareddy)
- **Support**: Community (GitHub Issues)
- **SLA**: None
- **Ideal for**: Developers evaluating BiGeo, small NGOs, academic researchers

### Growth Plan
- **Cost**: ₹2,999/month (approximately $36 USD)
- **API calls**: 10,000 calls/month
- **Overage**: ₹0.40 per additional call
- **Rate limit**: 60 requests/minute
- **Max stops per route**: 100
- **Districts**: All live districts + early access to new districts
- **Support**: Email within 24 hours
- **SLA**: 99.5% uptime
- **Additional features**:
  - Batch address parsing (up to 50 addresses per request)
  - Route optimization with time windows
  - Hub optimizer access
  - Monthly usage analytics dashboard
- **Ideal for**: FMCG distributors, agri-input dealers, logistics startups

### Enterprise Plan
- **Cost**: Custom pricing (contact sales@bigeo.in)
- **API calls**: Unlimited
- **Rate limit**: Custom (up to 500 req/min)
- **Districts**: All live + priority onboarding of target districts
- **Support**: Dedicated Slack channel + phone support
- **SLA**: 99.9% uptime with financial penalties
- **Additional features**:
  - Custom model fine-tuning on proprietary address corpus
  - On-premises deployment option (VPC-only Lambda)
  - White-label API under customer domain
  - Custom DynamoDB tables for proprietary village data
  - Webhooks for real-time route status updates
  - ERP/WMS integration support (SAP, Oracle, Unicommerce)
  - Quarterly business reviews
- **Ideal for**: Large FMCG companies (HUL, ITC), pharma distributors, state government logistics agencies

---

## Live System Statistics

As of June 2025:

| Metric | Value |
|--------|-------|
| Total addresses parsed | 112 |
| Districts covered | 3 |
| Mandals covered | 78 |
| Villages in database | 4,821 |
| Parse accuracy rate | 94% |
| Average response time | 387ms |
| AWS region | ap-south-1 (Mumbai) |
| Uptime (30-day) | 99.7% |

---

## SDK and Integration

### cURL Example

```bash
curl -X POST https://v34s17v3h2.execute-api.ap-south-1.amazonaws.com/v1/parse-address \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bge_live_xxxxxxxxxxxxxxxxxxxx" \
  -d '{
    "address": "Doultabad village, Doultabad mandal, Medak",
    "hint_district": "Medak"
  }'
```

### Python Example

```python
import requests

BASE_URL = "https://v34s17v3h2.execute-api.ap-south-1.amazonaws.com/v1"
API_KEY = "bge_live_xxxxxxxxxxxxxxxxxxxx"

def parse_address(address, hint_district=None):
    payload = {"address": address}
    if hint_district:
        payload["hint_district"] = hint_district
    
    response = requests.post(
        f"{BASE_URL}/parse-address",
        json=payload,
        headers={"X-API-Key": API_KEY}
    )
    response.raise_for_status()
    return response.json()

result = parse_address("Kondapur village, Mulugu mandal, Siddipet")
print(f"Village: {result['parsed']['village']}")
print(f"Coordinates: {result['parsed']['coordinates']}")
print(f"Confidence: {result['parsed']['confidence_score']}")
```

### Node.js Example

```javascript
const axios = require('axios');

const BASE_URL = 'https://v34s17v3h2.execute-api.ap-south-1.amazonaws.com/v1';
const API_KEY = 'bge_live_xxxxxxxxxxxxxxxxxxxx';

async function parseAddress(address, hintDistrict) {
  const response = await axios.post(
    `${BASE_URL}/parse-address`,
    { address, hint_district: hintDistrict },
    { headers: { 'X-API-Key': API_KEY } }
  );
  return response.data;
}

parseAddress('Wargal temple road, Wargal mandal, Siddipet', 'Siddipet')
  .then(result => {
    console.log('Village:', result.parsed.village);
    console.log('Mandal:', result.parsed.mandal);
    console.log('Pincode:', result.parsed.pincode);
  });
```

### WhatsApp Integration

BiGeo exposes a WhatsApp Business webhook that allows field delivery agents to submit addresses via WhatsApp message and receive structured location data in return. Contact sales@bigeo.in for WhatsApp API credentials.

---

## Webhook Support (Enterprise)

Enterprise customers can configure webhooks to receive real-time notifications:

- `address.parsed` — Fires after each successful address parse
- `route.optimized` — Fires when a route optimization completes
- `batch.completed` — Fires when a batch parsing job finishes

Webhook payloads are signed with HMAC-SHA256 using a customer-specific secret.

---

## Contact

- **Website**: bigeo.in
- **API Support**: api-support@bigeo.in
- **Sales**: sales@bigeo.in
- **Admin / Investor Contact**: admin@bigeo.in
- **GitHub**: github.com/bigeo-in
- **Region**: Hyderabad, Telangana, India
