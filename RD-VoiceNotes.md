# 🎙️ VoiceNotes — Requisits del Projecte (RD)

> **Voice-to-Text Notes API** — Servei de transcripció de veu a text amb IA, amb gestió de notes organitzades per categories.

---

## 1. Visió General

**VoiceNotes** és una API REST autònoma que permet als usuaris crear notes de veu, transcriure-les automàticament a text mitjançant Faster-Whisper (model `large-v3`), i gestionar-les amb títols, categories i edició de text. El servei està dissenyat per ser consumit des de qualsevol client: web app, bot de missatgeria, PWA, shortcuts mòbils, etc.

### 1.1 Objectius

- Transcripció de veu a text amb suport excel·lent per al **català** i altres idiomes.
- Gestió de notes amb **títol**, **categoria** i **contingut editable**.
- Possibilitat d'**ampliar una nota** amb múltiples gravacions successives.
- Sistema **multi-usuari** amb autenticació.
- Desplegament amb **Docker** al servidor Proxmox (VEGAPUNK).
- API REST pura, desacoblada de qualsevol frontend.

---

## 2. Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTS                           │
│  Web App · Bot WhatsApp/TG · PWA · Shortcuts · ...  │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS (via Nginx Proxy Manager)
                       ▼
┌─────────────────────────────────────────────────────┐
│              VoiceNotes API (FastAPI)                │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Auth Module  │  │ Notes CRUD   │  │ STT Engine │ │
│  │ (JWT)        │  │ (Categories) │  │ (Whisper)  │ │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                │                │         │
│         ▼                ▼                ▼         │
│  ┌─────────────────────────────────────────────────┐│
│  │              PostgreSQL Database                 ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │         Fitxers d'àudio (volum Docker)          ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### 2.1 Stack Tecnològic

| Component        | Tecnologia                          |
|------------------|-------------------------------------|
| **Llenguatge**   | Python 3.11+                        |
| **Framework**    | FastAPI + Uvicorn                   |
| **STT Engine**   | Faster-Whisper (`large-v3`)         |
| **Base de dades**| PostgreSQL 16                       |
| **ORM**          | SQLAlchemy 2.0 + Alembic (migracions) |
| **Auth**         | JWT (access + refresh tokens)       |
| **Contenidors**  | Docker + Docker Compose             |
| **Reverse Proxy**| Nginx Proxy Manager (existent)      |
| **GPU**          | NVIDIA GTX 1080 Ti (CUDA)          |

---

## 3. Model de Dades

### 3.1 Diagrama ER

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    users     │       │     categories   │       │      notes       │
├──────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)      │──┐    │ id (PK)          │──┐    │ id (PK)          │
│ username     │  │    │ user_id (FK)     │  │    │ user_id (FK)     │
│ email        │  │    │ name             │  │    │ category_id (FK) │
│ password_hash│  │    │ color            │  │    │ title            │
│ is_active    │  │    │ created_at       │  │    │ content          │
│ created_at   │  │    └──────────────────┘  │    │ language         │
│ updated_at   │  │                          │    │ is_pinned        │
└──────────────┘  │                          │    │ created_at       │
                  │                          │    │ updated_at       │
                  │    ┌──────────────────┐  │    └──────────────────┘
                  │    │   recordings     │  │             │
                  │    ├──────────────────┤  │             │
                  │    │ id (PK)          │  │             │
                  └───▶│ note_id (FK)     │──┘             │
                       │ file_path        │◀───────────────┘
                       │ duration_seconds │
                       │ transcription    │
                       │ confidence       │
                       │ created_at       │
                       └──────────────────┘
```

### 3.2 Detall de les Taules

#### `users`
| Camp          | Tipus         | Descripció                    |
|---------------|---------------|-------------------------------|
| id            | UUID (PK)     | Identificador únic            |
| username      | VARCHAR(50)   | Nom d'usuari (únic)          |
| email         | VARCHAR(255)  | Correu electrònic (únic)     |
| password_hash | VARCHAR(255)  | Hash bcrypt de la contrasenya |
| is_active     | BOOLEAN       | Compte actiu/desactivat       |
| created_at    | TIMESTAMP     | Data de creació               |
| updated_at    | TIMESTAMP     | Última modificació            |

#### `categories`
| Camp       | Tipus         | Descripció                         |
|------------|---------------|------------------------------------|
| id         | UUID (PK)     | Identificador únic                 |
| user_id    | UUID (FK)     | Propietari de la categoria         |
| name       | VARCHAR(100)  | Nom de la categoria                |
| color      | VARCHAR(7)    | Color HEX per UI (ex: `#FF5733`)  |
| created_at | TIMESTAMP     | Data de creació                    |

