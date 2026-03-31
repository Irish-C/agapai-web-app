# Use a cleaner base
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

# Default device for OpenVINO inferencing; can be overridden at runtime
ENV DEVICE=CPU

# System deps (ffmpeg, OpenCV runtime libs, postgresql client, build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg git curl wget build-essential libgl1 libglib2.0-0 libsm6 libxext6 libxrender1 ca-certificates postgresql-client \
    libnuma1 libtbbmalloc2 libgomp1 lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Install Node (for npx/prisma)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*

# ---- Install Torch in its own cached layer ----
COPY requirements-torch.txt ./requirements-torch.txt
RUN pip install --no-cache-dir -r requirements-torch.txt --index-url https://download.pytorch.org/whl/cpu || true

# Copy and install remaining Python deps
COPY requirements.txt ./requirements.txt
# Ensure pip is recent and install remaining Python deps
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Prisma schema + generate (npx)
COPY prisma ./prisma
    # Generate Prisma client using the Python Prisma generator (matches installed python prisma package)
    RUN python -m prisma generate --schema=prisma/schema.prisma

# Copy app code
COPY . ./

# Entrypoint
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
RUN npm install -g prisma@4.16.2

EXPOSE 5000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
# Expose API port and MediaMTX RTSP port (if MediaMTX runs in same host/container)
EXPOSE 8554

CMD ["uvicorn", "app:asgi_app", "--host", "0.0.0.0", "--port", "5000"]