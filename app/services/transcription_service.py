"""
VoiceNotes — Transcription Service
Integració amb Faster-Whisper per STT.
"""

import logging
from dataclasses import dataclass
from pathlib import Path

from faster_whisper import WhisperModel

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class TranscriptionResult:
    """Resultat d'una transcripció."""
    text: str
    language: str
    confidence: float | None
    duration_seconds: float | None


class TranscriptionService:
    """
    Servei singleton per transcriure àudio amb Faster-Whisper.
    El model es carrega un sol cop a memòria (GPU/CPU).
    """

    _instance: "TranscriptionService | None" = None
    _model: WhisperModel | None = None

    def __new__(cls) -> "TranscriptionService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _load_model(self) -> WhisperModel:
        """Carrega el model Whisper si no s'ha carregat encara."""
        if self._model is None:
            logger.info(
                f"Loading Whisper model '{settings.WHISPER_MODEL}' "
                f"on {settings.WHISPER_DEVICE} ({settings.WHISPER_COMPUTE_TYPE})..."
            )
            self._model = WhisperModel(
                settings.WHISPER_MODEL,
                device=settings.WHISPER_DEVICE,
                compute_type=settings.WHISPER_COMPUTE_TYPE,
            )
            logger.info("Whisper model loaded successfully!")
        return self._model

    def transcribe(
        self,
        audio_path: str,
        language: str | None = None,
    ) -> TranscriptionResult:
        """
        Transcriu un fitxer d'àudio.

        Args:
            audio_path: Ruta al fitxer d'àudio.
            language: Codi d'idioma (ex: 'ca', 'es', 'en'). None = autodetecció.

        Returns:
            TranscriptionResult amb text, idioma, confiança i durada.
        """
        model = self._load_model()

        # Usar idioma per defecte si no s'especifica
        lang = language or settings.DEFAULT_LANGUAGE

        logger.info(f"Transcribing: {audio_path} (language={lang})")

        segments, info = model.transcribe(
            audio_path,
            language=lang,
            beam_size=5,
            vad_filter=True,          # Filtra silencis
            vad_parameters=dict(
                min_silence_duration_ms=500,
            ),
        )

        # Recollir tots els segments
        all_segments = list(segments)

        # Construir text complet
        text = " ".join(segment.text.strip() for segment in all_segments)

        # Calcular confiança mitjana
        confidence = None
        if all_segments:
            avg_logprob = sum(s.avg_logprob for s in all_segments) / len(all_segments)
            # Convertir log probability a percentatge (aproximat)
            import math
            confidence = round(math.exp(avg_logprob), 4)

        # Durada total
        duration = round(info.duration, 2) if info.duration else None

        detected_language = info.language or lang

        logger.info(
            f"Transcription done: {len(text)} chars, "
            f"lang={detected_language}, confidence={confidence}, "
            f"duration={duration}s"
        )

        return TranscriptionResult(
            text=text,
            language=detected_language,
            confidence=confidence,
            duration_seconds=duration,
        )

    def transcribe_bytes(
        self,
        audio_bytes: bytes,
        language: str | None = None,
        file_ext: str = "wav",
    ) -> TranscriptionResult:
        """
        Transcriu àudio des de bytes (sense guardar a disc permanentment).
        Útil per l'endpoint /transcribe directe.

        Args:
            audio_bytes: Contingut del fitxer d'àudio.
            language: Codi d'idioma.
            file_ext: Extensió del fitxer.

        Returns:
            TranscriptionResult.
        """
        import tempfile
        import os

        # Guardar temporalment per que Whisper pugui llegir-lo
        with tempfile.NamedTemporaryFile(
            suffix=f".{file_ext}", delete=False
        ) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            result = self.transcribe(tmp_path, language=language)
        finally:
            # Netejar fitxer temporal
            os.unlink(tmp_path)

        return result


# Singleton global
transcription_service = TranscriptionService()