#### `notes`
| Camp         | Tipus         | Descripció                           |
|--------------|---------------|--------------------------------------|
| id           | UUID (PK)     | Identificador únic                   |
| user_id      | UUID (FK)     | Propietari de la nota                |
| category_id  | UUID (FK)     | Categoria assignada (nullable)       |
| title        | VARCHAR(255)  | Títol de la nota                     |
| content      | TEXT          | Contingut complet (editable)         |
| language     | VARCHAR(10)   | Idioma detectat/forçat (ex: `ca`)   |
| is_pinned    | BOOLEAN       | Nota fixada a dalt                   |
| created_at   | TIMESTAMP     | Data de creació                      |
| updated_at   | TIMESTAMP     | Última modificació                   |

#### `recordings`
| Camp             | Tipus         | Descripció                              |
|------------------|---------------|-----------------------------------------|
| id               | UUID (PK)     | Identificador únic                      |
| note_id          | UUID (FK)     | Nota a la qual pertany                  |
| file_path        | VARCHAR(500)  | Ruta al fitxer d'àudio                 |
| duration_seconds | FLOAT         | Durada de la gravació                   |
| transcription    | TEXT          | Text transcrit d'aquesta gravació       |
| confidence       | FLOAT         | Confiança mitjana de la transcripció    |
| created_at       | TIMESTAMP     | Data de creació                         |

### 3.3 Relacions Clau

- Un **user** té moltes **categories** i moltes **notes**.
- Una **note** pertany a un **user** i opcionalment a una **category**.
- Una **note** pot tenir múltiples **recordings** (ampliació progressiva).
- El camp `content` de la nota és el **text consolidat** de totes les transcripcions, editable manualment.

---

## 4. API Endpoints

### 4.1 Autenticació

| Mètode | Endpoint              | Descripció                    |
|--------|-----------------------|-------------------------------|
| POST   | `/api/v1/auth/register` | Registre d'un nou usuari      |
| POST   | `/api/v1/auth/login`    | Login, retorna JWT tokens     |
| POST   | `/api/v1/auth/refresh`  | Renovar access token          |
| GET    | `/api/v1/auth/me`       | Info de l'usuari autenticat   |

### 4.2 Categories

| Mètode | Endpoint                    | Descripció                    |
|--------|-----------------------------|-------------------------------|
| GET    | `/api/v1/categories`        | Llistar categories de l'usuari|
| POST   | `/api/v1/categories`        | Crear categoria               |
| PUT    | `/api/v1/categories/{id}`   | Editar categoria              |
| DELETE | `/api/v1/categories/{id}`   | Eliminar categoria            |

### 4.3 Notes

| Mètode | Endpoint                           | Descripció                         |
|--------|------------------------------------|------------------------------------|
| GET    | `/api/v1/notes`                    | Llistar notes (amb filtres/cerca)  |
| POST   | `/api/v1/notes`                    | Crear nota (amb àudio opcional)    |
| GET    | `/api/v1/notes/{id}`               | Detall d'una nota                  |
| PUT    | `/api/v1/notes/{id}`               | Editar títol/contingut/categoria   |
| DELETE | `/api/v1/notes/{id}`               | Eliminar nota                      |
| PATCH  | `/api/v1/notes/{id}/pin`           | Fixar/desafixar nota               |

### 4.4 Recordings (Gravacions)

| Mètode | Endpoint                                      | Descripció                              |
|--------|-----------------------------------------------|-----------------------------------------|
| POST   | `/api/v1/notes/{id}/recordings`               | Afegir gravació a una nota existent     |
| GET    | `/api/v1/notes/{id}/recordings`               | Llistar gravacions d'una nota           |
| GET    | `/api/v1/notes/{id}/recordings/{rec_id}`      | Detall d'una gravació                   |
| DELETE | `/api/v1/notes/{id}/recordings/{rec_id}`      | Eliminar una gravació                   |

### 4.5 Transcripció Directa

| Mètode | Endpoint                    | Descripció                                  |
|--------|-----------------------------|---------------------------------------------|
| POST   | `/api/v1/transcribe`        | Transcriure àudio sense crear nota          |

> **Nota:** Aquest endpoint és útil per integracions que només necessiten STT pur, sense gestió de notes.

### 4.6 Query Parameters Comuns (GET /notes)

