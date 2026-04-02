# AGAPAI Web App

AGAPAI is a real-time monitoring and alerting web app for elderly care environments. It combines live camera streaming, Socket.IO event delivery, and AI-generated alerts (fall/inactivity) with role-based access control.

For UI screenshots and product-level description, see [APP.md](APP.md).

## Quick Links

- Changelog: use git history / see `server/prisma/migrations/`
- Architecture: [AUTO_RECONNECT_AND_SYNC.md](AUTO_RECONNECT_AND_SYNC.md)
- QA/Testing: [SOCKET_IO_TESTING.md](SOCKET_IO_TESTING.md)

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Setup (dev)](#quick-setup-dev)
- [Run (dev & Docker)](#run-dev--docker)
- [Database: Prisma & Seeding](#database-prisma--seeding)
- [MediaMTX (streaming)](#mediamtx-streaming)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

---

## Prerequisites

Install these before development:

- Node.js 18+ (frontend)
- Python 3.10+ (backend)
- Docker Desktop (recommended for local DB / MediaMTX)
- Git

Notes:
- You can run PostgreSQL locally or with Docker Compose (recommended for parity).
- On Windows use PowerShell for the provided PowerShell commands; Git Bash also works for shell scripts.

---

## Quick Setup (dev)

These steps get the app running locally for development (frontend + backend). Use PowerShell on Windows.

1. Clone and install frontend deps

```powershell
git clone https://github.com/Irish-C/agapai-web-app.git
cd agapai-web-app
cd client
npm ci
```

2. Prepare backend environment

```powershell
cd ..\server
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
```

3. Start Postgres (Docker Compose)

```powershell
# from repo root
docker compose up -d postgres
```

4. Generate Prisma client and apply migrations

```powershell
# in server/ with venv activated
npx prisma generate --schema=prisma/schema.prisma
npx prisma migrate deploy --schema=prisma/schema.prisma
```

5. Seed database (optional)

```powershell
# set seed password and run seeder
$env:AGAPAI_SEED_PASSWORD="agapai143"
python seed_db.py
```

6. Run backend and frontend in separate terminals

```powershell
# backend (server/ with venv active)
python -m uvicorn app:asgi_app --reload --host 127.0.0.1 --port 5000

# frontend (client/)
npm run dev
```

Default local URLs:
- Frontend: http://127.0.0.1:5173
- Backend: http://127.0.0.1:5000

---

## Run (dev & Docker)

Recommended: use Docker Compose to reproduce a production-like environment (server + postgres). The Compose config also helps with MediaMTX when present.

Build and run server + Postgres:

```powershell
# builds server image (client/dist should be built first if you want static assets baked into image)
cd client
npm ci
npm run build
cd ..

docker compose up -d --build server postgres
```

**Env Files**
- **.env.local**: Local development environment file (repo root). Copy from `.env.example` and edit values for your machine. Example:

```powershell
Copy-Item .env.example .env.local
```

- **.env.docker**: Docker runtime environment file (repo root). Used by `docker/docker-compose.yml` (referenced as `../.env.docker`). Do not commit secrets.

The server code prefers `.env.local` when present and falls back to `server/.env` for compatibility.
Tail logs:

```powershell
docker compose logs -f server --no-log-prefix --timestamps
```

Run only frontend or backend during development using `npm run dev-client` or `npm run dev-server` as needed.

---

## Database: Prisma & Seeding

- Generate Prisma client after installing Node (required for Prisma tooling):

```powershell
npx prisma generate --schema=prisma/schema.prisma
```

- Apply migrations:

```powershell
npx prisma migrate deploy --schema=prisma/schema.prisma
```

- Run seeder (uses `AGAPAI_SEED_PASSWORD` env):

```powershell
$env:AGAPAI_SEED_PASSWORD="agapai143"
python seed_db.py
```

If you use Docker Compose you can run the seeder inside the built image:

```powershell
docker compose run --rm -e AGAPAI_SEED_PASSWORD=agapai143 seed
```

---

## MediaMTX (streaming)

MediaMTX provides RTSP/HLS/WebRTC bridging for camera streams. Two common options:

1. Docker (recommended)

```powershell
docker compose up -d mediamtx
```

2. Native Windows binary

```powershell
cd server
# run Mediamtx with provided config
.\mediamtx.exe mediamtx.yml
```

Edit `server/mediamtx.yml` to add RTSP camera sources. Default ports used by the project: 8554 (RTSP), 8888 (HLS), 8889 (WebRTC HTTP).

---

## Troubleshooting (common)

- Backend can't reach DB: ensure Postgres is running and `DATABASE_URL` is correct. When using Compose, container uses compose host `postgres`.
- Prisma errors: re-run `npx prisma generate` then `npx prisma migrate deploy`.
- Docker not found: install Docker Desktop and restart your shell.
- Frontend fails to load assets after server rebuild: rebuild client (`npm run build`) and rebuild server image so `client/dist` is included.

For more detailed troubleshooting see the docs: `AUTO_RECONNECT_AND_SYNC.md`, `RECONNECT_VERIFICATION.md`, `SOCKET_IO_TESTING.md`.

---

## Project Structure

```text
agapai-web-app/
├── client/                  # React + Vite frontend
│   ├── src/components/
│   ├── src/features/
│   ├── src/hooks/
│   └── src/services/
├── server/                  # FastAPI + Socket.IO backend
│   ├── app.py
│   ├── prisma/
│   ├── src/
│   └── ml/
└── README.md
```

---

## Contributing

1. Create a branch for your change.
2. Keep PR scope focused and include verification steps.
3. Use clear commit messages.

See `server/prisma/migrations/` for database change history.

---

## License

MIT — see `LICENSE` in repository root.
