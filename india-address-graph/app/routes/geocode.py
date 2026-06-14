from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import GeocodeRequest, GeocodeResponse, ReverseGeocodeResponse
from app.services import get_db, forward_geocode, reverse_geocode

router = APIRouter(tags=["Geocode"])


@router.post(
    "/geocode",
    response_model=GeocodeResponse,
    summary="Forward geocode a free-text Indian address",
)
async def geocode(
    body: GeocodeRequest,
    db: AsyncSession = Depends(get_db),
) -> GeocodeResponse:
    return await forward_geocode(db, body.address)


@router.get(
    "/reverse-geocode",
    response_model=ReverseGeocodeResponse,
    summary="Reverse geocode lat/lon to Indian administrative hierarchy",
)
async def reverse(
    lat: float = Query(..., ge=6.0, le=38.0, description="Latitude (India range 6–38°N)"),
    lon: float = Query(..., ge=68.0, le=98.0, description="Longitude (India range 68–98°E)"),
    db: AsyncSession = Depends(get_db),
) -> ReverseGeocodeResponse:
    return await reverse_geocode(db, lat=lat, lon=lon)
