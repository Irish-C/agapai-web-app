# AGAPAI Web App

AGAPAI is a real-time monitoring and alerting web app for elderly care environments. It combines live camera streaming, Socket.IO event delivery, and AI-generated alerts (fall/inactivity) with role-based access control.

For product screenshots and UI-focused description, see [APP.md](APP.md).

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Run the App](#run-the-app)
- [Project Structure](#project-structure)
- [Realtime Reconnect and Sync Docs](#realtime-reconnect-and-sync-docs)
- [Troubleshooting](#troubleshooting)
- [Contribution](#contribution)

## Tech Stack

- Frontend: React 19 + Vite + Tailwind CSS
- Backend: FastAPI + Uvicorn + Python Socket.IO
- Database: Prisma + PostgreSQL
- Realtime: Socket.IO (health checks, aggressive reconnect, missed-alert sync)
- AI/Vision: Ultralytics YOLO (server-side inference)

## Prerequisites

Required tooling:

- Node.js 18+
- Python 3.10+
- PostgreSQL
- Git

## Installation

1. Clone the repository and install root dependencies.

```bash
git clone https://github.com/Irish-C/agapai-web-app.git
cd agapai-web-app
npm install
```

2. Create and activate the backend virtual environment, then install Python dependencies.

```bash
cd server
python3 -m venv venv
. venv/bin/activate
pip install -r requirements.txt
cd ..
```

3. Set up environment variables.

```bash
cp .env.example .env
```

4. Set up database and Prisma artifacts.

```bash
bash server/scripts/setup_dev_db.sh
cd server
PATH=./venv/bin:$PATH ./venv/bin/prisma py generate
cd ..
```

## Run the App

Run frontend and backend together:

```bash
npm run dev
```

Or run each service independently:

```bash
npm run dev-client
npm run dev-server
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

1. Create a branch for the change.
2. Keep scope focused and include tests/manual verification notes.
3. Use clear commit messages.
4. Open a pull request describing behavior changes and validation steps.



## License
This project includes an MIT license file at [server/LICENSE](server/LICENSE).



## Acknowledgements
- [Avinava's Template](https://github.com/Avinava/simple-vite-react-express)
- [Josh Buchea's Commit Semantics](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716)