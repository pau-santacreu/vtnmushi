"""
VoiceNotes — Auth Endpoints
Register, login, refresh, me.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    UserRegister, UserLogin, RefreshTokenRequest,
    TokenResponse, UserResponse,
)
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)
from app.core.exceptions import (
    BadRequestException, ConflictException, CredentialsException,
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: Session = Depends(get_db)):
    """Registrar un nou usuari."""

    existing_user = db.query(User).filter(User.username == data.username).first()
    if existing_user:
        raise ConflictException("Username already taken")

    existing_email = db.query(User).filter(User.email == data.email).first()
    if existing_email:
        raise ConflictException("Email already registered")

    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: Session = Depends(get_db)):
    """Login amb username i password. Retorna JWT tokens."""

    user = db.query(User).filter(User.username == data.username).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise CredentialsException("Invalid username or password")

    if not user.is_active:
        raise CredentialsException("User account is deactivated")

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Renovar l'access token amb un refresh token vàlid."""

    payload = decode_token(data.refresh_token)

    if payload is None:
        raise CredentialsException("Invalid or expired refresh token")

    if payload.get("type") != "refresh":
        raise CredentialsException("Invalid token type, refresh token required")

    user_id = payload.get("sub")
    if user_id is None:
        raise CredentialsException("Token missing user ID")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise CredentialsException("User not found or deactivated")

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Obtenir info de l'usuari autenticat."""
    return current_user