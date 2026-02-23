"""
VoiceNotes — Database Configuration
Engine SQLAlchemy + gestió de sessions.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from typing import Generator

from app.config import settings


# Engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,      # Verifica connexions abans d'usar-les
    pool_size=10,             # Connexions al pool
    max_overflow=20,          # Connexions extra en pics
    echo=False,               # True per debug SQL
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# Base class per tots els models
class Base(DeclarativeBase):
    pass


# Dependency per FastAPI — injecta una sessió per request
def get_db() -> Generator[Session, None, None]:
    """
    Genera una sessió de base de dades per cada request.
    Es tanca automàticament al finalitzar.

    Ús als endpoints:
        db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
