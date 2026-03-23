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
from src.routes.permission_routes import router as permission_router
from src.routes.feature_routes_sql import router as feature_router
from src.utils.input_sanitization import get_sanitized_json, sanitize_input
from src.utils.auth import get_token_user_id_from_header
from src.utils.rate_limiter import (
    enforce_ip_rate_limit,
    API_GLOBAL_RATE_LIMIT,
    API_GLOBAL_RATE_WINDOW_SECONDS,
)

# Import the background stream logic from the camera controller
from src.controllers.camera_controller import ensure_mediamtx_running, start_camera_processing

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

# --- 2. Socket.IO (ASGI) ---
socketio_server = socketio.AsyncServer(
    async_mode='asgi',
    # For development allow all origins (tighten in production)
    cors_allowed_origins='*',
    # Longer heartbeat for polling transport (dev uses polling which is slower)
    ping_interval=15,
    ping_timeout=35,
    # Enable logging to help trace disconnects during debugging
    # Disable per-emit debug logging to avoid console spam when streaming
    logger=False,
    engineio_logger=False,
)

# Track currently connected Socket.IO session ids. Other modules may import
# this set and avoid emitting frames when there are no connected clients.
connected_sids: set = set()

# --- 3. FASTAPI app with lifespan ---
from contextlib import asynccontextmanager
from src.utils.redis_pool import RedisConnectionPool

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup Logic ---
    print("[INFO] Connecting to Redis...")
    app.state.redis = RedisConnectionPool.get()
    print("[INFO] Connecting to Prisma DB...")
    await db.connect()

    # Initialize permission service
    print("[INFO] Initializing permission service...")
    from src.services.permission_service import initialize_permission_service
    initialize_permission_service()
    
    # Initialize permission broadcaster
    print("[INFO] Initializing permission broadcaster...")
    from src.services.permission_broadcast import initialize_broadcaster
    initialize_broadcaster(socketio_server)

    # Ensure local RTSP proxy (MediaMTX) is up before camera loops start.
    try:
        mtx_ok = await ensure_mediamtx_running()
        if not mtx_ok:
            print("[WARN] MediaMTX is not reachable on :8554; local RTSP proxy streams may fail.")
    except Exception as e:
        print(f"[WARN] MediaMTX startup check failed: {e}")

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
    RedisConnectionPool.close()
    print("[INFO] Disconnecting Prisma DB...")
    await db.disconnect()

app = FastAPI(lifespan=lifespan, default_response_class=PrismaJSONResponse)

@app.middleware("http")
async def bigint_middleware(request, call_next):
    # Sanitize incoming JSON bodies so controllers receive cleaned data.
    # This reads the raw body, sanitizes it with `sanitize_input`, and
    # injects a new receive() coroutine so downstream `await request.json()`
    # returns the sanitized payload.
    
    # Skip socket.io routes - they need to pass through unmodified
    if request.url.path.startswith('/socket.io'):
        return await call_next(request)

    # Global API rate limiting (separate stricter rule on /api/login route).
    if request.url.path.startswith('/api') and request.url.path != '/api/login':
        allowed, retry_after = await enforce_ip_rate_limit(
            request=request,
            namespace='api_global',
            limit=API_GLOBAL_RATE_LIMIT,
            window_seconds=API_GLOBAL_RATE_WINDOW_SECONDS,
        )
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    'status': 'error',
                    'message': 'Rate limit exceeded. Please retry later.',
                    'retry_after_seconds': retry_after,
                },
                headers={'Retry-After': str(retry_after)},
            )
    
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
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://127.0.0.1:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(user_router, prefix='/api')
app.include_router(camera_router, prefix='/api')
app.include_router(event_router, prefix='/api')
app.include_router(settings_router, prefix='/api')
app.include_router(location_router, prefix='/api')
app.include_router(permission_router)
app.include_router(feature_router)

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

    try:
        camera_id = sanitize_input(camera_id) if camera_id else None
        if camera_id:
            camera_id = str(camera_id)
        
        r = RedisConnectionPool.get()
        stream_key = f"latest_frame_{camera_id}" if camera_id else "latest_frame"
        
        # Test Redis connection
        r.ping()

        async def generate():
            chunk_count = 0
            while True:
                try:
                    frame_bytes = r.get(stream_key)
                    if frame_bytes:
                        chunk_count += 1
                        yield (b'--frame\r\n'
                               b'Content-Type: image/jpeg\r\n'
                               b'Content-Length: ' + str(len(frame_bytes)).encode() + b'\r\n\r\n' 
                               + frame_bytes + b'\r\n')
                    # If no frame, just sleep and retry (don't send broken MJPEG)
                    await asyncio.sleep(0.020)  # ~50fps for lower latency
                except Exception as e:
                    print(f"[video_feed] Streaming error: {e}")
                    break

        return StreamingResponse(generate(), media_type='multipart/x-mixed-replace; boundary=frame')
    except Exception as e:
        print(f"[video_feed] Error initializing stream for camera {camera_id}: {e}")
        return JSONResponse(status_code=500, content={'error': str(e)})

