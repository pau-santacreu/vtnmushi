"""
VoiceNotes — API Dependencies
Dependencies compartides pels endpoints (auth, db session).
"""

from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.core.security import decode_token
from app.core.exceptions import CredentialsException

# Esquema Bearer per extreure el token de la capçalera Authorization
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency que extreu i valida el JWT, i retorna l'usuari.

    Ús als endpoints:
        current_user: User = Depends(get_current_user)
    """
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise CredentialsException("Invalid or expired token")

    if payload.get("type") != "access":
        raise CredentialsException("Invalid token type, access token required")

    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise CredentialsException("Token missing user ID")

    try:
        user_id = UUID(user_id_str)
    except ValueError:
        raise CredentialsException("Invalid user ID in token")

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise CredentialsException("User not found")

    if not user.is_active:
        raise CredentialsException("User account is deactivated")

    return user
