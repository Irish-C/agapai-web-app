# AGAPAI Web App

AGAPAI is a real-time monitoring and alerting web app for elderly care environments. It combines live camera streaming, Socket.IO event delivery, and AI-generated alerts (fall/inactivity) with role-based access control.

For product screenshots and UI-focused description, see [APP.md](APP.md).


## Table of Contents

- [Changelog](#changelog)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Run the App](#run-the-app)
- [Project Structure](#project-structure)
- [Realtime Reconnect and Sync Docs](#realtime-reconnect-and-sync-docs)
- [Troubleshooting](#troubleshooting)
- [Contribution](#contribution)

## Changelog

- See commit history for detailed changes.
- Major updates and migration scripts are documented in the `server/prisma/migrations/` folder.

## Tech Stack

- Frontend: React 19 + Vite + Tailwind CSS
- Backend: FastAPI + Uvicorn + Python Socket.IO
- Database: Prisma + PostgreSQL
- Realtime: Socket.IO (aggressive reconnect, missed-alert sync)
- AI/Vision: Ultralytics YOLO (server-side inference)

## Prerequisites



You must have the following installed:

- [Node.js 18+](https://nodejs.org/en/download/) (for frontend)
- [Python 3.10+](https://www.python.org/downloads/) (for backend)
- [PostgreSQL](https://www.postgresql.org/download/) (for database) **or use Docker Compose (see below)**
- [Git](https://git-scm.com/downloads)

**Optional: Run PostgreSQL with Docker Compose**

If you prefer not to install PostgreSQL directly, you can use Docker Compose:

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. Use the provided `docker-compose.yml` to start a local database:
	```bash
	docker compose up -d
	```
3. Your `.env` should use: `DATABASE_URL="postgresql://devuser:devpass@localhost:5432/agapai_db"`
4. To stop: `docker compose down` (add `-v` to remove data)

**Windows users:**

## Installation

1. **Clone the repository and install dependencies**

```bash
git clone https://github.com/Irish-C/agapai-web-app.git
cd agapai-web-app
npm install
```

2. **Set up backend Python environment (Windows only)**

```powershell
cd server
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
cd ..
```
bash server/scripts/setup_dev_db.sh

### Database Setup & Prisma Client Generation (Windows only)

**Step 1:** (Optional) If you want to use the helper script for database setup, run in Git Bash:

```bash
bash server/scripts/setup_dev_db.sh
```

Or manually create the database and user in PostgreSQL using pgAdmin or psql.

**Step 2:** Activate the virtual environment and generate Prisma client:

```powershell
cd server
.\venv\Scripts\activate
npx prisma generate --schema=prisma/schema.prisma
cd ..
```

**Step 3:** Run Prisma migrations to create/update your database schema:

```powershell
npx prisma migrate deploy --schema=server/prisma/schema.prisma
```

**(Optional) Seed the database with initial data:**

```powershell
cd server
$env:AGAPAI_SEED_PASSWORD="admin123"
.\venv\Scripts\python.exe seed_db.py
cd ..
```


## MediaMTX Streaming Server Setup (Windows only)

MediaMTX is used for RTSP/HLS/WebRTC streaming. You can run it via Docker (recommended) or manually on Windows.

### Option 1: Run MediaMTX with Docker (Recommended)

1. Ensure Docker Desktop is installed and running.
2. Use the provided `docker-compose.yml`:

	```powershell
	docker compose up -d mediamtx
	```
	This will start MediaMTX and expose the necessary ports (RTSP, HLS, WebRTC, etc.).
3. The config file is mounted from `server/mediamtx.yml`.

### Option 2: Run MediaMTX Manually

1. Download the latest `mediamtx.exe` from the [official releases](https://github.com/bluenviron/mediamtx/releases) or use the included binary in `server/mediamtx.exe`.
2. Open PowerShell, navigate to the `server` directory:
	```powershell
	cd server
	.\mediamtx.exe mediamtx.yml
	```
3. The server will start and use the config in `mediamtx.yml`.

### Configuration
- Edit `server/mediamtx.yml` to add or update camera RTSP sources.
- Ports (default): 8554 (RTSP), 8888 (HLS), 8889 (WebRTC HTTP), 8189/udp (WebRTC ICE), 1935 (RTMP), 8890/udp (SRT)

### Troubleshooting
- If you get errors about missing DLLs, ensure you have the correct binary and run as Administrator if needed.
- If ports are in use, stop other streaming servers or change the ports in `mediamtx.yml`.
- For Docker, ensure the ports are not blocked by firewall/antivirus.

---
## Quick Start

1. Install all prerequisites and follow the installation steps above.
2. Start the app:

```bash
npm run dev
```

This will launch both frontend (Vite) and backend (FastAPI) servers.

4. Set up database and Prisma artifacts.

```bash
bash server/scripts/setup_dev_db.sh
cd server
PATH=./venv/bin:$PATH ./venv/bin/prisma py generate
cd ..
```

## Run the App


To run both frontend and backend together:

```bash
npm run dev
```

Or run each service independently (in separate terminals):

```bash
npm run dev-client   # React/Vite frontend
npm run dev-server   # FastAPI backend
```

Default local URLs:

- Frontend (Vite): http://127.0.0.1:5173
- Backend (FastAPI/Socket.IO): http://127.0.0.1:5000

### Running with Docker Compose (recommended for parity)

If you prefer to run services in containers (Postgres + backend), use Docker Compose. The `docker-compose.yml` is configured so the `server` container connects to the `postgres` service by hostname and uses the image-built files (the generated Prisma client is included in the image).

Commands:

```powershell
# Build and start Postgres + Server (server image is rebuilt)
docker compose up -d --build server postgres

# Tail server logs
docker compose logs -f server --no-log-prefix --timestamps
```

Notes:
- The `server` service in Compose is configured to use `DATABASE_URL=postgresql://admin:agapai143@postgres:5432/agapai_db` so the container resolves `postgres` on the Compose network.
- We removed the `./server:/app` bind mount in Compose so files produced at image build time (Prisma client) remain available in the image. For iterative development you can re-add the bind mount locally but then ensure you run `npx prisma generate` on the host or at container start.

### Seeding the Database (in Compose)

You can run the seeder via Compose so it runs with the built image:

```powershell
# Provide seed password via env and run seed (the image already includes generated client)
docker compose run --rm -e AGAPAI_SEED_PASSWORD=agapai143 seed
```

Or call the API endpoint from the backend when running (not recommended for production):

```bash
curl -X POST http://127.0.0.1:5000/api/seed_db
```

### Local development (venv)

For quick local iteration (FastAPI running in your venv and Vite serving frontend):

1. Keep `server/.env` set to `127.0.0.1` so the backend connects to a Postgres instance bound on the host (or change to `postgres` if running inside Compose).
2. Start Postgres via Docker Compose as before (this binds Postgres to host port 5432):

```powershell
docker compose up -d postgres
```

3. In `server/` activate venv and run the backend:

```powershell
cd server
.\venv\Scripts\Activate
python -m uvicorn app:asgi_app --reload --host 127.0.0.1 --port 5000
```

4. Build frontend (if needed) and serve with Vite during development:

```bash
cd client
npm install
npm run dev
```

5. If you change Prisma schema or need the Python client, regenerate it in your venv environment:

```powershell
cd server
.\venv\Scripts\Activate
npx prisma generate --schema=prisma/schema.prisma
```

### Static assets / logo troubleshooting

If the SPA assets are built into `client/dist` the server will serve them from `/assets/...`. If a logo fails to load:

- Confirm `client/dist/assets` contains the generated image (e.g. `agapai-logo-*.png`).
- If running server in Compose, rebuild the server image after building the client so the `/client/dist` contents are included in the image:

```powershell
cd client && npm run build
docker compose up -d --build server
```

Then verify the file is served:

```powershell
curl -I http://127.0.0.1:5000/assets/agapai-logo-dhgYnCIq.png
```

## Setup checklist for other machines

Use this checklist to prepare another device (developer laptop, CI runner, or teammate machine) so it can run the stack the same way you do.

1. Clone the repository:

```bash
git clone https://github.com/Irish-C/agapai-web-app.git
cd agapai-web-app
```

2. Prepare environment choices (pick one):

- Recommended (Docker Compose): install Docker Desktop and use the provided `docker-compose.yml` to run Postgres and the server container. This preserves build-time artifacts (Prisma client, static `client/dist`) inside the image.
- Local (venv + Node): install Python, Node, and Postgres locally and run the backend in a venv and the frontend with Vite.

3. Example `.env` files (placeholders — do NOT commit secrets):

- Root `.env` (optional, Compose will read it):

```
VITE_API_URL=http://127.0.0.1:5000
AGAPAI_SEED_PASSWORD=agapai143
```

- `server/.env` (for local venv development)

```
FLASK_SECRET_KEY=your-very-secret-key
DATABASE_URL=postgresql://admin:agapai143@127.0.0.1:5432/agapai_db
```

Note: When running in Docker Compose the running container will use the Compose-set `DATABASE_URL` (postgres host) so you do not need to edit `server/.env` for Compose runs.

4. Quick Docker Compose workflow (recommended):

```powershell
# Build client assets (so they are copied into server image)
cd client
npm ci
npm run build
cd ..

# Build the server image and start Postgres + server
docker compose up -d --build server postgres

# Seed database (one-off)
docker compose run --rm -e AGAPAI_SEED_PASSWORD=agapai143 seed

# Tail logs / check health
docker compose logs -f server --no-log-prefix --timestamps
curl http://127.0.0.1:5000/health
```

5. Quick local (venv) workflow (no Docker for backend):

```powershell
# Start Postgres locally (or run docker compose up -d postgres)
docker compose up -d postgres

# Backend venv
cd server
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt

# Generate Prisma client (requires Node installed)
npx prisma generate --schema=prisma/schema.prisma

# Apply migrations (if needed)
npx prisma migrate deploy --schema=server/prisma/schema.prisma

# Run server
python -m uvicorn app:asgi_app --reload --host 127.0.0.1 --port 5000

# Frontend
cd ../client
npm ci
npm run dev
```

6. Notes & verification

- Ports used: `5000` (backend), `5173` (Vite dev), `5432` (Postgres). Ensure firewall permits these on the host.
- If the server logs show `P1001` or "can't reach database", wait a few seconds and retry — Compose `depends_on` does not wait for DB readiness. Use `docker compose logs postgres` to verify Postgres health.
- If you change the frontend build, rebuild the client and then rebuild the server image so the new `client/dist` is copied into the server image.

7. Common commands summary

```bash
docker compose up -d --build server postgres
docker compose run --rm -e AGAPAI_SEED_PASSWORD=agapai143 seed
docker compose logs -f server --no-log-prefix --timestamps
curl http://127.0.0.1:5000/health
```


## Project Structure

```text
agapai-web-app/
├── client/                  # React + Vite frontend
│   ├── src/components/
│   ├── src/features/
│   ├── src/hooks/
│   ├── src/pages/
│   └── src/services/
├── server/                  # FastAPI + Socket.IO backend
│   ├── app.py
│   ├── prisma/
│   ├── src/controllers/
│   ├── src/routes/
│   └── ml/
├── AUTO_RECONNECT_AND_SYNC.md
├── RECONNECT_VERIFICATION.md
├── SOCKET_IO_TESTING.md
├── APP.md
└── README.md
```

## Realtime Reconnect and Sync Docs

The reconnect subsystem has dedicated docs:

- [AUTO_RECONNECT_AND_SYNC.md](AUTO_RECONNECT_AND_SYNC.md): architecture, phases, data flow, endpoint contract, and tuning knobs.
- [RECONNECT_VERIFICATION.md](RECONNECT_VERIFICATION.md): quick implementation verification checklist.
- [SOCKET_IO_TESTING.md](SOCKET_IO_TESTING.md): scenario-based QA guide for reconnect, zombie detection, and forced logout.


## Troubleshooting

### Common Issues

- **Prisma/DB errors:**
	- Rerun `bash server/scripts/setup_dev_db.sh` and regenerate Prisma client.
	- Ensure PostgreSQL is running and credentials in `.env` are correct.
- **Backend fails to start:**
	- Make sure the Python virtual environment is activated and dependencies are installed.
	- On Windows, use the correct activation command: `./venv/Scripts/activate`.
	- If you see errors about missing DLLs or permissions, try running your terminal as Administrator.
	- If you get `[WinError 193] %1 is not a valid Win32 application`, ensure you are using the correct binary (e.g., `mediamtx.exe` for Windows, not the Linux binary).
- **Docker not recognized:**
	- If you see `docker : The term 'docker' is not recognized...`, Docker Desktop is not installed or not in your PATH. Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/).
	- After installation, restart your terminal and try again.
- **File path issues:**
	- On Windows, use backslashes (`\`) in PowerShell and forward slashes (`/`) in Git Bash or WSL.
	- If you have issues with file paths, try running commands in Git Bash or WSL for better compatibility.
- **Frontend fails to connect to backend:**
	- Check `VITE_API_URL` in `.env` matches your backend URL.
	- Make sure no firewall or antivirus is blocking local ports (e.g., 5000, 8888).

### Prisma shadow DB or ownership issues

Run:

```bash
bash server/scripts/setup_dev_db.sh
```

Then regenerate Prisma client if needed:

```bash
cd server
PATH=./venv/bin:$PATH ./venv/bin/prisma py generate
```

### Backend fails to start from npm script

The backend script expects a virtual environment in server/venv. If missing, create it:

```bash
cd server
python3 -m venv venv
. venv/bin/activate
pip install -r requirements.txt
```

## Contribution


## Test & Utility Scripts

The following scripts are now located in `server/test-scripts/`:


These are for diagnostics, database/camera maintenance, RTSP testing, or database sequence resets. They are not required for normal app operation.

**Database Sequence Reset:**

- `reset_sequences_v2.sql` is now in `server/test-scripts/`. Run this SQL script in your PostgreSQL database if you need to reset auto-increment counters after manual data changes or imports.

**Usage:**

**Usage:**

1. Open a terminal in `server/test-scripts/`.
2. Activate your virtual environment if needed.
3. Run the script, e.g.:
	```powershell
	python activate_camera.py
	```

---


## Additional Documentation

- [APP.md](APP.md): UI and feature overview
- [AUTO_RECONNECT_AND_SYNC.md](AUTO_RECONNECT_AND_SYNC.md): Realtime architecture
- [RECONNECT_VERIFICATION.md](RECONNECT_VERIFICATION.md): Implementation checklist
- [SOCKET_IO_TESTING.md](SOCKET_IO_TESTING.md): QA/testing scenarios
- [RATE_LIMITING.md](RATE_LIMITING.md): Backend rate limiting configuration (now in project root)
- [LICENSE](LICENSE): MIT license for the project (now in project root)

1. Create a branch for the change.
2. Keep scope focused and include tests/manual verification notes.
3. Use clear commit messages.
4. Open a pull request describing behavior changes and validation steps.



## License
This project includes an MIT license file at [server/LICENSE](server/LICENSE).



## Acknowledgements
- [Avinava's Template](https://github.com/Avinava/simple-vite-react-express)
- [Josh Buchea's Commit Semantics](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716)