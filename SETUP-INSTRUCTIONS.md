# ============================================
# 🚀 SETUP — vtnmushi (VoiceNotes)
# ============================================
# Segueix aquests passos al terminal de VSCode

# ── 1. Escull on vols el projecte ──────────────
cd ~/Projects  # o on sigui que guardis els projectes

# ── 2. Clona el repo (buit) ────────────────────
git clone https://github.com/pau-santacreu/vtnmushi.git
cd vtnmushi

# ── 3. Crea l'estructura de carpetes ───────────
mkdir -p app/models app/schemas app/api/v1 app/services app/core
mkdir -p alembic/versions uploads docs tests

# ── 4. Crea tots els __init__.py ────────────────
touch app/__init__.py
touch app/models/__init__.py
touch app/schemas/__init__.py
touch app/api/__init__.py
touch app/api/v1/__init__.py
touch app/services/__init__.py
touch app/core/__init__.py
touch tests/__init__.py

# ── 5. Crea fitxers placeholder ────────────────
# App core
touch app/main.py app/config.py app/database.py

# Models
touch app/models/user.py app/models/category.py app/models/note.py app/models/recording.py

# Schemas
touch app/schemas/auth.py app/schemas/category.py app/schemas/note.py app/schemas/recording.py

# API routes
touch app/api/deps.py
touch app/api/v1/auth.py app/api/v1/categories.py app/api/v1/notes.py app/api/v1/recordings.py app/api/v1/transcribe.py

# Services
touch app/services/auth_service.py app/services/note_service.py app/services/transcription_service.py

# Core utils
touch app/core/security.py app/core/exceptions.py

# Tests
touch tests/conftest.py tests/test_auth.py tests/test_notes.py tests/test_transcription.py

# Gitkeeps
touch uploads/.gitkeep alembic/versions/.gitkeep

# ── 6. Copia els fitxers que has baixat de Claude ──
# Copia README.md, .gitignore, .env.example, LICENSE,
# requirements.txt i docs/RD-VoiceNotes.md als seus llocs

# ── 7. Prepara .env local ──────────────────────
cp .env.example .env
# Edita .env amb els teus valors reals

# ── 8. Primer commit + push ────────────────────
git add .
git commit -m "🎉 init: project structure, README, and RD"
git push origin main

# ── 9. Verifica a GitHub ───────────────────────
# Obre https://github.com/pau-santacreu/vtnmushi
# Hauries de veure tot el projecte amb el README renderitzat

echo "✅ Setup complet! Ara pots obrir el projecte amb: code ."
