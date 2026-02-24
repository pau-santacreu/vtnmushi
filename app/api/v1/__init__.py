"""
VoiceNotes — API v1 Router
Agrupa tots els sub-routers de la v1.
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.categories import router as categories_router
from app.api.v1.notes import router as notes_router
from app.api.v1.recordings import router as recordings_router
from app.api.v1.transcribe import router as transcribe_router

router = APIRouter(prefix="/api/v1")

router.include_router(auth_router)
router.include_router(categories_router)
router.include_router(notes_router)
router.include_router(recordings_router)
router.include_router(transcribe_router)
