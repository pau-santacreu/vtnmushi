FROM nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04

# Evitar prompts interactius
ENV DEBIAN_FRONTEND=noninteractive

# Instal·lar Python i ffmpeg (necessari per Whisper)
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Crear symlink per usar python3.11 com a python
RUN ln -sf /usr/bin/python3.11 /usr/bin/python

# Directori de treball
WORKDIR /app

# Instal·lar dependències Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar codi de l'app
COPY . .

# Crear directori d'uploads
RUN mkdir -p uploads

# Port de l'API
EXPOSE 8000

# Arrancar amb Uvicorn
# Fer executable l'script d'inici
RUN chmod +x start.sh

# Arrancar amb migracions + Uvicorn
CMD ["./start.sh"]
