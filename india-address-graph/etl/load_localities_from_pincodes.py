"""
Populate localities table from pincode CSV.

Each post office in the CSV becomes a locality with verified lat/lon.
This gives us ~165K named places with coordinates immediately —
enough to lift forward-geocode confidence from pincode_match (0.4)
to locality_match (0.75+).

Usage:
    python -m etl.load_localities_from_pincodes --input data/pincodes.csv
    python -m etl.load_localities_from_pincodes --input data/pincodes.csv --dry-run
"""

import argparse
import csv
import sys
from pathlib import Path

import psycopg2
import psycopg2.extras

DB_URL_DEFAULT = "postgresql://iag:iag_secret@localhost:5432/india_address_graph"


def title(s: str) -> str:
    return " ".join(w.capitalize() for w in s.strip().split()) if s else ""


def run(input_path: str, db_url: str, batch: int, dry_run: bool):
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # Build district name → id index (lower-cased for fuzzy match)
    cur.execute("SELECT id, LOWER(name), state_id FROM districts")
    district_index: dict[str, int] = {}
    for did, name, sid in cur.fetchall():
        district_index[name] = did

    # Build state name → id index
    cur.execute("SELECT id, LOWER(name) FROM states")
    state_index: dict[str, int] = {n: i for i, n in cur.fetchall()}

    # Build pincode code → id index
    cur.execute("SELECT id, code FROM pincodes")
    pincode_index: dict[str, int] = {}
    for pid, code in cur.fetchall():
        if code not in pincode_index:
            pincode_index[code] = pid

    loaded = skipped = no_district = no_coords = 0
    rows_batch = []

    def flush():
        nonlocal loaded
        if not rows_batch or dry_run:
            return
        psycopg2.extras.execute_values(
            cur,
            """
            INSERT INTO localities
                (name, type, district_id, subdistrict_id, pincode_id, geom)
            VALUES %s
            ON CONFLICT ON CONSTRAINT uq_locality_subdistrict_name DO UPDATE
                SET type = EXCLUDED.type,
                    pincode_id = COALESCE(EXCLUDED.pincode_id, localities.pincode_id),
                    geom = COALESCE(EXCLUDED.geom, localities.geom)
            """,
            rows_batch,
            template="(%s, %s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))",
        )
        conn.commit()
        loaded += len(rows_batch)
        rows_batch.clear()

    with open(input_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = title(row.get("officename", "").strip())
            if not name:
                skipped += 1
                continue

            state_name = row.get("statename", "").strip().lower()
            dist_name = row.get("district", "").strip().lower()
            pincode_str = row.get("pincode", "").strip()

            try:
                lat = float(row.get("latitude", "") or 0)
                lon = float(row.get("longitude", "") or 0)
            except ValueError:
                lat = lon = 0.0

            if not lat or not lon:
                no_coords += 1

            district_id = district_index.get(dist_name)
            if not district_id:
                # try partial match (district names sometimes differ slightly)
                for k, v in district_index.items():
                    if dist_name in k or k in dist_name:
                        district_id = v
                        break

            if not district_id:
                no_district += 1
                continue

            pincode_id = pincode_index.get(pincode_str)
            office_type = row.get("officetype", "BO").strip() or "BO"
            locality_type = "post_office" if office_type in ("HO", "SO") else "village"

            rows_batch.append((
                name,
                locality_type,
                district_id,
                None,           # subdistrict_id — not in pincode CSV
                pincode_id,
                lon if lon else None,
                lat if lat else None,
            ))

            if len(rows_batch) >= batch:
                flush()
                print(f"  Loaded {loaded} localities...", flush=True)

        flush()

    cur.close()
    conn.close()

    if dry_run:
        print(f"DRY RUN — would load ~{loaded + len(rows_batch)} localities "
              f"(skipped {skipped}, no_district {no_district}, no_coords {no_coords})")
    else:
        print(f"\nDone. Loaded={loaded}  Skipped={skipped}  "
              f"NoDistrict={no_district}  NoCoords={no_coords}")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--db-url", default=DB_URL_DEFAULT)
    p.add_argument("--batch", type=int, default=500)
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    if not Path(args.input).exists():
        print(f"ERROR: {args.input} not found", file=sys.stderr)
        sys.exit(1)

    run(args.input, args.db_url, args.batch, args.dry_run)


if __name__ == "__main__":
    main()
