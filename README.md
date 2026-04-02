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
- PostgreSQL 14+ (local database)
- Redis (for frame caching and real-time messaging)
- Git

Notes:
- On Windows use PowerShell for the provided PowerShell commands; Git Bash also works for shell scripts.
- Ensure PostgreSQL and Redis services are running before starting the backend.

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

3. Start PostgreSQL and Redis

```powershell
# Ensure PostgreSQL service is running (Windows: Services app or brew services start postgresql)
# Ensure Redis is running locally (Windows: redis-server or WSL: redis-server)
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

---

## MediaMTX (streaming)

MediaMTX provides RTSP/HLS/WebRTC bridging for camera streams. Run the local binary:

```powershell
cd server
# On Windows
.\mediamtx.exe mediamtx.yml

# On Linux/macOS
./mediamtx mediamtx.yml
```

Edit `server/mediamtx.yml` to add RTSP camera sources. Default ports used by the project: 8554 (RTSP), 8888 (HLS), 8889 (WebRTC HTTP).

---

## Troubleshooting (common)

- Backend can't reach DB: ensure PostgreSQL is running locally and `DATABASE_URL` environment variable points to it (default: `postgresql://localhost/agapai`).
- Redis connection error: ensure Redis is running on `localhost:6379`. Set `REDIS_HOST` and `REDIS_PORT` in `.env.local` if using non-default values.
- Prisma errors: re-run `npx prisma generate` then `npx prisma migrate deploy`.
- Backend won't start: check that all required services (PostgreSQL, Redis) are running and accessible.

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
