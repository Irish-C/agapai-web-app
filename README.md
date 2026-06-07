# AGAPAI Web App

AGAPAI is a real-time monitoring and alerting web app for elderly care environments. It combines live camera streaming, Socket.IO event delivery, and AI-generated alerts (fall/inactivity) with role-based access control.

**Key Features:**
- **Live Streaming** - HLS video feeds from IP cameras via MediaMTX relay
- **Fall Detection** - Real-time fall alerts with instant notification to caregivers
- **Inactivity Tracking** - 3-tier alerts (low: 5m, medium: 15m, high: 30m inactivity)
- **Role-Based Access** - Admin, supervisor, guard, caregiver roles with JWT auth
- **Event Logging** - All alerts stored in PostgreSQL with acknowledgement tracking
- **Socket.IO Sync** - Real-time event delivery with auto-reconnect + message buffering
- **Dashboard** - Multi-camera grid view with alert modals, camera management, user admin

For UI screenshots and product-level description, see [APP.md](docs/APP.md).

## Quick Links - Documentation

**[View Full Documentation Hub →](docs/GUIDES.md)** (organized by category)

Or jump directly to:
- **[Streaming Setup](docs/STREAMING_SETUP.md)** | **[Alert System](docs/ALERT_SYSTEM.md)** | **[Activity Detection](docs/ACTIVITY_DETECTION_GUIDE.md)**
- **[Auto Reconnect](docs/AUTO_RECONNECT_AND_SYNC.md)** | **[GPU Setup](docs/OPENVINO.md)**

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Setup (dev)](#quick-setup-dev)
- [Database: Prisma & Seeding](#database-prisma--seeding)
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

<!-- MediaMTX streaming docs removed; the project no longer includes streaming runtime by default. -->

## Troubleshooting (common)

- Backend can't reach DB: ensure PostgreSQL is running locally and `DATABASE_URL` environment variable points to it (default: `postgresql://localhost/agapai`).
- Redis connection error: ensure Redis is running on `localhost:6379`. Set `REDIS_HOST` and `REDIS_PORT` in `.env.local` if using non-default values.
- Prisma errors: re-run `npx prisma generate` then `npx prisma migrate deploy`.
- Backend won't start: check that all required services (PostgreSQL, Redis) are running and accessible.

For more detailed troubleshooting see the docs: [Auto Reconnect](docs/AUTO_RECONNECT_AND_SYNC.md), [Reconnect Verification](docs/RECONNECT_VERIFICATION.md), [Socket.IO Testing](docs/SOCKET_IO_TESTING.md).

---

## Project Structure

```text
agapai-web-app/
├── 📄 README.md
├── 📄 package.json & package-lock.json (workspace)
├── 📄 postcss.config.js, tailwind.config.js
│
├── 📁 docs/                           # Documentation (15 guides)
│   ├── GUIDES.md (navigation hub)
│   ├── ACTIVITY_DETECTION_GUIDE.md
│   ├── ALERT_SYSTEM.md
│   ├── AUTO_RECONNECT_AND_SYNC.md
│   └── ... (12 more comprehensive guides)
│
├── 📁 client/                         # React 19 + Vite frontend
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── src/
│   │   ├── components/                # Reusable UI components
│   │   ├── features/                  # Feature modules (camera, manager, auth)
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── pages/                     # Page components (Landing, Login, Dashboard)
│   │   ├── services/                  # API clients (axios, Socket.IO)
│   │   ├── utils/                     # Utilities (role helpers, validation)
│   │   └── App.jsx, main.jsx
│   └── public/
│
├── 📁 server/                         # FastAPI + Socket.IO backend
│   ├── app.py                         # FastAPI app entry, lifespan, routers
│   ├── models.py                      # Database models (User, Camera, Location, etc.)
│   ├── requirements.txt               # Python dependencies
│   ├── seed_db.py                     # Database seeder
│   ├── init_db.py
│   ├── mediamtx.yml                   # MediaMTX relay config
│   ├── venv/                          # Python virtual environment
│   ├── database/                      # Database setup utilities
│   ├── prisma/                        # Prisma schema & migrations
│   ├── ml/
│   │   └── best_openvino_model/       # YOLO v10 model for activity detection
│   ├── src/
│   │   ├── controllers/               # Business logic (user, camera, event)
│   │   ├── middleware/                # FastAPI middleware (sanitization, rate limiting)
│   │   ├── routes/                    # API endpoints (camera, event, auth, video)
│   │   ├── services/                  # Support services (Socket.IO, MediaMTX, Redis)
│   │   ├── utils/                     # Utilities (auth, drawing, serialization, rate limiting)
│   │   ├── workers/                   # Subprocesses (YOLO inference + streaming)
│   │   └── generated/                 # Prisma generated client
│   ├── scripts/                       # Development utilities (GPU verify, cleanup)
│   └── static/snapshots/              # Runtime frame cache
│
├── 📁 database/                       # Database schema (SQL file)
│   └── agapai_db.sql
│
├── 📁 deploy/                         # Deployment configs
│   └── rtsp_ffmpeg.service
│
├── 📁 test-scripts/                   # Testing utilities
│   ├── async_monitor.py               # Real-time monitoring with async inference
│   └── rtsp_capture_post.py           # RTSP frame capture for API testing
│
├── 📄 start_services.sh               # Startup script (MediaMTX, backend, Redis)
├── 📄 restart_all_services.sh         # Restart all services
├── 📄 nodemon.json
├── 📄 .gitignore
├── 📄 LICENSE
└── 📁 .git/
```

### Key Directories Explained

- **docs/** - 15 comprehensive markdown guides (flattened, no subfolders)
- **client/src/features/** - Major UI features (camera grid, user management, auth)
- **server/src/controllers/** - Business logic for each domain (users, cameras, events)
- **server/src/services/** - Long-running background services (Socket.IO, MediaMTX, Redis consumer)
- **server/src/workers/** - Subprocesses for compute-intensive work (YOLO inference, streaming)
- **server/ml/best_openvino_model/** - Deployable YOLO v10 model (XML/BIN format)

---

## Contributing

1. Create a branch for your change.
2. Keep PR scope focused and include verification steps.
3. Use clear commit messages.

See `server/prisma/migrations/` for database change history.

---

## License

MIT — see `LICENSE` in repository root.
