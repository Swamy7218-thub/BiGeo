from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import PaginatedLocalities
from app.services import get_db, search_localities
from app.config import get_settings

router = APIRouter(prefix="/search", tags=["Search"])
settings = get_settings()


@router.get(
    "/localities",
    response_model=PaginatedLocalities,
    summary="Fuzzy search localities by name",
)
async def locality_search(
    q: str = Query(..., min_length=2, description="Partial locality name"),
    state_id: Optional[int] = Query(None, description="Filter by state ID"),
    district_id: Optional[int] = Query(None, description="Filter by district ID"),
    subdistrict_id: Optional[int] = Query(None, description="Filter by subdistrict ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE),
    db: AsyncSession = Depends(get_db),
) -> PaginatedLocalities:
    return await search_localities(
        db, q=q,
        state_id=state_id,
        district_id=district_id,
        subdistrict_id=subdistrict_id,
        page=page,
        page_size=page_size,
    )