| Paràmetre    | Tipus   | Descripció                              |
|--------------|---------|-----------------------------------------|
| `category`   | UUID    | Filtrar per categoria                   |
| `search`     | string  | Cerca full-text al títol i contingut    |
| `pinned`     | boolean | Filtrar notes fixades                   |
| `sort`       | string  | Camp d'ordenació (`created_at`, `updated_at`, `title`) |
| `order`      | string  | `asc` o `desc`                          |
| `page`       | int     | Pàgina (paginació)                      |
| `per_page`   | int     | Elements per pàgina (default: 20)       |

---

## 5. Flux de Treball Principal

### 5.1 Crear una Nota amb Veu

```
Client                          API                         Whisper
  │                              │                             │
  │  POST /notes                 │                             │
  │  { title, category_id,       │                             │
  │    audio_file, language? }   │                             │
  │─────────────────────────────▶│                             │
  │                              │  Transcriure àudio          │
  │                              │────────────────────────────▶│
  │                              │◀────────────────────────────│
  │                              │  { text, confidence, lang } │
  │                              │                             │
  │                              │  Crear nota + recording     │
  │                              │  content = transcription    │
  │◀─────────────────────────────│                             │
  │  { note completa }           │                             │
```

### 5.2 Ampliar una Nota amb Nova Gravació

```
Client                          API                         Whisper
  │                              │                             │
  │  POST /notes/{id}/recordings │                             │
  │  { audio_file, language? }   │                             │
  │─────────────────────────────▶│                             │
  │                              │  Transcriure àudio          │
  │                              │────────────────────────────▶│
  │                              │◀────────────────────────────│
  │                              │  { text, confidence }       │
  │                              │                             │
  │                              │  Crear recording            │
  │                              │  Append text a note.content │
  │◀─────────────────────────────│                             │
  │  { nota actualitzada }       │                             │
```

### 5.3 Editar una Nota (Text)

```
Client                          API
  │                              │
  │  PUT /notes/{id}             │
  │  { title?, content?,         │
  │    category_id? }            │
  │─────────────────────────────▶│
  │                              │  Actualitzar camps
  │◀─────────────────────────────│
  │  { nota actualitzada }       │
```

---

## 6. Configuració i Desplegament

### 6.1 Estructura del Projecte

```
voicenotes/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── alembic.ini
├── README.md
├── requirements.txt
│
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app + startup
│   ├── config.py               # Settings (pydantic-settings)
│   ├── database.py             # SQLAlchemy engine + sessions
│   │
│   ├── models/                 # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── category.py
│   │   ├── note.py
│   │   └── recording.py
│   │
│   ├── schemas/                # Pydantic schemas (request/response)
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── category.py
│   │   ├── note.py
│   │   └── recording.py
│   │
│   ├── api/                    # Routers
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── categories.py
│   │   │   ├── notes.py
│   │   │   ├── recordings.py
│   │   │   └── transcribe.py
│   │   └── deps.py             # Dependencies (auth, db session)
│   │
│   ├── services/               # Business logic
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── note_service.py
│   │   └── transcription_service.py
│   │
│   └── core/                   # Utils
│       ├── __init__.py
│       ├── security.py         # JWT, hashing
│       └── exceptions.py       # Custom exceptions
│
├── alembic/                    # Database migrations
│   ├── env.py
│   └── versions/
│
├── uploads/                    # Fitxers d'àudio (volum Docker)
│
└── tests/
    ├── __init__.py
    ├── conftest.py
    ├── test_auth.py
    ├── test_notes.py
    └── test_transcription.py
```

### 6.2 Docker Compose

