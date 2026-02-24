"""
VoiceNotes — Note Schemas
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.category import CategoryResponse
from app.schemas.recording import RecordingResponse


# --- Requests ---

class NoteCreate(BaseModel):
    """Request per crear una nota (amb àudio opcional via form-data)."""
    title: str = Field(..., min_length=1, max_length=255)
    category_id: UUID | None = None
    language: str = Field(default="ca", max_length=10)


class NoteUpdate(BaseModel):
    """Request per actualitzar una nota."""
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = None
    category_id: UUID | None = None
    language: str | None = Field(default=None, max_length=10)


# --- Responses ---

class NoteResponse(BaseModel):
    """Response amb info d'una nota (sense recordings)."""
    id: UUID
    title: str
    content: str
    language: str
    is_pinned: bool
    category: CategoryResponse | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NoteDetailResponse(NoteResponse):
    """Response amb info completa d'una nota (amb recordings)."""
    recordings: list[RecordingResponse] = []
