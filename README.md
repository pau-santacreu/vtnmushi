# 🎙️ VoiceNotes — vtnmushi

> **Voice-to-Text Notes API** — Servei de transcripció de veu a text amb IA (Faster-Whisper), amb gestió de notes organitzades per categories.

---

## 📋 Descripció

VoiceNotes és una API REST que permet crear notes de veu, transcriure-les automàticament a text mitjançant Faster-Whisper (model `large-v3`), i gestionar-les amb títols, categories i edició de text.

### Funcionalitats principals

- 🎤 Transcripció de veu a text amb suport excel·lent per al **català**
- 📝 Notes amb **títol**, **categoria** i **contingut editable**
- 🔄 **Ampliació de notes** amb múltiples gravacions successives
- 👥 Sistema **multi-usuari** amb autenticació JWT
- 🐳 Desplegament amb **Docker** i suport GPU (CUDA)
- 🔌 API REST pura, integrable amb qualsevol client

## 🏗️ Stack Tecnològic

| Component        | Tecnologia                          |
|------------------|-------------------------------------|
| Llenguatge       | Python 3.11+                        |
| Framework        | FastAPI + Uvicorn                   |
| STT Engine       | Faster-Whisper (`large-v3`)         |
| Base de dades    | PostgreSQL 16                       |
| ORM              | SQLAlchemy 2.0 + Alembic            |
| Auth             | JWT (access + refresh tokens)       |
| Contenidors      | Docker + Docker Compose             |

## 📁 Estructura del Projecte

```
vtnmushi/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── alembic.ini
├── requirements.txt
├── README.md
├── app/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models/
│   ├── schemas/
│   ├── api/v1/
│   ├── services/
│   └── core/
├── alembic/
├── uploads/
├── docs/
└── tests/
```

## 🚀 Quick Start

```bash
# Clonar el repositori
git clone https://github.com/pau-santacreu/vtnmushi.git
cd vtnmushi

# Copiar configuració
cp .env.example .env
# Editar .env amb els teus valors

# Arrancar amb Docker
docker compose up -d

# L'API estarà disponible a http://localhost:8069
# Documentació Swagger: http://localhost:8069/docs
```

## 📖 Documentació

- [Requisits del Projecte (RD)](docs/RD-VoiceNotes.md)

## 📄 Llicència

MIT License — veure [LICENSE](LICENSE)
