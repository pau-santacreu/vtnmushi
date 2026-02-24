"""
VoiceNotes — Notes Endpoints
CRUD de notes amb suport per àudio i transcripció.
"""

import os
import uuid as uuid_lib
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile, Query, status
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.note import Note
from app.models.category import Category
from app.models.recording import Recording
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse, NoteDetailResponse
from app.core.exceptions import (
    NotFoundException, BadRequestException, AudioValidationException,
)
from app.api.deps import get_current_user
from app.services.transcription_service import transcription_service
from app.config import settings

router = APIRouter(prefix="/notes", tags=["Notes"])

UPLOAD_DIR = "uploads"


def _save_audio_file(user_id: UUID, note_id: UUID, file: UploadFile) -> tuple[str, str]:
    """
    Guarda l'àudio al disc.
    Retorna (file_path, recording_id).
    """
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else ""
    if ext not in settings.allowed_formats_list:
        raise AudioValidationException(
            f"Format '{ext}' not allowed. Use: {', '.join(settings.allowed_formats_list)}"
        )

    recording_id = str(uuid_lib.uuid4())
    dir_path = os.path.join(UPLOAD_DIR, str(user_id), str(note_id))
    os.makedirs(dir_path, exist_ok=True)

    file_path = os.path.join(dir_path, f"{recording_id}.{ext}")
    with open(file_path, "wb") as f:
        content = file.file.read()
        if len(content) > settings.max_audio_size_bytes:
            raise AudioValidationException(
                f"File too large. Maximum: {settings.MAX_AUDIO_SIZE_MB}MB"
            )
        f.write(content)

    return file_path, recording_id


@router.get("", response_model=list[NoteResponse])
async def list_notes(
    category: Optional[UUID] = Query(None, description="Filtrar per categoria"),
    search: Optional[str] = Query(None, description="Cerca al títol i contingut"),
    pinned: Optional[bool] = Query(None, description="Filtrar notes fixades"),
    sort: str = Query("updated_at", description="Camp d'ordenació"),
    order: str = Query("desc", description="asc o desc"),
    page: int = Query(1, ge=1, description="Pàgina"),
    per_page: int = Query(20, ge=1, le=100, description="Elements per pàgina"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Llistar notes de l'usuari amb filtres, cerca i paginació."""

    query = (
        db.query(Note)
        .options(joinedload(Note.category))
        .filter(Note.user_id == current_user.id)
    )

    if category:
        query = query.filter(Note.category_id == category)
    if pinned is not None:
        query = query.filter(Note.is_pinned == pinned)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Note.title.ilike(search_term)) | (Note.content.ilike(search_term))
        )

    allowed_sorts = {"created_at", "updated_at", "title"}
    sort_field = sort if sort in allowed_sorts else "updated_at"
    sort_column = getattr(Note, sort_field)
    if order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    offset = (page - 1) * per_page
    notes = query.offset(offset).limit(per_page).all()

    return notes


@router.post("", response_model=NoteDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    title: str = Form(...),
    category_id: Optional[str] = Form(None),
    language: str = Form("ca"),
    audio_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Crear una nota. Opcionalment amb un fitxer d'àudio que es transcriurà.
    """

    cat_uuid = None
    if category_id:
        try:
            cat_uuid = UUID(category_id)
        except ValueError:
            raise BadRequestException("Invalid category_id format")

        cat = (
            db.query(Category)
            .filter(Category.id == cat_uuid, Category.user_id == current_user.id)
            .first()
        )
        if not cat:
            raise NotFoundException("Category")

    note = Note(
        user_id=current_user.id,
        category_id=cat_uuid,
        title=title,
        language=language,
    )
    db.add(note)
    db.flush()

    if audio_file and audio_file.filename:
        file_path, rec_id = _save_audio_file(current_user.id, note.id, audio_file)

        # Transcriure amb Faster-Whisper
        result = transcription_service.transcribe(file_path, language=language)

        recording = Recording(
            id=UUID(rec_id),
            note_id=note.id,
            file_path=file_path,
            transcription=result.text,
            confidence=result.confidence,
            duration_seconds=result.duration_seconds,
        )
        db.add(recording)

        if result.text:
            note.content = result.text
        note.language = result.language

    db.commit()
    db.refresh(note)

    note = (
        db.query(Note)
        .options(joinedload(Note.category), joinedload(Note.recordings))
        .filter(Note.id == note.id)
        .first()
    )

    return note


@router.get("/{note_id}", response_model=NoteDetailResponse)
async def get_note(
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtenir el detall d'una nota amb les seves gravacions."""

    note = (
        db.query(Note)
        .options(joinedload(Note.category), joinedload(Note.recordings))
        .filter(Note.id == note_id, Note.user_id == current_user.id)
        .first()
    )
    if not note:
        raise NotFoundException("Note")

    return note


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: UUID,
    data: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Editar títol, contingut, categoria o idioma d'una nota."""

    note = (
        db.query(Note)
        .options(joinedload(Note.category))
        .filter(Note.id == note_id, Note.user_id == current_user.id)
        .first()
    )
    if not note:
        raise NotFoundException("Note")

    if data.category_id is not None:
        cat = (
            db.query(Category)
            .filter(Category.id == data.category_id, Category.user_id == current_user.id)
            .first()
        )
        if not cat:
            raise NotFoundException("Category")

    if data.title is not None:
        note.title = data.title
    if data.content is not None:
        note.content = data.content
    if data.category_id is not None:
        note.category_id = data.category_id
    if data.language is not None:
        note.language = data.language

    db.commit()
    db.refresh(note)

    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Eliminar una nota i totes les seves gravacions."""

    note = (
        db.query(Note)
        .filter(Note.id == note_id, Note.user_id == current_user.id)
        .first()
    )
    if not note:
        raise NotFoundException("Note")

    import shutil
    audio_dir = os.path.join(UPLOAD_DIR, str(current_user.id), str(note_id))
    if os.path.exists(audio_dir):
        shutil.rmtree(audio_dir)

    db.delete(note)
    db.commit()


@router.patch("/{note_id}/pin", response_model=NoteResponse)
async def toggle_pin(
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fixar o desafixar una nota (toggle)."""

    note = (
        db.query(Note)
        .options(joinedload(Note.category))
        .filter(Note.id == note_id, Note.user_id == current_user.id)
        .first()
    )
    if not note:
        raise NotFoundException("Note")

    note.is_pinned = not note.is_pinned
    db.commit()
    db.refresh(note)

    return note
