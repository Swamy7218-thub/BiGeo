from typing import Optional, List
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.schemas import LocalitySearchResult, PaginatedLocalities

settings = get_settings()


async def search_localities(
    db: AsyncSession,
    q: str,
    state_id: Optional[int] = None,
    district_id: Optional[int] = None,
    subdistrict_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
) -> PaginatedLocalities:
    """
    Trigram similarity search over locality names with optional hierarchy filters.
    Falls back to ILIKE prefix match when trigram similarity is below threshold.
    """
    page_size = min(page_size, settings.MAX_PAGE_SIZE)
    offset = (page - 1) * page_size

    filters = ["similarity(l.name, :q) > :threshold OR l.name ILIKE :q_like"]
    params: dict = {
        "q": q,
        "q_like": f"%{q}%",
        "threshold": settings.TRIGRAM_SIMILARITY_THRESHOLD,
        "limit": page_size,
        "offset": offset,
    }

    if state_id is not None:
        filters.append("s.id = :state_id")
        params["state_id"] = state_id
    if district_id is not None:
        filters.append("d.id = :district_id")
        params["district_id"] = district_id
    if subdistrict_id is not None:
        filters.append("sd.id = :subdistrict_id")
        params["subdistrict_id"] = subdistrict_id

    where_clause = " AND ".join(filters)

    base_query = f"""
        SELECT
            l.id              AS locality_id,
            l.name            AS locality_name,
            l.type            AS locality_type,
            l.lat,
            l.lon,
            sd.id             AS subdistrict_id,
            sd.name           AS subdistrict_name,
            d.id              AS district_id,
            d.name            AS district_name,
            s.id              AS state_id,
            s.name            AS state_name,
            similarity(l.name, :q) AS similarity
        FROM localities l
        JOIN subdistricts sd ON sd.id = l.subdistrict_id
        JOIN districts d     ON d.id  = sd.district_id
        JOIN states s        ON s.id  = d.state_id
        WHERE {where_clause}
    """

    count_result = await db.execute(
        text(f"SELECT COUNT(*) FROM ({base_query}) AS sub"),
        params,
    )
    total = count_result.scalar_one()

    rows_result = await db.execute(
        text(f"{base_query} ORDER BY similarity DESC, l.name LIMIT :limit OFFSET :offset"),
        params,
    )
    rows = rows_result.mappings().all()

    results = [
        LocalitySearchResult(
            locality_id=r["locality_id"],
            locality_name=r["locality_name"],
            locality_type=r["locality_type"],
            subdistrict_id=r["subdistrict_id"],
            subdistrict_name=r["subdistrict_name"],
            district_id=r["district_id"],
            district_name=r["district_name"],
            state_id=r["state_id"],
            state_name=r["state_name"],
            lat=r["lat"],
            lon=r["lon"],
            similarity=float(r["similarity"]) if r["similarity"] is not None else None,
        )
        for r in rows
    ]

    return PaginatedLocalities(total=total, page=page, page_size=page_size, results=results)
