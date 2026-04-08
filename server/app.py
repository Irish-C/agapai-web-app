import os
import sys
import asyncio
import socketio
from dotenv import load_dotenv
from pathlib import Path

# Ensure server/ is on sys.path so imports like `from src...` resolve when
# running uvicorn from the repository root.
server_root = Path(__file__).parent.resolve()
if str(server_root) not in sys.path:
    sys.path.insert(0, str(server_root))
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse

from database import db
from src.utils.responses import PrismaJSONResponse
from src.routes.user_routes import router as user_router
from src.routes.camera_routes import router as camera_router
from src.routes.event_routes import router as event_router
from src.routes.settings_routes import router as settings_router
from src.routes.location_routes import router as location_router
from src.routes.contact_routes import router as contact_router
from src.routes.video_routes import router as video_router
from src.utils.auth import get_token_user_id_from_header

# Streaming controller imports
# from src.controllers.camera_controller import ensure_mediamtx_running, start_camera_processing, analyze_camera_snapshot, YOLO_MODEL
import cv2
import numpy as np

# --- 1. LOAD ENVIRONMENT ---
# Prefer a repo-level `.env.local` for developer machines, fall back to
# the service-local `server/.env` when not present. Docker Compose injects
# `./.env.docker` into the container so it does not rely on these files.
repo_root = Path(__file__).parent.parent
local_env = repo_root / ".env.local"
server_env = Path(__file__).parent / ".env"
if local_env.exists():
    load_dotenv(dotenv_path=local_env)
else:
    load_dotenv(dotenv_path=server_env)

## print(f"DEBUG: Looking for .env at: {env_path}")
## print(f"DEBUG: DATABASE_URL is: {os.getenv('DATABASE_URL')}")

# --- 2. Socket.IO (ASGI) - centralized in socket_manager to prevent circular imports ---
from src.services.socket_manager import socketio_server, connected_sids

# Streaming-specific async redis pool removed

# --- 3. FASTAPI app with lifespan ---
from contextlib import asynccontextmanager
from src.utils.redis_pool import RedisConnectionPool
from src.services.redis_detection_consumer import start_in_background as start_redis_detection_consumer, stop as stop_redis_detection_consumer

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup Logic ---
    print("[INFO] Connecting to Redis...")
    app.state.redis = RedisConnectionPool.get()
    print("[INFO] Connecting to Prisma DB...")
    await db.connect()

    # Start Redis detection consumer to forward detections to Socket.IO
    try:
        start_redis_detection_consumer()
        print('[INFO] Redis detection consumer started')
    except Exception as e:
        print(f'[WARN] Failed to start Redis detection consumer: {e}')

    # Streaming startup disabled per user request (starting from scratch)

    yield
    # --- Shutdown Logic ---
    print("[INFO] Closing Redis connection...")
    RedisConnectionPool.close()
    try:
        await RedisConnectionPool.close_async()
    except Exception as e:
        print(f"[WARN] Error closing async Redis client: {e}")
    print("[INFO] Disconnecting Prisma DB...")
    await db.disconnect()
    try:
        await stop_redis_detection_consumer()
        print('[INFO] Redis detection consumer stopped')
    except Exception:
        pass

app = FastAPI(lifespan=lifespan, default_response_class=PrismaJSONResponse)

# --- Middleware ---
from src.middleware.sanitization import bigint_middleware
app.middleware("http")(bigint_middleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router, prefix='/api')
app.include_router(camera_router, prefix='/api')
app.include_router(event_router, prefix='/api')
app.include_router(settings_router, prefix='/api')
app.include_router(location_router, prefix='/api')
app.include_router(contact_router, prefix="/api")
app.include_router(video_router)

# --- 4. DB lifecycle + Camera Startup ---
# Startup/shutdown handled by lifespan above

# --- 5. Utility routes ---


# --- 6. Health / readiness endpoints ---
@app.get('/health')
async def health_check():
    return {'status': 'ok', 'database_connected': db.is_connected()}

# --- 10. Admin Set Active Camera Endpoint (moved to camera_routes.py) ---

# --- 11. Get Active Camera Endpoint ---
@app.get('/api/get_active_camera')
async def get_active_camera():
    r = RedisConnectionPool.get()
    camera_id = r.get('active_camera_id')
    if camera_id:
        camera_id = camera_id.decode()
    return {'active_camera_id': camera_id}

# --- Published Cameras Sync Endpoints (moved to camera_routes.py) ---

@app.get('/api/get_published_cameras')
async def get_published_cameras():
    """Get list of published cameras from backend."""
    try:
        r = RedisConnectionPool.get()
        camera_ids = r.smembers('published_cameras')
        return {'status': 'success', 'cameras': list(camera_ids)}
    except Exception as e:
        return JSONResponse(status_code=500, content={'error': str(e)})


# Streaming MJPEG endpoint removed per user request

# --- 7. Snapshot static folder (used for alert snapshots) ---
SNAPSHOTS_DIR = os.path.join(os.path.dirname(__file__), 'static', 'snapshots')
os.makedirs(SNAPSHOTS_DIR, exist_ok=True)
app.mount('/snapshots', StaticFiles(directory=SNAPSHOTS_DIR), name='snapshots')

# --- 8. Static + SPA fallback ---
_DIST_DIR = os.path.join(os.path.dirname(__file__), '../client/dist')
if os.path.isdir(_DIST_DIR):
    app.mount('/', StaticFiles(directory=_DIST_DIR, html=True), name='static')
    @app.get('/{full_path:path}')
    async def spa_fallback(full_path: str):
        return FileResponse(os.path.join(_DIST_DIR, 'index.html'))
else:
    @app.get('/')
    async def root_health_check():
        return {'status': 'ok', 'message': 'Backend is running (no static build detected)'}

# --- 8. Socket.IO events (moved to src/services/socket_manager.py) ---

# ASGI app entrypoint
asgi_app = socketio.ASGIApp(
    socketio_server, 
    other_asgi_app=app, 
    socketio_path='/socket.io'
)

if __name__ == '__main__':
    import uvicorn
    import sys
    try:
        uvicorn.run('app:asgi_app', host='127.0.0.1', port=5000, reload=True)
    except KeyboardInterrupt:
        print('Shutting down (KeyboardInterrupt).')
        sys.exit(0)
    except Exception as e:
        # Re-raise unexpected exceptions so they are visible during development
        print(f'Server exited with exception: {e}')
        raise