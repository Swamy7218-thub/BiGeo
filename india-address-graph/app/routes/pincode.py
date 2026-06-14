from typing import List
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import PincodeDetail
from app.services import get_db, get_pincode_detail, get_all_offices_for_pincode

router = APIRouter(prefix="/pincode", tags=["Pincode"])


@router.get(
    "/{code}",
    response_model=PincodeDetail,
    summary="Look up primary post office for a PIN code",
)
async def pincode_detail(
    code: str = Path(..., pattern=r"^\d{6}$", description="6-digit Indian PIN code"),
    db: AsyncSession = Depends(get_db),
) -> PincodeDetail:
    result = await get_pincode_detail(db, code)
    if result is None:
        raise HTTPException(status_code=404, detail=f"No records found for PIN {code}")
    return result


@router.get(
    "/{code}/offices",
    response_model=List[PincodeDetail],
    summary="All post offices sharing a PIN code",
)
async def pincode_offices(
    code: str = Path(..., pattern=r"^\d{6}$"),
    db: AsyncSession = Depends(get_db),
) -> List[PincodeDetail]:
    results = await get_all_offices_for_pincode(db, code)
    if not results:
        raise HTTPException(status_code=404, detail=f"No records found for PIN {code}")
    return results
