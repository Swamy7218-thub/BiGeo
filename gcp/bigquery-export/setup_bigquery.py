#!/usr/bin/env python3
"""
BiGeo BigQuery Setup + DynamoDB Export
Run this after configuring GCP credentials.

Usage:
  python3 setup_bigquery.py --setup          # Create dataset + tables
  python3 setup_bigquery.py --export         # Export DynamoDB → BigQuery
  python3 setup_bigquery.py --setup --export # Do both
"""

import json
import argparse
import sys
from datetime import datetime

# Google Cloud
from google.cloud import bigquery
from google.oauth2 import service_account

# AWS
import boto3
from boto3.dynamodb.conditions import Key

GCP_PROJECT = "bigeo-491617"
DATASET = "bigeo_analytics"
GCP_CREDENTIALS_FILE = "gcp-key.json"  # Path to your downloaded service account JSON

AWS_REGION = "ap-south-1"
ADDRESS_TABLE = "bigeo-address-graph"
KEYS_TABLE = "bigeo-api-keys"

# ── Schema definitions ──

ADDRESS_SCHEMA = [
    bigquery.SchemaField("pk", "STRING", description="DynamoDB PK (HASH#... or DISTRICT#...)"),
    bigquery.SchemaField("sk", "STRING", description="DynamoDB SK"),
    bigquery.SchemaField("input_address", "STRING"),
    bigquery.SchemaField("structured_address", "STRING"),
    bigquery.SchemaField("village", "STRING"),
    bigquery.SchemaField("mandal", "STRING"),
    bigquery.SchemaField("district", "STRING"),
    bigquery.SchemaField("state", "STRING"),
    bigquery.SchemaField("pincode", "STRING"),
    bigquery.SchemaField("lat", "FLOAT64"),
    bigquery.SchemaField("lng", "FLOAT64"),
    bigquery.SchemaField("confidence_score", "FLOAT64"),
    bigquery.SchemaField("model_used", "STRING"),
    bigquery.SchemaField("detected_language", "STRING"),
    bigquery.SchemaField("created_at", "TIMESTAMP"),
    bigquery.SchemaField("source", "STRING"),
]

API_KEYS_SCHEMA = [
    bigquery.SchemaField("pk", "STRING"),
    bigquery.SchemaField("company_name", "STRING"),
    bigquery.SchemaField("email", "STRING"),
    bigquery.SchemaField("status", "STRING"),
    bigquery.SchemaField("calls_this_month", "INTEGER"),
    bigquery.SchemaField("month_key", "STRING"),
    bigquery.SchemaField("last_used_at", "TIMESTAMP"),
    bigquery.SchemaField("created_at", "TIMESTAMP"),
]

DAILY_METRICS_SCHEMA = [
    bigquery.SchemaField("date", "DATE"),
    bigquery.SchemaField("total_calls", "INTEGER"),
    bigquery.SchemaField("cache_hits", "INTEGER"),
    bigquery.SchemaField("gemini_calls", "INTEGER"),
    bigquery.SchemaField("claude_calls", "INTEGER"),
    bigquery.SchemaField("avg_latency_ms", "FLOAT64"),
    bigquery.SchemaField("error_count", "INTEGER"),
    bigquery.SchemaField("unique_districts", "INTEGER"),
    bigquery.SchemaField("new_addresses_cached", "INTEGER"),
]


