"""
ETL: Load village/town/ward localities from a CSV file.

Expected CSV columns (order-independent, case-insensitive):
    state, district, subdistrict, locality_name, type, pincode, lat, lon

Usage:
    python -m etl.load_localities --input data/localities.csv [--batch 1000]
"""

import argparse
import csv
import logging
import sys
from pathlib import Path
from typing import Optional

from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.models import State, District, Subdistrict, Locality
from etl.db_sync import SessionLocal

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

_ALIASES = {
    "state": "state", "statename": "state", "state_name": "state",
    "district": "district", "districtname": "district",
    "subdistrict": "subdistrict", "mandal": "subdistrict", "taluk": "subdistrict",
    "tehsil": "subdistrict", "block": "subdistrict",
    "locality_name": "name", "locality": "name", "village": "name",
    "town": "name", "ward": "name", "name": "name",
    "type": "type", "locality_type": "type",
    "lat": "lat", "latitude": "lat",
    "lon": "lon", "lng": "lon", "longitude": "lon",
    "pincode": "pincode", "pin": "pincode",
}


def _norm(row: dict) -> dict:
    return {_ALIASES.get(k.lower().strip(), k.lower()): (v.strip() if v else v)
            for k, v in row.items()}


def _float(v) -> Optional[float]:
    try:
        f = float(v)
        return f if f != 0.0 else None
    except (TypeError, ValueError):
        return None


def load_localities(input_path: str, batch_size: int = 1000, dry_run: bool = False) -> None:
    path = Path(input_path)
    if not path.exists():
        logger.error("File not found: %s", input_path)
        sys.exit(1)

    state_cache: dict = {}
    district_cache: dict = {}
    subdistrict_cache: dict = {}
    total = skipped = 0

    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        with SessionLocal() as session:
            batch = []
            for raw in reader:
                row = _norm(raw)
                state_name = (row.get("state") or "").title()
                district_name = (row.get("district") or "").title()
                subdistrict_name = (row.get("subdistrict") or "").title()
                locality_name = (row.get("name") or "").title()
                locality_type = row.get("type") or "village"
                lat = _float(row.get("lat"))
                lon = _float(row.get("lon"))

                if not locality_name or not subdistrict_name:
                    skipped += 1
                    continue

                try:
                    # Resolve or create state
                    if state_name not in state_cache:
                        sid = session.execute(
                            select(State.id).where(State.name == state_name)
                        ).scalar_one_or_none()
                        if sid is None:
                            sid = session.execute(
                                pg_insert(State).values(name=state_name)
                                .on_conflict_do_nothing(index_elements=["name"])
                                .returning(State.id)
                            ).scalar_one()
                        state_cache[state_name] = sid
                    sid = state_cache[state_name]

                    # Resolve district
                    dk = (sid, district_name)
                    if dk not in district_cache:
                        did = session.execute(
                            select(District.id).where(
                                District.state_id == sid, District.name == district_name
                            )
                        ).scalar_one_or_none()
                        if did is None:
                            did = session.execute(
                                pg_insert(District).values(state_id=sid, name=district_name)
                                .on_conflict_do_nothing(constraint="uq_district_state_name")
                                .returning(District.id)
                            ).scalar_one()
                        district_cache[dk] = did
                    did = district_cache[dk]

                    # Resolve subdistrict
                    sdk = (did, subdistrict_name)
                    if sdk not in subdistrict_cache:
                        sdid = session.execute(
                            select(Subdistrict.id).where(
                                Subdistrict.district_id == did,
                                Subdistrict.name == subdistrict_name
                            )
                        ).scalar_one_or_none()
                        if sdid is None:
                            sdid = session.execute(
                                pg_insert(Subdistrict).values(district_id=did, name=subdistrict_name)
                                .on_conflict_do_nothing(constraint="uq_subdistrict_district_name")
                                .returning(Subdistrict.id)
                            ).scalar_one()
                        subdistrict_cache[sdk] = sdid
                    sdid = subdistrict_cache[sdk]

                    batch.append({
                        "subdistrict_id": sdid,
                        "name": locality_name,
                        "type": locality_type,
                        "lat": lat,
                        "lon": lon,
                        "geom": f"SRID=4326;POINT({lon} {lat})" if lat and lon else None,
                    })
                except Exception as e:
                    logger.warning("Skipping row %r: %s", row, e)
                    skipped += 1
                    continue

                if len(batch) >= batch_size:
                    if not dry_run:
                        _flush_localities(session, batch)
                        session.commit()
                    total += len(batch)
                    logger.info("  Committed %d (total %d)", len(batch), total)
                    batch.clear()

            if batch:
                if not dry_run:
                    _flush_localities(session, batch)
                    session.commit()
                total += len(batch)

    logger.info("Done — loaded=%d skipped=%d", total, skipped)


def _flush_localities(session, batch: list) -> None:
    for item in batch:
        geom_expr = None
        if item["geom"]:
            geom_expr = text(f"ST_GeomFromEWKT('{item['geom']}')")

        values = {k: v for k, v in item.items() if k != "geom"}
        if geom_expr is not None:
            values["geom"] = geom_expr

        stmt = (
            pg_insert(Locality)
            .values(**values)
            .on_conflict_do_update(
                constraint="uq_locality_subdistrict_name",
                set_={"lat": values["lat"], "lon": values["lon"], "type": values["type"]},
            )
        )
        session.execute(stmt)


def main():
    parser = argparse.ArgumentParser(description="Load locality CSV into India Address Graph")
    parser.add_argument("--input", required=True)
    parser.add_argument("--batch", type=int, default=1000)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    load_localities(args.input, batch_size=args.batch, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
