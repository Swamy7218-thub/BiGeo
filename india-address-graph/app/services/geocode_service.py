"""
Forward and reverse geocoding — pure rule-based, no external API calls.

Forward flow:
  1. Extract 6-digit pincode from raw address text (regex).
  2. Load all pincodes matching that code → constrain state/district/subdistrict.
  3. Tokenise remaining text; fuzzy-match locality names within those constraints.
  4. Split remaining tokens into landmark / street / house heuristics.
  5. Return lat/lon from locality centroid or pincode centroid.

Reverse flow:
  1. ST_Contains over state/district/subdistrict polygon layers.
  2. Nearest pincode by KNN (ST_DWithin + ORDER BY geom <-> point).
  3. Nearest locality centroid by KNN.
"""

import re
from typing import Optional, Tuple
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Pincode, Locality, State, District, Subdistrict
from app.schemas import GeocodeResponse, ReverseGeocodeResponse

# Regex to pull a 6-digit number that starts with 1-9 (valid Indian PIN range)
_PIN_RE = re.compile(r"\b([1-9]\d{5})\b")

# Tokens to strip before locality matching
_STOP_WORDS = frozenset({
    "near", "next", "to", "opposite", "opp", "beside", "behind", "in", "at",
    "village", "vill", "v", "mandal", "tq", "taluk", "tehsil", "block", "post",
    "district", "dist", "state", "india", "h", "no", "house", "flat", "door",
    "ward", "road", "street", "nagar", "colony", "layout",
})


def _extract_pincode(text_: str) -> Optional[str]:
    m = _PIN_RE.search(text_)
    return m.group(1) if m else None


def _tokenise(text_: str) -> list[str]:
    """Lower-case, split on common separators, filter stop words and short tokens."""
    tokens = re.split(r"[,;\-/\s]+", text_.lower())
    return [t.strip(".") for t in tokens if t and len(t) > 2 and t not in _STOP_WORDS]


async def forward_geocode(db: AsyncSession, address: str) -> GeocodeResponse:
    pincode_str = _extract_pincode(address)
    resp = GeocodeResponse()

    # --- Step 1: resolve via pincode ---
    state_id = district_id = subdistrict_id = None
    pin_lat = pin_lon = None

    if pincode_str:
        stmt = (
            select(Pincode)
            .where(Pincode.code == pincode_str)
            .options(selectinload(Pincode.state), selectinload(Pincode.district),
                     selectinload(Pincode.subdistrict))
            .order_by(Pincode.office_type.asc().nulls_last())
            .limit(1)
        )
        res = await db.execute(stmt)
        pin = res.scalar_one_or_none()

        if pin:
            resp.pincode = pincode_str
            resp.state = pin.state.name if pin.state else None
            resp.district = pin.district.name if pin.district else None
            resp.subdistrict = pin.subdistrict.name if pin.subdistrict else None
            state_id = pin.state_id
            district_id = pin.district_id
            subdistrict_id = pin.subdistrict_id
            pin_lat, pin_lon = pin.lat, pin.lon
            resp.lat, resp.lon = pin_lat, pin_lon
            resp.confidence = 0.4
            resp.resolution_level = "pincode_match"

    # --- Step 2: locality fuzzy match ---
    # Remove the raw pincode digits from text before tokenising
    clean = _PIN_RE.sub("", address)
    tokens = _tokenise(clean)

    if tokens:
        locality = await _fuzzy_match_locality(
            db, tokens, state_id=state_id, district_id=district_id,
            subdistrict_id=subdistrict_id
        )
        if locality:
            resp.locality = locality["name"]
            resp.lat = locality["lat"] or resp.lat
            resp.lon = locality["lon"] or resp.lon
            if not resp.state:
                resp.state = locality.get("state_name")
            if not resp.district:
                resp.district = locality.get("district_name")
            if not resp.subdistrict:
                resp.subdistrict = locality.get("subdistrict_name")
            resp.confidence = min(1.0, resp.confidence + 0.35)
            resp.resolution_level = "locality_match"

    # --- Step 3: classify remaining tokens as house/landmark/street ---
    _classify_address_parts(resp, tokens)

    return resp


