#!/bin/bash
# ============================================
# VoiceNotes — Startup Script
# Executa migracions i arrenca l'API
# ============================================

set -e

echo "🔄 Running database migrations..."
python -m alembic upgrade head

echo "🚀 Starting VoiceNotes API..."
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