def setup_bigquery(client: bigquery.Client):
    """Create dataset and tables."""
    print(f"\n🔧 Setting up BigQuery dataset: {DATASET}")

    # Create dataset
    dataset_ref = bigquery.Dataset(f"{GCP_PROJECT}.{DATASET}")
    dataset_ref.location = "asia-south1"
    dataset_ref.description = "BiGeo analytics — address graph, API usage, daily metrics"
    dataset_ref.labels = {"project": "bigeo", "env": "prod"}

    try:
        dataset = client.create_dataset(dataset_ref, exists_ok=True)
        print(f"  ✓ Dataset: {dataset.dataset_id} in {dataset.location}")
    except Exception as e:
        print(f"  ✗ Dataset error: {e}")
        return False

    # Create tables
    tables = [
        ("address_graph", ADDRESS_SCHEMA, "All resolved addresses from the Bharat Address Graph"),
        ("api_keys", API_KEYS_SCHEMA, "Registered API keys and usage"),
        ("daily_metrics", DAILY_METRICS_SCHEMA, "Daily aggregated API metrics"),
    ]

    for table_name, schema, description in tables:
        table_ref = f"{GCP_PROJECT}.{DATASET}.{table_name}"
        table = bigquery.Table(table_ref, schema=schema)
        table.description = description
        table.labels = {"project": "bigeo"}

        # Partition daily_metrics by date
        if table_name == "daily_metrics":
            table.time_partitioning = bigquery.TimePartitioning(
                type_=bigquery.TimePartitioningType.DAY, field="date"
            )
        if table_name == "address_graph":
            table.time_partitioning = bigquery.TimePartitioning(
                type_=bigquery.TimePartitioningType.DAY, field="created_at"
            )

        try:
            t = client.create_table(table, exists_ok=True)
            print(f"  ✓ Table: {t.table_id}")
        except Exception as e:
            print(f"  ✗ Table {table_name} error: {e}")

    print("  ✓ BigQuery setup complete")
    return True


def scan_dynamodb_table(table_name: str):
    """Full scan of a DynamoDB table, handling pagination."""
    dynamo = boto3.resource("dynamodb", region_name=AWS_REGION)
    table = dynamo.Table(table_name)
    items = []
    response = table.scan()
    items.extend(response.get("Items", []))
    while "LastEvaluatedKey" in response:
        response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
        items.extend(response.get("Items", []))
    return items


def clean_address_item(item: dict) -> dict:
    """Convert DynamoDB item to BigQuery row."""
    def safe_float(v):
        try: return float(v)
        except: return None

    def safe_ts(v):
        if not v: return None
        try: return v if "T" in str(v) else None
        except: return None

    return {
        "pk": str(item.get("PK", "")),
        "sk": str(item.get("SK", "")),
        "input_address": str(item.get("input_address", "")),
        "structured_address": str(item.get("structured_address", "")),
        "village": str(item.get("village", "")),
        "mandal": str(item.get("mandal", "")),
        "district": str(item.get("district", "")),
        "state": str(item.get("state", "")),
        "pincode": str(item.get("pincode", "")) if item.get("pincode") else None,
        "lat": safe_float(item.get("lat")),
        "lng": safe_float(item.get("lng")),
        "confidence_score": safe_float(item.get("confidence_score")),
        "model_used": str(item.get("model_used", "unknown")),
        "detected_language": str(item.get("detected_language", "en")),
        "created_at": safe_ts(item.get("created_at")),
        "source": str(item.get("source", "ai")),
    }


def clean_key_item(item: dict) -> dict:
    def safe_int(v):
        try: return int(v)
        except: return 0
    def safe_ts(v):
        if not v: return None
        try: return v if "T" in str(v) else None
        except: return None

    return {
        "pk": str(item.get("PK", "")),
        "company_name": str(item.get("company_name", "")),
        "email": str(item.get("email", "")),
        "status": str(item.get("status", "active")),
        "calls_this_month": safe_int(item.get("calls_this_month", 0)),
        "month_key": str(item.get("month_key", "")),
        "last_used_at": safe_ts(item.get("last_used_at")),
        "created_at": safe_ts(item.get("created_at")),
    }


