# Use a cleaner base
FROM python:3.11-slim

WORKDIR /app

# 1. Install ONLY the necessary system libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    libatomic1 curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Node (Prisma needs it) using a smaller method
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# 3. Copy ONLY the requirements first (Better Caching)
COPY requirements.txt .
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
# TIP: If you don't need GPU, use: 
# RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy ONLY the Prisma schema first to generate the client
# This prevents re-generating every time you change a Python file
COPY server/prisma ./prisma
RUN prisma generate --schema=prisma/schema.prisma

# 5. Copy the rest of the code, but IGNORE the heavy stuff
# IMPORTANT: Create a .dockerignore file (see below)
COPY . .

EXPOSE 5000

CMD ["uvicorn", "app:asgi_app", "--host", "0.0.0.0", "--port", "5000"]