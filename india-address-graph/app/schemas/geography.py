from typing import Optional
from pydantic import BaseModel, ConfigDict


class StateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    iso_code: Optional[str] = None


class DistrictOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    state_id: int
    name: str
    state: Optional[StateOut] = None


class SubdistrictOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    district_id: int
    name: str
    district: Optional[DistrictOut] = None


class LocalityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subdistrict_id: int
    name: str
    type: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    subdistrict: Optional[SubdistrictOut] = None
