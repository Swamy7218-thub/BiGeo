from typing import Optional, List
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Pincode, State, District, Subdistrict
from app.schemas import PincodeDetail


async def get_pincode_detail(db: AsyncSession, code: str) -> Optional[PincodeDetail]:
    """Return the first matching pincode with full hierarchy. HEAD office preferred."""
    stmt = (
        select(Pincode)
        .where(Pincode.code == code)
        .options(
            selectinload(Pincode.state),
            selectinload(Pincode.district),
            selectinload(Pincode.subdistrict),
        )
        # HEAD / Sub offices carry better data than branch offices
        .order_by(
            Pincode.office_type.asc().nulls_last(),
        )
        .limit(1)
    )
    result = await db.execute(stmt)
    row = result.scalar_one_or_none()
    if row is None:
        return None

    return PincodeDetail(
        id=row.id,
        code=row.code,
        officename=row.officename,
        office_type=row.office_type,
        delivery_status=row.delivery_status,
        division=row.division,
        region=row.region,
        circle=row.circle,
        lat=row.lat,
        lon=row.lon,
        state_id=row.state_id,
        state_name=row.state.name if row.state else None,
        district_id=row.district_id,
        district_name=row.district.name if row.district else None,
        subdistrict_id=row.subdistrict_id,
        subdistrict_name=row.subdistrict.name if row.subdistrict else None,
    )


async def get_all_offices_for_pincode(db: AsyncSession, code: str) -> List[PincodeDetail]:
    """Return all post offices sharing a pincode (useful for disambiguation)."""
    stmt = (
        select(Pincode)
        .where(Pincode.code == code)
        .options(
            selectinload(Pincode.state),
            selectinload(Pincode.district),
            selectinload(Pincode.subdistrict),
        )
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [
        PincodeDetail(
            id=r.id, code=r.code, officename=r.officename,
            office_type=r.office_type, delivery_status=r.delivery_status,
            division=r.division, region=r.region, circle=r.circle,
            lat=r.lat, lon=r.lon,
            state_id=r.state_id, state_name=r.state.name if r.state else None,
            district_id=r.district_id, district_name=r.district.name if r.district else None,
            subdistrict_id=r.subdistrict_id,
            subdistrict_name=r.subdistrict.name if r.subdistrict else None,
        )
        for r in rows
    ]
