"""
ETL: Load Indian pincode CSV into the India Address Graph database.

Supported source schemas (auto-detected):
  - deep5050/indian-pincodes-database
  - thatisuday/indian-pincode-database
  - dropdevrahul/pincodes-india

Usage:
    python -m etl.load_pincodes --input data/pincodes.csv [--batch 500] [--dry-run]

The script:
  1. Upserts states from statename column.
  2. Upserts districts keyed by (state_id, district_name).
  3. Upserts subdistricts keyed by (district_id, taluk).
  4. Upserts pincodes keyed by (code, officename) with FK references.
"""

import argparse
import csv
import logging
import sys
from pathlib import Path
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.models import Base, State, District, Subdistrict, Pincode
from etl.db_sync import engine, SessionLocal

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Column name normalisation — maps source CSV columns → canonical names
# ---------------------------------------------------------------------------
_COLUMN_ALIASES: dict[str, str] = {
    # pincode
    "pincode": "pincode", "Pincode": "pincode", "pin": "pincode",
    # officename
    "officename": "officename", "OfficeName": "officename", "office_name": "officename",
    "Name": "officename",
    # officetype
    "officeType": "officetype", "officetype": "officetype", "OfficeType": "officetype",
    "office_type": "officetype", "Type": "officetype",
    # delivery
    "Deliverystatus": "delivery", "deliverystatus": "delivery",
    "delivery_status": "delivery", "Delivery": "delivery",
    # division
    "divisionname": "division", "DivisionName": "division", "Division": "division",
    # region
    "regionname": "region", "RegionName": "region", "Region": "region",
    # circle
    "circlename": "circle", "CircleName": "circle", "Circle": "circle",
    # taluk / subdistrict
    "Taluk": "taluk", "taluk": "taluk", "Tehsil": "taluk", "tehsil": "taluk",
    "Mandal": "taluk", "mandal": "taluk", "Block": "taluk", "block": "taluk",
    "SubDistrict": "taluk", "subdistrict": "taluk",
    # district
    "Districtname": "district", "districtname": "district", "District": "district",
    "district": "district",
    # state
    "statename": "state", "StateName": "state", "State": "state", "state": "state",
    # coordinates
    "latitude": "lat", "Latitude": "lat", "lat": "lat",
    "longitude": "lon", "Longitude": "lon", "lon": "lon", "lng": "lon",
}


def _normalise_row(raw: dict) -> dict:
    return {_COLUMN_ALIASES.get(k, k.lower()): (v.strip() if isinstance(v, str) else v)
            for k, v in raw.items()}


def _float_or_none(val: str) -> Optional[float]:
    try:
        f = float(val)
        return f if f != 0.0 else None
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Upsert helpers using PostgreSQL ON CONFLICT DO NOTHING / DO UPDATE
# ---------------------------------------------------------------------------

def _upsert_state(session: Session, name: str, cache: dict) -> int:
    if name in cache:
        return cache[name]
    stmt = (
        pg_insert(State)
        .values(name=name)
        .on_conflict_do_nothing(index_elements=["name"])
        .returning(State.id)
    )
    result = session.execute(stmt)
    row = result.fetchone()
    if row:
        sid = row[0]
    else:
        sid = session.execute(
            __import__("sqlalchemy", fromlist=["select"]).select(State.id).where(State.name == name)
        ).scalar_one()
    cache[name] = sid
    return sid


def _upsert_district(session: Session, state_id: int, name: str, cache: dict) -> int:
    key = (state_id, name)
    if key in cache:
        return cache[key]
    from sqlalchemy import select
    stmt = (
        pg_insert(District)
        .values(state_id=state_id, name=name)
        .on_conflict_do_nothing(constraint="uq_district_state_name")
        .returning(District.id)
    )
    result = session.execute(stmt)
    row = result.fetchone()
    if row:
        did = row[0]
    else:
        did = session.execute(
            select(District.id).where(District.state_id == state_id, District.name == name)
        ).scalar_one()
    cache[key] = did
    return did


