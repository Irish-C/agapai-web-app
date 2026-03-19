import os
import asyncio
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from typing import Any
from fastapi.staticfiles import StaticFiles
import socketio

import json
from fastapi.encoders import jsonable_encoder

from database import db
from seed_db import seed_database
from src.routes.user_routes import router as user_router
from src.routes.camera_routes import router as camera_router
from src.routes.event_routes import router as event_router
from src.routes.settings_routes import router as settings_router
from src.routes.location_routes import router as location_router
from src.utils.input_sanitization import get_sanitized_json, sanitize_input

# Import the background stream logic from your controller
from src.controllers.camera_controller import start_camera_processing

from fastapi.responses import JSONResponse
import json

class PrismaJSONResponse(JSONResponse):
    def render(self, content: Any) -> bytes:
        def format_bigint(obj):
            # JavaScript's Max Safe Integer limit
            if isinstance(obj, int) and (obj > 9007199254740991 or obj < -9007199254740991):
                return str(obj)
            if isinstance(obj, list):
                return [format_bigint(i) for i in obj]
            if isinstance(obj, dict):
                return {k: format_bigint(v) for k, v in obj.items()}
            return obj

        content = format_bigint(jsonable_encoder(content))
        return json.dumps(content).encode("utf-8")

# --- 1. LOAD ENVIRONMENT ---
load_dotenv()
SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')

# --- 2. Socket.IO (ASGI) ---
socketio_server = socketio.AsyncServer(
    async_mode='asgi',
    # For development allow all origins (tighten in production)
    cors_allowed_origins='*',
    # Tighter heartbeat to detect broken connections faster
    ping_interval=10,
    ping_timeout=20,
    # Enable logging to help trace disconnects during debugging
    logger=True,
    engineio_logger=True,
)

# --- 3. FASTAPI app with lifespan ---
from contextlib import asynccontextmanager
import redis

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup Logic ---
    print("[INFO] Connecting to Redis...")
    app.state.redis = redis.Redis(host='localhost', port=6379, db=0, decode_responses=False)
    print("[INFO] Connecting to Prisma DB...")
    await db.connect()

    # Start the background camera stream loop (emits frames via Socket.IO)
    # This is what powers the live stream view in the AGAPAI UI.
    try:
        asyncio.create_task(start_camera_processing())
        print("[INFO] Started camera processing loop.")
    except Exception as e:
        print(f"[WARN] Failed to start camera processing loop: {e}")

    yield
    # --- Shutdown Logic ---
    print("[INFO] Closing Redis connection...")
    app.state.redis.close()
    print("[INFO] Disconnecting Prisma DB...")
    await db.disconnect()

app = FastAPI(lifespan=lifespan, default_response_class=PrismaJSONResponse)

@app.middleware("http")
async def bigint_middleware(request, call_next):
    # Sanitize incoming JSON bodies so controllers receive cleaned data.
    # This reads the raw body, sanitizes it with `sanitize_input`, and
    # injects a new receive() coroutine so downstream `await request.json()`
    # returns the sanitized payload.
    try:
        content_type = request.headers.get('content-type', '')
        if 'application/json' in content_type.lower():
            body_bytes = await request.body()
            if body_bytes:
                try:
                    payload = json.loads(body_bytes)
                    sanitized = sanitize_input(payload)
                    new_body = json.dumps(sanitized).encode('utf-8')

                    async def receive():
                        return {"type": "http.request", "body": new_body}

                    # Replace the request's receive with one that returns the
                    # sanitized body. This makes `await request.json()` return
                    # the sanitized payload.
                    request._receive = receive
                except Exception:
                    # If parsing/sanitization fails, fall back to original body
                    pass
    except Exception:
        # Be defensive: do not block requests because sanitization failed.
        pass

    response = await call_next(request)
    return response

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

# --- 4. DB lifecycle + Camera Startup ---
# Startup/shutdown handled by lifespan above
# --- 4. DB lifecycle + Camera Startup ---
# Startup/shutdown handled by lifespan above

# --- 5. Utility routes ---
@app.post('/api/seed_db')
async def seed_db_route():
    try:
        await seed_database()
        return {'status': 'success', 'message': 'Database seeded'}
    except Exception as e:
        return JSONResponse(status_code=500, content={'status': 'error', 'message': str(e)})

# --- 6. Health / readiness endpoints ---
@app.get('/health')
async def health_check():
    return {'status': 'ok', 'database_connected': db.is_connected()}

# --- 10. Admin Set Active Camera Endpoint ---
from fastapi import Request
@app.post('/api/set_active_camera')
async def set_active_camera(request: Request):
    data = await get_sanitized_json(request)
    camera_id = data.get('camera_id')
    r = redis.Redis(host='localhost', port=6379, db=0)
    r.set('active_camera_id', camera_id)
    return {'status': 'success', 'active_camera_id': camera_id}

# --- 11. Get Active Camera Endpoint ---
@app.get('/api/get_active_camera')
async def get_active_camera():
    r = redis.Redis(host='localhost', port=6379, db=0)
    camera_id = r.get('active_camera_id')
    if camera_id:
        camera_id = camera_id.decode()
    return {'active_camera_id': camera_id}

# --- 9. Video Feed Endpoint ---
from fastapi.responses import StreamingResponse
import redis
import asyncio

@app.get('/video_feed')
async def video_feed(camera_id: str | None = None):
    """MJPEG streaming endpoint.

    - If `camera_id` is provided, it reads from Redis key `latest_frame_{camera_id}`.
    - Otherwise, it falls back to the global `latest_frame` key.
    """

    camera_id = sanitize_input(camera_id)
    r = redis.Redis(host='localhost', port=6379, db=0)
    stream_key = f"latest_frame_{camera_id}" if camera_id else "latest_frame"

    async def generate():
        while True:
            frame_bytes = r.get(stream_key)
            if frame_bytes:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            await asyncio.sleep(0.03)

    return StreamingResponse(generate(), media_type='multipart/x-mixed-replace; boundary=frame')

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

# --- 8. Socket.IO events ---
@socketio_server.event
async def connect(sid, environ):
    addr = environ.get('REMOTE_ADDR') if environ else None
    print(f"Socket.IO connect: sid={sid}, addr={addr}")

@socketio_server.event
async def disconnect(sid):
    print(f"Socket.IO disconnect: sid={sid}")

# ASGI app entrypoint
asgi_app = socketio.ASGIApp(
    socketio_server, 
    other_asgi_app=app, 
    socketio_path='/socket.io'
)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('app:asgi_app', host='127.0.0.1', port=5000, reload=True)