# --- Published Cameras Sync Endpoints ---
@app.post('/api/sync_published_cameras')
async def sync_published_cameras(request: Request):
    """Sync published cameras from frontend to backend Redis."""
    try:
        data = await get_sanitized_json(request)
        camera_ids = data.get('cameras', [])
        
        # Convert to strings and store in Redis set
        camera_ids_str = [str(cid) for cid in camera_ids]
        r = RedisConnectionPool.get()
        
        # Clear old set and add new one
        r.delete('published_cameras')
        if camera_ids_str:
            r.sadd('published_cameras', *camera_ids_str)
        
        print(f"[sync_published_cameras] Updated published cameras: {camera_ids_str}")
        return {'status': 'success', 'cameras': camera_ids_str}
    except Exception as e:
        print(f"[sync_published_cameras] Error: {e}")
        return JSONResponse(status_code=500, content={'error': str(e)})

@app.get('/api/get_published_cameras')
async def get_published_cameras():
    """Get list of published cameras from backend."""
    try:
        r = RedisConnectionPool.get()
        camera_ids = r.smembers('published_cameras')
        return {'status': 'success', 'cameras': list(camera_ids)}
    except Exception as e:
        return JSONResponse(status_code=500, content={'error': str(e)})

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
    connected_sids.add(sid)

@socketio_server.event
async def disconnect(sid):
    print(f"Socket.IO disconnect: sid={sid}")
    try:
        connected_sids.discard(sid)
    except Exception:
        pass


# Allow clients to subscribe/unsubscribe to specific camera rooms so we can
# emit frames only to viewers of that camera instead of broadcasting globally.
@socketio_server.on('subscribe_camera')
async def subscribe_camera(sid, data):
    try:
        token = None
        if isinstance(data, dict):
            token = data.get('token')

        user_id = None
        if token:
            user_id = get_token_user_id_from_header(f"Bearer {token}")

        if not user_id:
            environ = socketio_server.get_environ(sid)
            if environ:
                user_id = get_token_user_id_from_header(environ.get('HTTP_AUTHORIZATION'))

        if not user_id:
            await socketio_server.emit('auth_error', {'message': 'Authentication required'}, to=sid)
            return

        camera_id = None
        if isinstance(data, dict):
            camera_id = data.get('camera_id') or data.get('cam_id')
        else:
            camera_id = data
        if camera_id is None:
            return
        room = f"camera_{camera_id}"
        await socketio_server.enter_room(sid, room)
        
        # ✅ NEW: Set as active camera for AI processing
        r = RedisConnectionPool.get()
        r.set('active_camera_id', str(camera_id))
        
        print(f"Socket.IO subscribe: sid={sid} -> {room} (AI focus set)")
    except Exception as e:
        print(f"subscribe_camera error: {e}")


@socketio_server.on('unsubscribe_camera')
async def unsubscribe_camera(sid, data):
    try:
        token = None
        if isinstance(data, dict):
            token = data.get('token')

        user_id = None
        if token:
            user_id = get_token_user_id_from_header(f"Bearer {token}")

        if not user_id:
            environ = socketio_server.get_environ(sid)
            if environ:
                user_id = get_token_user_id_from_header(environ.get('HTTP_AUTHORIZATION'))

        if not user_id:
            await socketio_server.emit('auth_error', {'message': 'Authentication required'}, to=sid)
            return

        camera_id = None
        if isinstance(data, dict):
            camera_id = data.get('camera_id') or data.get('cam_id')
        else:
            camera_id = data
        if camera_id is None:
            return
        room = f"camera_{camera_id}"
        await socketio_server.leave_room(sid, room)
        print(f"Socket.IO unsubscribe: sid={sid} -> {room}")
    except Exception as e:
        print(f"unsubscribe_camera error: {e}")


# Health check: respond to client pings with pong
@socketio_server.on('ping')
async def handle_ping(sid, data):
    """Health check handler: client sends ping, we respond with pong."""
    try:
        timestamp = data.get('timestamp') if isinstance(data, dict) else None
        await socketio_server.emit('pong', {'timestamp': timestamp}, to=sid)
        # Uncomment for verbose health check logs
        # print(f"SocketIO health check: ping from {sid}, pong sent")
    except Exception as e:
        print(f"SocketIO health check error: {e}")

# ASGI app entrypoint
asgi_app = socketio.ASGIApp(
    socketio_server, 
    other_asgi_app=app, 
    socketio_path='/socket.io'
)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('app:asgi_app', host='127.0.0.1', port=5000, reload=True)