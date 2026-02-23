"""
VoiceNotes — Application Configuration
Gestió centralitzada de settings via variables d'entorn.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Configuració de l'aplicació carregada des de .env"""

    # --- Database ---
    DATABASE_URL: str = "postgresql://voicenotes:password@db:5432/voicenotes"

    # --- JWT Authentication ---
    JWT_SECRET_KEY: str = "canvia-aixo-per-un-secret-segur"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- Whisper STT ---
    WHISPER_MODEL: str = "large-v3"
    WHISPER_DEVICE: str = "cuda"
    WHISPER_COMPUTE_TYPE: str = "float16"
    DEFAULT_LANGUAGE: str = "ca"

    # --- File Upload ---
    MAX_AUDIO_SIZE_MB: int = 50
    ALLOWED_AUDIO_FORMATS: str = "wav,mp3,ogg,m4a,webm,flac"

    # --- API ---
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: List[str] = ["*"]

    # --- App Info ---
    APP_NAME: str = "VoiceNotes API"
    APP_VERSION: str = "0.1.0"

    @property
    def allowed_formats_list(self) -> list[str]:
        """Retorna la llista de formats permesos."""
        return [f.strip() for f in self.ALLOWED_AUDIO_FORMATS.split(",")]

    @property
    def max_audio_size_bytes(self) -> int:
        """Retorna la mida màxima d'àudio en bytes."""
        return self.MAX_AUDIO_SIZE_MB * 1024 * 1024

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Singleton — importar des de qualsevol lloc amb: from app.config import settings
settings = Settings()
