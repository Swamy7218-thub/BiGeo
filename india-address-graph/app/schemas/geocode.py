from typing import Optional
from pydantic import BaseModel, Field


class GeocodeRequest(BaseModel):
    address: str = Field(..., min_length=5, max_length=512,
                         examples=["H.No 3-12, near Govt School, Narsapur, Medak, Telangana 502313"])


class GeocodeResponse(BaseModel):
    pincode: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    subdistrict: Optional[str] = None
    locality: Optional[str] = None
    house: Optional[str] = None
    street: Optional[str] = None
    landmark: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    # 0.0 – 1.0: how complete the resolution was
    confidence: float = Field(0.0, ge=0.0, le=1.0)
    # pincode_match | locality_match | district_match | unresolved
    resolution_level: str = "unresolved"


class ReverseGeocodeResponse(BaseModel):
    lat: float
    lon: float
    state: Optional[str] = None
    state_id: Optional[int] = None
    district: Optional[str] = None
    district_id: Optional[int] = None
    subdistrict: Optional[str] = None
    subdistrict_id: Optional[int] = None
    locality: Optional[str] = None
    locality_id: Optional[int] = None
    pincode: Optional[str] = None
    pincode_id: Optional[int] = None
    distance_to_locality_m: Optional[float] = None
