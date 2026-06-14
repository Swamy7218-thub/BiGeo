from typing import Optional, List
from pydantic import BaseModel


class LocalitySearchResult(BaseModel):
    locality_id: int
    locality_name: str
    locality_type: str
    subdistrict_id: Optional[int] = None
    subdistrict_name: Optional[str] = None
    district_id: Optional[int] = None
    district_name: Optional[str] = None
    state_id: Optional[int] = None
    state_name: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    # Similarity score [0,1] from trigram match
    similarity: Optional[float] = None


class PaginatedLocalities(BaseModel):
    total: int
    page: int
    page_size: int
    results: List[LocalitySearchResult]
