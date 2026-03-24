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