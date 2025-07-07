from typing import List
from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    # App settings
    APP_NAME: str = "InvoiceAI"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Database settings
    DATABASE_URL: str

    # Supabase settings
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str

    # JWT settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS settings - default values
    CORS_ORIGINS_STR: str = "http://localhost:5174,http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Parse CORS_ORIGINS_STR into a list of origins"""
        origins_str = self.CORS_ORIGINS_STR
        return [origin.strip() for origin in origins_str.split(",")]


settings = Settings()
