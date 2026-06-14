"""
Load LGD village directory into India Address Graph.

Phase 1: Upsert subdistricts (state→district→subdistrict hierarchy).
Phase 2: Upsert villages as localities under their subdistrict.
         Coordinates come from the pincode CSV (matched by pincode → locality name).

Usage:
    python -m etl.load_lgd_villages \
        --lgd  /tmp/lgd/village-directory.csv \
        --pins /home/user/BiGeo/external-data/indian-pincode/data/raw-data.csv
"""

import argparse
import csv
import sys
from pathlib import Path

import psycopg2
import psycopg2.extras


DB_URL = "postgresql://iag:iag_secret@localhost:5432/india_address_graph"


def title(s: str) -> str:
    return " ".join(w.capitalize() for w in s.strip().split()) if s else ""


def fuzzy_match(name: str, index: dict) -> int | None:
    key = name.lower()
    if key in index:
        return index[key]
    # try without common suffixes
    for suffix in (" district", " tehsil", " mandal", " taluk", " block"):
        if key.endswith(suffix):
            k2 = key[: -len(suffix)]
            if k2 in index:
                return index[k2]
    # partial containment
    for k, v in index.items():
        if key in k or k in key:
            return v
    return None


def load(lgd_path: str, pins_path: str):
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    # ── Build lookup indices ───────────────────────────────────────────────────
    cur.execute("SELECT id, LOWER(name), state_id FROM districts")
    district_by_name: dict[str, int] = {n: i for i, n, s in cur.fetchall()}
    district_state: dict[int, int] = {}
    cur.execute("SELECT id, state_id FROM districts")
    for did, sid in cur.fetchall():
        district_state[did] = sid

    cur.execute("SELECT id, LOWER(name) FROM states")
    state_by_name: dict[str, int] = {n: i for i, n in cur.fetchall()}

    # ── Phase 1: load subdistricts from LGD ───────────────────────────────────
    print("Phase 1: loading subdistricts from LGD...")
    seen_subdists: set[tuple] = set()

    with open(lgd_path, newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            state_name = title(row["State Name(In English)"])
            dist_name = title(row["District Name(In English)"])
            sub_name = title(row["Subdistrict Name(In English)"])
            sub_code = row["Subdistrict code"].strip()

            if not sub_name or not sub_code:
                continue
            key = (dist_name.lower(), sub_name.lower())
            if key in seen_subdists:
                continue
            seen_subdists.add(key)

            district_id = fuzzy_match(dist_name, district_by_name)
            if not district_id:
                continue

            cur.execute(
                """
                INSERT INTO subdistricts (name, district_id)
                VALUES (%s, %s)
                ON CONFLICT ON CONSTRAINT uq_subdistrict_district_name
                DO UPDATE SET name = EXCLUDED.name
                RETURNING id
                """,
                (sub_name, district_id),
            )

    conn.commit()
    print(f"  Done. Subdistricts in DB: ", end="")
    cur.execute("SELECT COUNT(*) FROM subdistricts")
    print(cur.fetchone()[0])

    # ── Build subdistrict index ────────────────────────────────────────────────
    cur.execute("SELECT id, LOWER(name), district_id FROM subdistricts")
    subdistrict_idx: dict[tuple, int] = {}
    for sid, name, did in cur.fetchall():
        subdistrict_idx[(did, name)] = sid

    # ── Build pincode coordinate index ────────────────────────────────────────
    # officename → (lat, lon, pincode_str) from pincode CSV
    print("Building coordinate index from pincode CSV...")
    coord_index: dict[str, tuple] = {}
    with open(pins_path, newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            name = title(row.get("officename", "")).lower()
            try:
                lat = float(row["latitude"])
                lon = float(row["longitude"])
                if lat and lon:
                    coord_index[name] = (lat, lon, row["pincode"].strip())
            except (ValueError, KeyError):
                pass
    print(f"  {len(coord_index)} named places with coordinates")

    # Build pincode id index
    cur.execute("SELECT id, code FROM pincodes")
    pincode_id_idx: dict[str, int] = {}
    for pid, code in cur.fetchall():
        if code not in pincode_id_idx:
            pincode_id_idx[code] = pid

    # ── Phase 2: load villages as localities ──────────────────────────────────
    print("Phase 2: loading villages as localities...")
    loaded = skipped = no_sub = 0
    batch = []

    def flush():
        nonlocal loaded
        if not batch:
            return
        # Deduplicate within batch on (subdistrict_id, name) — keep first with coords
        seen: dict[tuple, tuple] = {}
        for row in batch:
            key = (row[1], row[0])  # (subdistrict_id, name)
            if key not in seen or (seen[key][2] is None and row[2] is not None):
                seen[key] = row
        deduped = list(seen.values())
        batch.clear()
        batch.extend(deduped)
        psycopg2.extras.execute_values(
            cur,
            """
            INSERT INTO localities (name, type, subdistrict_id, lat, lon, geom)
            VALUES %s
            ON CONFLICT ON CONSTRAINT uq_locality_subdistrict_name DO UPDATE
                SET lat = COALESCE(EXCLUDED.lat, localities.lat),
                    lon = COALESCE(EXCLUDED.lon, localities.lon),
                    geom = COALESCE(EXCLUDED.geom, localities.geom)
            """,
            batch,
            template=(
                "(%s, 'village', %s, %s, %s, "
                "CASE WHEN %s IS NOT NULL AND %s IS NOT NULL "
                "THEN ST_SetSRID(ST_MakePoint(%s, %s), 4326) ELSE NULL END)"
            ),
        )
        conn.commit()
        loaded += len(deduped)
        batch.clear()

    with open(lgd_path, newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            vname = title(row["Village Name(In English)"])
            dist_name = title(row["District Name(In English)"])
            sub_name = title(row["Subdistrict Name(In English)"])

            if not vname:
                skipped += 1
                continue

            district_id = fuzzy_match(dist_name, district_by_name)
            if not district_id:
                no_sub += 1
                continue

            subdistrict_id = subdistrict_idx.get((district_id, sub_name.lower()))
            if not subdistrict_id:
                no_sub += 1
                continue

            # Look up coordinates from pincode CSV by village name
            coords = coord_index.get(vname.lower())
            lat = lon = None
            pincode_id = None
            if coords:
                lat, lon, pcode = coords
                pincode_id = pincode_id_idx.get(pcode)

            batch.append((vname, subdistrict_id, lat, lon, lon, lat, lon, lat))

            if len(batch) >= 500:
                flush()
                if loaded % 50000 == 0:
                    print(f"  {loaded} localities loaded...", flush=True)

    flush()
    cur.close()
    conn.close()

    print(f"\nDone.")
    print(f"  Localities loaded : {loaded}")
    print(f"  Skipped (no name) : {skipped}")
    print(f"  No subdistrict    : {no_sub}")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--lgd", default="/tmp/lgd/village-directory.csv")
    p.add_argument("--pins", default="/home/user/BiGeo/external-data/indian-pincode/data/raw-data.csv")
    args = p.parse_args()

    for path in (args.lgd, args.pins):
        if not Path(path).exists():
            print(f"ERROR: {path} not found", file=sys.stderr)
            sys.exit(1)

    load(args.lgd, args.pins)


if __name__ == "__main__":
    main()
