"""
VoiceNotes — Auth Schemas
Validació de requests i responses per autenticació.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# --- Requests ---

class UserRegister(BaseModel):
    """Request per registrar un nou usuari."""
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    """Request per fer login."""
    username: str
    password: str


class RefreshTokenRequest(BaseModel):
    """Request per renovar l'access token."""
    refresh_token: str


# --- Responses ---

class TokenResponse(BaseModel):
    """Response amb els tokens JWT."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Response amb info de l'usuari."""
    id: UUID
    username: str
    email: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}