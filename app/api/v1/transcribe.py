"""
VoiceNotes — Transcription Endpoint
Transcripció directa sense crear nota (útil per integracions).
"""

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.models.user import User
from app.schemas.recording import TranscriptionResponse
from app.core.exceptions import AudioValidationException
from app.api.deps import get_current_user
from app.services.transcription_service import transcription_service
from app.config import settings

router = APIRouter(prefix="/transcribe", tags=["Transcription"])


@router.post("", response_model=TranscriptionResponse)
async def transcribe_audio(
    language: str = Form("ca"),
    audio_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Transcriure un fitxer d'àudio sense crear cap nota.
    Útil per integracions externes (MoltBot, shortcuts, etc.).
    """

    # Validar format
    ext = audio_file.filename.rsplit(".", 1)[-1].lower() if audio_file.filename else ""
    if ext not in settings.allowed_formats_list:
        raise AudioValidationException(
            f"Format '{ext}' not allowed. Use: {', '.join(settings.allowed_formats_list)}"
        )

    # Llegir contingut
    content = await audio_file.read()
    if len(content) > settings.max_audio_size_bytes:
        raise AudioValidationException(
            f"File too large. Maximum: {settings.MAX_AUDIO_SIZE_MB}MB"
        )

    # Transcriure des de bytes (sense guardar permanentment)
    result = transcription_service.transcribe_bytes(
        audio_bytes=content,
        language=language,
        file_ext=ext,
    )

    return TranscriptionResponse(
        text=result.text,
        language=result.language,
        confidence=result.confidence,
        duration_seconds=result.duration_seconds,
    )
