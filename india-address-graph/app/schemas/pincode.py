from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


class PincodeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    officename: str
    office_type: Optional[str] = None
    delivery_status: Optional[str] = None
    division: Optional[str] = None
    region: Optional[str] = None
    circle: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None


class PincodeDetail(PincodeOut):
    """Full pincode record including resolved administrative hierarchy."""

    state_id: Optional[int] = None
    state_name: Optional[str] = None
    district_id: Optional[int] = None
    district_name: Optional[str] = None
    subdistrict_id: Optional[int] = None
    subdistrict_name: Optional[str] = None

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("Pincode must be a 6-digit numeric string")
        return v
