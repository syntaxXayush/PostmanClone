from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union
import json

class Settings(BaseSettings):
    PROJECT_NAME: str = "Postman Clone API"
    API_VERSION: str = "v1"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite+aiosqlite:///./postman.db"
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:3000"]
    REQUEST_TIMEOUT: int = 30
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    def get_cors_origins(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, str):
            try:
                return json.loads(self.CORS_ORIGINS)
            except Exception:
                return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS

settings = Settings()
