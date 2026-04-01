# --- STAGE 1: Builder ---
FROM python:3.11-slim AS builder
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

# Install only what we need to build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl git && rm -rf /var/lib/apt/lists/*

# Install heavy Python libs into a specific folder
# Use generated requirements without PyTorch to avoid pulling large torch packages
COPY requirements-no-torch.txt requirements.txt ./
RUN pip install --upgrade pip && \
    pip install --user --no-cache-dir -r requirements.txt

# --- STAGE 2: Final Runner ---
FROM python:3.11-slim
WORKDIR /app
ENV DEVICE=CPU

# Install ONLY runtime libraries (no compilers)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg libgl1 libglib2.0-0 ca-certificates postgresql-client nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy only the installed python packages from the builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy Prisma and App code
COPY prisma ./prisma
RUN python -m prisma generate --schema=prisma/schema.prisma

COPY . ./
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 5000 8554
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["uvicorn", "app:asgi_app", "--host", "0.0.0.0", "--port", "5000"]