def _upsert_subdistrict(session: Session, district_id: int, name: str, cache: dict) -> int:
    key = (district_id, name)
    if key in cache:
        return cache[key]
    from sqlalchemy import select
    stmt = (
        pg_insert(Subdistrict)
        .values(district_id=district_id, name=name)
        .on_conflict_do_nothing(constraint="uq_subdistrict_district_name")
        .returning(Subdistrict.id)
    )
    result = session.execute(stmt)
    row = result.fetchone()
    if row:
        sdid = row[0]
    else:
        sdid = session.execute(
            select(Subdistrict.id).where(
                Subdistrict.district_id == district_id, Subdistrict.name == name
            )
        ).scalar_one()
    cache[key] = sdid
    return sdid


def _upsert_pincode(
    session: Session,
    row: dict,
    state_id: Optional[int],
    district_id: Optional[int],
    subdistrict_id: Optional[int],
) -> None:
    lat = _float_or_none(row.get("lat", ""))
    lon = _float_or_none(row.get("lon", ""))

    values = dict(
        code=row["pincode"][:6],
        officename=row.get("officename", "")[:255],
        office_type=row.get("officetype") or None,
        delivery_status=row.get("delivery") or None,
        division=row.get("division") or None,
        region=row.get("region") or None,
        circle=row.get("circle") or None,
        state_id=state_id,
        district_id=district_id,
        subdistrict_id=subdistrict_id,
        lat=lat,
        lon=lon,
    )
    # Add PostGIS point if coords available
    if lat and lon:
        from sqlalchemy import text
        values["geom"] = text(f"ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326)")

    stmt = (
        pg_insert(Pincode)
        .values(**values)
        .on_conflict_do_update(
            constraint="uq_pincode_code_office",
            set_={k: v for k, v in values.items() if k not in ("code", "officename")},
        )
    )
    session.execute(stmt)


# ---------------------------------------------------------------------------
# Main ETL function
# ---------------------------------------------------------------------------

def load_pincodes(input_path: str, batch_size: int = 500, dry_run: bool = False) -> None:
    path = Path(input_path)
    if not path.exists():
        logger.error("Input file not found: %s", input_path)
        sys.exit(1)

    logger.info("Loading pincodes from %s (batch=%d, dry_run=%s)", path, batch_size, dry_run)

    state_cache: dict = {}
    district_cache: dict = {}
    subdistrict_cache: dict = {}

    total = skipped = 0

    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        with SessionLocal() as session:
            batch = []
            for raw_row in reader:
                row = _normalise_row(raw_row)

                state_name = row.get("state", "").strip().title()
                district_name = row.get("district", "").strip().title()
                taluk_name = row.get("taluk", "").strip().title()
                pincode_val = row.get("pincode", "").strip()

                if not pincode_val or not pincode_val.isdigit() or len(pincode_val) != 6:
                    skipped += 1
                    continue
                if not state_name:
                    skipped += 1
                    continue

                try:
                    sid = _upsert_state(session, state_name, state_cache)
                    did = _upsert_district(session, sid, district_name, district_cache) if district_name else None
                    sdid = _upsert_subdistrict(session, did, taluk_name, subdistrict_cache) if (did and taluk_name) else None
                    batch.append((row, sid, did, sdid))
                except Exception as e:
                    logger.warning("Hierarchy upsert failed for row %r: %s", row, e)
                    skipped += 1
                    continue

                if len(batch) >= batch_size:
                    if not dry_run:
                        for r, s, d, sd in batch:
                            _upsert_pincode(session, r, s, d, sd)
                        session.commit()
                    total += len(batch)
                    logger.info("  Committed %d rows (total: %d)", len(batch), total)
                    batch.clear()

            # flush remaining
            if batch:
                if not dry_run:
                    for r, s, d, sd in batch:
                        _upsert_pincode(session, r, s, d, sd)
                    session.commit()
                total += len(batch)

    logger.info("Done. Loaded=%d  Skipped=%d", total, skipped)


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Load Indian pincode CSV into India Address Graph DB")
    parser.add_argument("--input", required=True, help="Path to input CSV file")
    parser.add_argument("--batch", type=int, default=500, help="Rows per commit batch (default: 500)")
    parser.add_argument("--dry-run", action="store_true", help="Parse only, do not write to DB")
    args = parser.parse_args()
    load_pincodes(args.input, batch_size=args.batch, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
