"""
VoiceNotes — Recording Schemas
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


# --- Responses ---

class RecordingResponse(BaseModel):
    """Response amb info d'una gravació."""
    id: UUID
    note_id: UUID
    file_path: str
    duration_seconds: float | None = None
    transcription: str
    confidence: float | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TranscriptionResponse(BaseModel):
    """Response per transcripció directa (sense crear nota)."""
    text: str
    language: str
    confidence: float | None = None
    duration_seconds: float | None = None
