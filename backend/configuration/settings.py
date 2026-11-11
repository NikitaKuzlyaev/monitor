from functools import lru_cache

from pydantic import AliasChoices, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "HackIT Monitor"
    admin_code: SecretStr | None = Field(default=None, validation_alias="APP_ADMIN_CODE")
    redis_host: str = Field(
        default="redis",
        validation_alias=AliasChoices("REDIS_KV_SIMPLE_CACHE_HOST", "REDIS_HOST"),
    )
    redis_port: int = Field(
        default=6379,
        validation_alias=AliasChoices("REDIS_KV_SIMPLE_CACHE_PORT", "REDIS_PORT"),
    )
    redis_db: int = Field(default=0, validation_alias=AliasChoices("REDIS_KV_SIMPLE_CACHE_DB", "REDIS_DB"))
    codeforces_api_key: SecretStr | None = Field(default=None, validation_alias="CODEFORCES_API_KEY")
    codeforces_api_secret: SecretStr | None = Field(default=None, validation_alias="CODEFORCES_API_SECRET")
    codeforces_contest_id: int = Field(default=0, ge=0, validation_alias="CODEFORCES_CONTEST_ID")
    codeforces_refresh_interval_seconds: int = Field(default=15, ge=5, le=300)
    codeforces_request_timeout_seconds: float = Field(default=10, gt=0, le=60)
    staff_request_timeout_seconds: int = Field(default=10, ge=1, le=60)
    admin_session_max_age_seconds: int = Field(default=28_800, ge=300, le=86_400)
    admin_cookie_secure: bool = Field(default=False, validation_alias="ADMIN_COOKIE_SECURE")
    cors_origins: list[str] = Field(default_factory=list, validation_alias="CORS_ORIGINS")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