async def _fuzzy_match_locality(
    db: AsyncSession,
    tokens: list[str],
    state_id: Optional[int],
    district_id: Optional[int],
    subdistrict_id: Optional[int],
) -> Optional[dict]:
    """
    For each token (longest first), try trigram similarity against locality names.
    Return the best match above threshold.
    """
    filters = []
    params: dict = {"threshold": 0.3}

    if subdistrict_id:
        filters.append("sd.id = :subdistrict_id")
        params["subdistrict_id"] = subdistrict_id
    elif district_id:
        filters.append("d.id = :district_id")
        params["district_id"] = district_id
    elif state_id:
        filters.append("s.id = :state_id")
        params["state_id"] = state_id

    where = ("WHERE " + " AND ".join(filters)) if filters else ""

    # Try each token, pick the one with the highest similarity score
    best = None
    for token in sorted(tokens, key=len, reverse=True):
        params["q"] = token
        sql = text(f"""
            SELECT
                l.id, l.name, l.lat, l.lon,
                sd.name AS subdistrict_name,
                d.name  AS district_name,
                s.name  AS state_name,
                similarity(l.name, :q) AS sim
            FROM localities l
            JOIN subdistricts sd ON sd.id = l.subdistrict_id
            JOIN districts d     ON d.id  = sd.district_id
            JOIN states s        ON s.id  = d.state_id
            {where}
            AND similarity(l.name, :q) > :threshold
            ORDER BY sim DESC
            LIMIT 1
        """)
        res = await db.execute(sql, params)
        row = res.mappings().first()
        if row and (best is None or row["sim"] > best["sim"]):
            best = dict(row)
        if best and best["sim"] > 0.7:
            break  # good enough, stop early

    return best


def _classify_address_parts(resp: GeocodeResponse, tokens: list[str]) -> None:
    """
    Heuristically assign remaining tokens to house / landmark / street.
    This is intentionally simple — improve with an NER model later.
    """
    landmark_hints = {"school", "college", "temple", "church", "mosque", "hospital",
                      "bank", "park", "market", "office", "police", "station", "govt"}
    house_pattern = re.compile(r"^\d[\d\-/a-z]*$", re.IGNORECASE)

    used = set()
    if resp.locality:
        used.add(resp.locality.lower())

    for t in tokens:
        tl = t.lower()
        if tl in used:
            continue
        if house_pattern.match(t) and not resp.house:
            resp.house = t
        elif any(h in tl for h in landmark_hints) and not resp.landmark:
            resp.landmark = t
        elif not resp.street and len(t) > 3:
            resp.street = t


async def reverse_geocode(db: AsyncSession, lat: float, lon: float) -> ReverseGeocodeResponse:
    resp = ReverseGeocodeResponse(lat=lat, lon=lon)
    point_wkt = f"SRID=4326;POINT({lon} {lat})"

    # --- Polygon containment: state → district → subdistrict ---
    for table, id_field, name_field, resp_id_attr, resp_name_attr in [
        ("states",       "s.id", "s.name", "state_id",       "state"),
        ("districts",    "d.id", "d.name", "district_id",    "district"),
        ("subdistricts", "sd.id","sd.name","subdistrict_id", "subdistrict"),
    ]:
        alias = table[0] if table != "subdistricts" else "sd"
        sql = text(f"""
            SELECT {id_field} AS id, {name_field} AS name
            FROM {table} {alias}
            WHERE ST_Contains({alias}.geom, ST_GeomFromEWKT(:pt))
            LIMIT 1
        """)
        res = await db.execute(sql, {"pt": point_wkt})
        row = res.mappings().first()
        if row:
            setattr(resp, resp_id_attr, row["id"])
            setattr(resp, resp_name_attr, row["name"])

    # --- Nearest pincode (KNN index scan) ---
    pin_sql = text("""
        SELECT id, code,
               ST_Distance(
                   geom::geography,
                   ST_GeomFromEWKT(:pt)::geography
               ) AS dist_m
        FROM pincodes
        WHERE geom IS NOT NULL
        ORDER BY geom <-> ST_GeomFromEWKT(:pt)
        LIMIT 1
    """)
    pin_res = await db.execute(pin_sql, {"pt": point_wkt})
    pin_row = pin_res.mappings().first()
    if pin_row:
        resp.pincode_id = pin_row["id"]
        resp.pincode = pin_row["code"]

    # --- Nearest locality centroid ---
    loc_sql = text("""
        SELECT id, name,
               ST_Distance(
                   geom::geography,
                   ST_GeomFromEWKT(:pt)::geography
               ) AS dist_m
        FROM localities
        WHERE geom IS NOT NULL
        ORDER BY geom <-> ST_GeomFromEWKT(:pt)
        LIMIT 1
    """)
    loc_res = await db.execute(loc_sql, {"pt": point_wkt})
    loc_row = loc_res.mappings().first()
    if loc_row:
        resp.locality_id = loc_row["id"]
        resp.locality = loc_row["name"]
        resp.distance_to_locality_m = float(loc_row["dist_m"])

    return resp