def export_to_bigquery(client: bigquery.Client):
    """Export both DynamoDB tables to BigQuery."""
    print(f"\n📤 Exporting DynamoDB → BigQuery")

    # Export address graph
    print(f"  Scanning {ADDRESS_TABLE}...")
    try:
        items = scan_dynamodb_table(ADDRESS_TABLE)
        print(f"  Found {len(items)} items")
        rows = [clean_address_item(i) for i in items if i.get("PK", "").startswith("HASH#")]
        print(f"  Filtered to {len(rows)} parsed address records")
        if rows:
            errors = client.insert_rows_json(
                f"{GCP_PROJECT}.{DATASET}.address_graph", rows
            )
            if errors:
                print(f"  ⚠ Insert errors: {errors[:3]}")
            else:
                print(f"  ✓ Inserted {len(rows)} address records")
    except Exception as e:
        print(f"  ✗ Address export error: {e}")

    # Export API keys (masked)
    print(f"  Scanning {KEYS_TABLE}...")
    try:
        items = scan_dynamodb_table(KEYS_TABLE)
        rows = [clean_key_item(i) for i in items if i.get("PK", "").startswith("KEY#")]
        print(f"  Found {len(rows)} API key records")
        if rows:
            errors = client.insert_rows_json(
                f"{GCP_PROJECT}.{DATASET}.api_keys", rows
            )
            if errors:
                print(f"  ⚠ Insert errors: {errors[:3]}")
            else:
                print(f"  ✓ Inserted {len(rows)} key records")
    except Exception as e:
        print(f"  ✗ Keys export error: {e}")

    print("  ✓ Export complete")


def print_useful_queries():
    print(f"""
📊 Useful BigQuery queries (run at console.cloud.google.com/bigquery):

-- Top districts by address count
SELECT district, COUNT(*) as count
FROM `{GCP_PROJECT}.{DATASET}.address_graph`
WHERE district IS NOT NULL AND district != ''
GROUP BY district ORDER BY count DESC LIMIT 20;

-- API usage by company
SELECT company_name, email, calls_this_month, status
FROM `{GCP_PROJECT}.{DATASET}.api_keys`
ORDER BY calls_this_month DESC;

-- Model usage breakdown
SELECT model_used, COUNT(*) as count, AVG(confidence_score) as avg_confidence
FROM `{GCP_PROJECT}.{DATASET}.address_graph`
GROUP BY model_used;

-- Language distribution (non-English input)
SELECT detected_language, COUNT(*) as count
FROM `{GCP_PROJECT}.{DATASET}.address_graph`
WHERE detected_language != 'en' AND detected_language IS NOT NULL
GROUP BY detected_language ORDER BY count DESC;
""")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="BiGeo BigQuery setup and export")
    parser.add_argument("--setup", action="store_true", help="Create BQ dataset and tables")
    parser.add_argument("--export", action="store_true", help="Export DynamoDB data to BigQuery")
    parser.add_argument("--queries", action="store_true", help="Print useful SQL queries")
    parser.add_argument("--key", default=GCP_CREDENTIALS_FILE, help="Path to GCP service account JSON key")
    args = parser.parse_args()

    if not (args.setup or args.export or args.queries):
        parser.print_help()
        sys.exit(1)

    if args.queries:
        print_useful_queries()
        sys.exit(0)

    print(f"🌍 Connecting to GCP project: {GCP_PROJECT}")
    try:
        creds = service_account.Credentials.from_service_account_file(
            args.key, scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        bq = bigquery.Client(project=GCP_PROJECT, credentials=creds)
        print(f"  ✓ Authenticated as: {creds.service_account_email}")
    except FileNotFoundError:
        print(f"""
  ✗ GCP key file not found: {args.key}

  To get your key:
  1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project={GCP_PROJECT}
  2. Create service account 'bigeo-backend' with roles: Vertex AI User, BigQuery Data Editor, Cloud Translation User
  3. Create JSON key → download → save as '{args.key}' in this directory
  4. Run this script again
""")
        sys.exit(1)

    if args.setup:
        setup_bigquery(bq)
    if args.export:
        export_to_bigquery(bq)

    print("\n✅ Done! View your data at:")
    print(f"   https://console.cloud.google.com/bigquery?project={GCP_PROJECT}&ws=!1m4!1m3!3m2!1s{GCP_PROJECT}!2s{DATASET}")
