from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    app_name: str = "Daily Coding Challenge Generator"
    environment: str = "development"
    debug: bool = True

    # Security
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"

    # Database
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/dcc"

    # LLM
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-sonnet-4-6"

    # Code execution
    judge0_url: str = "https://judge0-ce.p.rapidapi.com"
    judge0_api_key: str | None = None
    judge0_host: str = "judge0-ce.p.rapidapi.com"

    timezone: str = "UTC"


@lru_cache
def get_settings() -> Settings:
    return Settings()
