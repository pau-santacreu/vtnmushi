"""
VoiceNotes — Recordings Endpoints
Gestió de gravacions dins d'una nota.
"""

import os
import shutil
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.note import Note
from app.models.recording import Recording
from app.schemas.recording import RecordingResponse
from app.schemas.note import NoteDetailResponse
from app.core.exceptions import NotFoundException
from app.api.deps import get_current_user
from app.api.v1.notes import _save_audio_file

router = APIRouter(prefix="/notes/{note_id}/recordings", tags=["Recordings"])


def _get_user_note(note_id: UUID, user_id: UUID, db: Session) -> Note:
    """Helper per obtenir una nota de l'usuari o llançar 404."""
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()
    if not note:
        raise NotFoundException("Note")
    return note


@router.post("", response_model=NoteDetailResponse, status_code=status.HTTP_201_CREATED)
async def add_recording(
    note_id: UUID,
    language: str = Form("ca"),
    audio_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Afegir una nova gravació a una nota existent.
    L'àudio es transcriu i el text s'afegeix al contingut de la nota.
    """

    note = _get_user_note(note_id, current_user.id, db)

    # Guardar àudio
    file_path, rec_id = _save_audio_file(current_user.id, note.id, audio_file)

    # TODO: Integrar Faster-Whisper aquí (Bloc 3)
    transcription_text = ""
    confidence = None
    duration = None

    # Crear recording
    recording = Recording(
        id=UUID(rec_id),
        note_id=note.id,
        file_path=file_path,
        transcription=transcription_text,
        confidence=confidence,
        duration_seconds=duration,
    )
    db.add(recording)

    # Append transcripció al contingut de la nota
    if transcription_text:
        if note.content:
            note.content += f"\n\n{transcription_text}"
        else:
            note.content = transcription_text

    db.commit()
    db.refresh(note)

    return note


@router.get("", response_model=list[RecordingResponse])
async def list_recordings(
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Llistar totes les gravacions d'una nota."""

    note = _get_user_note(note_id, current_user.id, db)

    recordings = (
        db.query(Recording)
        .filter(Recording.note_id == note.id)
        .order_by(Recording.created_at)
        .all()
    )
    return recordings


@router.get("/{recording_id}", response_model=RecordingResponse)
async def get_recording(
    note_id: UUID,
    recording_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtenir detall d'una gravació específica."""

    note = _get_user_note(note_id, current_user.id, db)

    recording = (
        db.query(Recording)
        .filter(Recording.id == recording_id, Recording.note_id == note.id)
        .first()
    )
    if not recording:
        raise NotFoundException("Recording")

    return recording


@router.delete("/{recording_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recording(
    note_id: UUID,
    recording_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Eliminar una gravació (el fitxer d'àudio i el registre)."""

    note = _get_user_note(note_id, current_user.id, db)

    recording = (
        db.query(Recording)
        .filter(Recording.id == recording_id, Recording.note_id == note.id)
        .first()
    )
    if not recording:
        raise NotFoundException("Recording")

    # Eliminar fitxer del disc
    if os.path.exists(recording.file_path):
        os.remove(recording.file_path)

    db.delete(recording)
    db.commit()
