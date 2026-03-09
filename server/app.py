import os
import asyncio
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
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

# Import the background stream logic from your controller
from src.controllers.camera_controller import start_camera_processing

# --- 1. LOAD ENVIRONMENT ---
load_dotenv()
SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')

# --- 2. Socket.IO (ASGI) ---
socketio_server = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=['http://127.0.0.1:5173', 'http://localhost:5173'],
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
    yield
    # --- Shutdown Logic ---
    print("[INFO] Closing Redis connection...")
    app.state.redis.close()
    print("[INFO] Disconnecting Prisma DB...")
    await db.disconnect()

app = FastAPI(lifespan=lifespan)

@app.middleware("http")
async def bigint_middleware(request, call_next):
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
    data = await request.json()
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
from fastapi import Response
import redis
import time

@app.get('/video_feed')
async def video_feed():
    r = redis.Redis(host='localhost', port=6379, db=0)
    def generate():
        while True:
            frame_bytes = r.get('latest_frame')
            if frame_bytes:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(0.03)
    return Response(generate(), media_type='multipart/x-mixed-replace; boundary=frame')

# --- 7. Static + SPA fallback ---
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
    print('Socket.IO connect', sid)

@socketio_server.event
async def disconnect(sid):
    print('Socket.IO disconnect', sid)

# ASGI app entrypoint
asgi_app = socketio.ASGIApp(
    socketio_server, 
    other_asgi_app=app, 
    socketio_path='/socket.io'
)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('app:asgi_app', host='127.0.0.1', port=5000, reload=True)