```yaml
# docker-compose.yml (esquema)
services:
  api:
    build: .
    ports:
      - "8069:8000"
    environment:
      - DATABASE_URL=postgresql://voicenotes:password@db:5432/voicenotes
      - JWT_SECRET_KEY=...
      - WHISPER_MODEL=large-v3
      - WHISPER_DEVICE=cuda
    volumes:
      - ./uploads:/app/uploads
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=voicenotes
      - POSTGRES_USER=voicenotes
      - POSTGRES_PASSWORD=password
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### 6.3 Variables d'Entorn

```bash
# .env.example
DATABASE_URL=postgresql://voicenotes:password@db:5432/voicenotes
JWT_SECRET_KEY=canvia-aixo-per-un-secret-segur
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
WHISPER_MODEL=large-v3
WHISPER_DEVICE=cuda          # cuda | cpu
WHISPER_COMPUTE_TYPE=float16 # float16 (GPU) | int8 (CPU)
MAX_AUDIO_SIZE_MB=50
ALLOWED_AUDIO_FORMATS=wav,mp3,ogg,m4a,webm,flac
DEFAULT_LANGUAGE=ca           # Idioma per defecte
```

---

## 7. Consideracions Tècniques

### 7.1 Transcripció

- **Model**: Faster-Whisper `large-v3` amb CTranslate2 per rendiment òptim.
- **GPU**: La GTX 1080 Ti amb 11GB VRAM és suficient per `large-v3` amb `float16`.
- **Idioma**: Per defecte `ca` (català), configurable per petició.
- **Àudio**: Accepta WAV, MP3, OGG, M4A, WebM, FLAC. Conversió interna amb ffmpeg si cal.
- **Processament**: La transcripció es fa de forma **síncrona** en la primera versió. Si el temps de resposta és un problema, es pot migrar a una cua async (Celery + Redis) en futures iteracions.

### 7.2 Autenticació

- **JWT** amb access token (30 min) + refresh token (7 dies).
- Passwords hashejats amb **bcrypt**.
- Tokens a la capçalera `Authorization: Bearer <token>`.

### 7.3 Gestió de Fitxers d'Àudio

- Els àudios es guarden al volum Docker `uploads/`.
- Estructura: `uploads/{user_id}/{note_id}/{recording_id}.{ext}`
- Quan s'elimina una nota, s'eliminen tots els àudios associats.

### 7.4 Consolidació de Contingut

Quan s'afegeix una nova gravació a una nota:
1. Es transcriu l'àudio.
2. Es guarda la transcripció individual a `recordings.transcription`.
3. S'afegeix (append) el text transcrit al camp `notes.content` amb un separador (`\n\n`).
4. L'usuari pot editar `notes.content` lliurement via `PUT /notes/{id}`.

> **Important**: Un cop l'usuari edita el `content` manualment, les edicions es preserven. Les noves gravacions s'afegeixen al final del contingut existent.

---

## 8. Fases de Desenvolupament

### Fase 1 — MVP (Core)
- [  ] Configuració del projecte (Docker, PostgreSQL, FastAPI)
- [  ] Model de dades + migracions Alembic
- [  ] Sistema d'autenticació (register, login, JWT)
- [  ] CRUD de categories
- [  ] CRUD de notes (sense àudio)
- [  ] Integració Faster-Whisper (transcripció bàsica)
- [  ] Endpoint de crear nota amb àudio
- [  ] Endpoint d'ampliar nota amb nova gravació
- [  ] Endpoint de transcripció directa

### Fase 2 — Funcionalitats Addicionals
- [  ] Cerca full-text a les notes
- [  ] Paginació i filtres avançats
- [  ] Pin/unpin de notes
- [  ] Tests unitaris i d'integració
- [  ] Documentació OpenAPI/Swagger

### Fase 3 — Optimització i Extras (Futur)
- [  ] Processament async amb cua de tasques (Celery/Redis)
- [  ] Detecció automàtica d'idioma
- [  ] Timestamps per paraula (WhisperX)
- [  ] Diarització (identificar parlants)
- [  ] Export de notes (Markdown, PDF)
- [  ] Webhooks per notificacions
- [  ] Rate limiting
- [  ] Integració amb MoltBot (skill de reconeixement)

---

## 9. Requisits del Servidor

| Recurs        | Mínim              | Recomanat                    |
|---------------|--------------------|------------------------------|
| **CPU**       | 4 cores            | 8 cores                      |
| **RAM**       | 8 GB               | 16 GB                        |
| **GPU VRAM**  | 6 GB (medium)      | 11 GB (large-v3 float16)     |
| **Disc**      | 20 GB (model+app)  | 50 GB+ (segons volum àudios) |
| **CUDA**      | 11.x               | 12.x                         |

---

## 10. Seguretat

- Tots els endpoints (excepte `/auth/register` i `/auth/login`) requereixen JWT vàlid.
- Cada usuari només pot accedir a les seves pròpies notes i categories.
- Validació de fitxers d'àudio: mida màxima, formats permesos, verificació MIME type.
- Sanitització d'inputs per prevenir SQL injection (gestionat per SQLAlchemy).
- CORS configurable per limitar orígens.
- HTTPS obligatori (gestionat per Nginx Proxy Manager + Let's Encrypt).

---

*Document generat el 23/02/2026 — VoiceNotes v0.1.0*
