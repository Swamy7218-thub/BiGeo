# India Address Graph

Production-ready geocoding + PIN code hierarchy service for India.
Built with FastAPI + PostgreSQL/PostGIS.

## Project Structure

```
india-address-graph/
├── app/
│   ├── config/         # Pydantic Settings
│   ├── models/         # SQLAlchemy ORM models
│   ├── schemas/        # Pydantic request/response schemas
│   ├── routes/         # FastAPI routers
│   ├── services/       # Business logic (DB, search, geocode)
│   └── main.py         # App entry point
├── etl/
│   ├── load_pincodes.py   # Ingest pincode CSV
│   └── load_localities.py # Ingest village/town CSV
├── migrations/
│   └── versions/0001_initial_schema.py
├── tests/
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## Quick Start (Docker Compose)

```bash
# 1. Clone and enter directory
git clone <repo> && cd india-address-graph

# 2. Start Postgres + PostGIS + API
docker-compose up -d

# 3. Wait ~10s for DB to be ready, then check health
curl http://localhost:8000/health
# {"status":"ok","db":"ok","version":"1.0.0","environment":"development"}

# 4. Open interactive docs
open http://localhost:8000/docs
```

The container auto-runs `alembic upgrade head` on startup — no manual migration step needed.

## Load Pincode Data

Download one of the supported CSV datasets:

```bash
# Option A: deep5050/indian-pincodes-database
curl -L https://raw.githubusercontent.com/deep5050/indian-pincodes-database/main/india2.csv \
     -o data/pincodes.csv

# Option B: any CSV with columns matching the schema in etl/load_pincodes.py
```

Run ETL inside the running container:

```bash
docker-compose exec api python -m etl.load_pincodes --input data/pincodes.csv --batch 500
```

Or run dry-run first to validate:

```bash
docker-compose exec api python -m etl.load_pincodes --input data/pincodes.csv --dry-run
```

## Load Localities (Villages/Towns)

Prepare a CSV with columns: `state, district, subdistrict, locality_name, type, lat, lon`

```bash
docker-compose exec api python -m etl.load_localities --input data/localities.csv
```

## API Examples

### Health check
```bash
curl http://localhost:8000/health
```

### PIN code lookup
```bash
curl http://localhost:8000/api/v1/pincode/502313
# Returns primary post office + state/district/subdistrict names + lat/lon
```

### All post offices for a PIN
```bash
curl http://localhost:8000/api/v1/pincode/502313/offices
```

### Locality search
```bash
curl "http://localhost:8000/api/v1/search/localities?q=Narsapur&state_id=1&page=1"
```

### Forward geocode
```bash
curl -X POST http://localhost:8000/api/v1/geocode \
  -H "Content-Type: application/json" \
  -d '{"address": "H.No 3-12, near Govt School, Narsapur, Medak, Telangana 502313"}'
```

Response:
```json
{
  "pincode": "502313",
  "state": "Telangana",
  "district": "Medak",
  "subdistrict": "Narsapur",
  "locality": "Narsapur",
  "house": "3-12",
  "landmark": "Govt School",
  "street": null,
  "lat": 17.698,
  "lon": 78.281,
  "confidence": 0.75,
  "resolution_level": "locality_match"
}
```

### Reverse geocode
```bash
curl "http://localhost:8000/api/v1/reverse-geocode?lat=17.698&lon=78.281"
```

Response:
```json
{
  "lat": 17.698,
  "lon": 78.281,
  "state": "Telangana",
  "state_id": 1,
  "district": "Medak",
  "district_id": 42,
  "subdistrict": "Narsapur",
  "subdistrict_id": 301,
  "locality": "Narsapur",
  "locality_id": 8821,
  "pincode": "502313",
  "pincode_id": 15220,
  "distance_to_locality_m": 124.5
}
```

## AWS Deployment (ECS Fargate)

1. **ECR** — Push Docker image:
   ```bash
   aws ecr create-repository --repository-name india-address-graph
   docker build -t india-address-graph .
   docker tag india-address-graph:latest <ACCOUNT>.dkr.ecr.ap-south-1.amazonaws.com/india-address-graph:latest
   docker push <ACCOUNT>.dkr.ecr.ap-south-1.amazonaws.com/india-address-graph:latest
   ```

2. **RDS** — Create `db.t3.medium` Aurora PostgreSQL with PostGIS extension:
   ```sql
   CREATE EXTENSION postgis;
   CREATE EXTENSION pg_trgm;
   ```

3. **ECS Fargate** — Task definition: 1 vCPU / 2 GB RAM. Set `DATABASE_URL` in task environment.

4. **ALB** — Attach Application Load Balancer targeting port 8000.

### Cost estimate (ap-south-1, 24/7)
| Resource | Spec | $/month |
|---|---|---|
| ECS Fargate | 1 vCPU, 2 GB | ~$30 |
| RDS Aurora Serverless v2 | 0.5–2 ACU | ~$40 |
| ALB | — | ~$20 |
| **Total** | | **~$90/mo** |

Well within the $10,000 AWS credit budget.

## Running Tests

```bash
pip install pytest
pytest tests/ -v
```

## Design Notes / Assumptions

- **No Elasticsearch in v1.** Trigram GIN indexes (`pg_trgm`) give ~80% of the search quality at 0% of the operational overhead. Upgrade to OpenSearch if you need phonetic matching (Soundex/Metaphone for Indic names).
- **Forward geocode is rule-based.** PIN → hierarchy → locality fuzzy match. Accuracy improves as you load more localities. Upgrade path: integrate with BiGeo VAAHAN API for LLM-backed resolution.
- **Reverse geocode requires polygon geometry.** The initial `states/districts/subdistricts` tables land with `geom = NULL` until you load shapefiles (e.g., from `india-geodata` or `Bharat Maps`). Point-in-polygon containment returns null until then; KNN for nearest pincode/locality works immediately after loading coordinates.
- **Pincode uniqueness** is `(code, officename)` because the same 6-digit code can have multiple post offices (SO, BO branches).
- **ETL is idempotent.** Re-running with the same CSV is safe — all inserts use `ON CONFLICT DO UPDATE`.
