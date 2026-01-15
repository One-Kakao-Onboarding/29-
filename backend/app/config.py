"""애플리케이션 설정"""
import os
from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """애플리케이션 설정 클래스"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Supabase
    supabase_url: str = Field(
        default="https://fvlanbsclsewkfypomlr.supabase.co",
        alias="SUPABASE_URL",
    )
    supabase_key: str = Field(
        ...,
        alias="SUPABASE_KEY",
    )
    supabase_anon_key: Optional[str] = Field(
        default=None,
        alias="SUPABASE_ANON_KEY",
    )

    # Anthropic Claude API
    anthropic_api_key: str = Field(
        ...,
        alias="ANTHROPIC_API_KEY",
    )

    # CORS
    cors_origins: str = Field(
        default="http://localhost:3000,https://29292929jojojojojojo.netlify.app",
        alias="CORS_ORIGINS",
    )

    # Server
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")
    debug: bool = Field(default=False, alias="DEBUG")

    @property
    def cors_origins_list(self) -> list[str]:
        """CORS origins를 리스트로 반환"""
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    """설정 인스턴스를 반환 (캐싱됨)"""
    return Settings()
