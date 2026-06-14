from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://iag:iag_secret@localhost:5432/india_address_graph"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # App
    APP_ENV: str = "development"
    APP_DEBUG: bool = False
    APP_TITLE: str = "India Address Graph"
    APP_VERSION: str = "1.0.0"
    LOG_LEVEL: str = "INFO"

    # Search
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    TRIGRAM_SIMILARITY_THRESHOLD: float = 0.3


@lru_cache
def get_settings() -> Settings:
    return Settings()
