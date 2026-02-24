"""
VoiceNotes — Category Schemas
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


# --- Requests ---

class CategoryCreate(BaseModel):
    """Request per crear una categoria."""
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(default="#6366F1", pattern=r"^#[0-9A-Fa-f]{6}$")


class CategoryUpdate(BaseModel):
    """Request per actualitzar una categoria."""
    name: str | None = Field(default=None, min_length=1, max_length=100)
    color: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")


# --- Responses ---

class CategoryResponse(BaseModel):
    """Response amb info d'una categoria."""
    id: UUID
    name: str
    color: str
    created_at: datetime

    model_config = {"from_attributes": True}
