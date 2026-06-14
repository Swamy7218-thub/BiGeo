from .health import router as health_router
from .pincode import router as pincode_router
from .search import router as search_router
from .geocode import router as geocode_router

__all__ = ["health_router", "pincode_router", "search_router", "geocode_router"]
