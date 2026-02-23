"""
VoiceNotes — Recording Model
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Recording(Base):
    __tablename__ = "recordings"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    note_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("notes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_path: Mapped[str] = mapped_column(
        String(500), nullable=False
    )
    duration_seconds: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    transcription: Mapped[str] = mapped_column(
        Text, default="", nullable=False
    )
    confidence: Mapped[float | None] = mapped_column(
        Float, nullable=True  # Confiança mitjana de la transcripció (0.0 - 1.0)
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    note = relationship("Note", back_populates="recordings")

    def __repr__(self) -> str:
        return f"<Recording {self.id} for Note {self.note_id}>"
