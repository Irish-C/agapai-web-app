import asyncio
import os
import base64
import threading
from io import BytesIO
from PIL import Image, ImageDraw
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv

# Flask & Extensions
from flask import Flask, request, send_from_directory
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask.json.provider import DefaultJSONProvider

# Database Instance
from database import db 
from prisma import Prisma

# 1. Initialization
load_dotenv()
app = Flask(__name__, static_folder='../client/dist', static_url_path='/')

# Custom JSON Provider for BigInt support
class BigIntProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, int):
            return str(obj)
        return super().default(obj)

app.json = BigIntProvider(app)

# Security & CORS
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000", 
            "http://127.0.0.1:3000"
        ],
        "allow_headers": ["Content-Type", "Authorization"],
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    }
})

app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')
app.config['JWT_SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')
jwt = JWTManager(app)

# --- Real-time Engine ---
# By using 'threading', we stay compatible with standard asyncio.run() calls.
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# --- 2. ASYNC BACKGROUND TASK (Isolated Thread) ---
MOCK_STREAM_THREAD = None
background_db = Prisma() # Private Prisma client for the thread

def generate_mock_frame(cam_name):
    img = Image.new('RGB', (640, 480), color=(73, 109, 137))
    d = ImageDraw.Draw(img)
    d.text((10, 10), f"Camera: {cam_name}", fill=(255, 255, 0))
    buffered = BytesIO()
    img.save(buffered, format="JPEG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

async def mock_stream_loop():
    print("Background loop started...")
    while True:
        try:
            if not background_db.is_connected():
                await background_db.connect()
            
            cameras = await background_db.camera.find_many()
            if cameras:
                for cam in cameras:
                    frame_base64 = generate_mock_frame(cam.cam_name)
                    socketio.emit('camera_frame', {
                        'cam_id': str(cam.id),
                        'frame': frame_base64
                    })
        except Exception as e:
            print(f"Background Loop Error: {e}")
        await asyncio.sleep(1)

def start_mock_stream_wrapper():
    # Native asyncio loop for the background thread
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(mock_stream_loop())
    finally:
        loop.close()

@socketio.on('connect')
def handle_connect(auth=None):
    global MOCK_STREAM_THREAD
    print(f'Client connected: {request.sid}')
    if MOCK_STREAM_THREAD is None or not MOCK_STREAM_THREAD.is_alive():
        MOCK_STREAM_THREAD = threading.Thread(target=start_mock_stream_wrapper, daemon=True)
        MOCK_STREAM_THREAD.start()

# --- 3. BLUEPRINTS ---
from src.routes.user_routes import user_routes
from src.routes.camera_routes import camera_routes
from src.routes.settings_routes import settings_routes
from src.routes.event_routes import event_routes

app.register_blueprint(user_routes, url_prefix='/api')
app.register_blueprint(camera_routes, url_prefix='/api')
app.register_blueprint(settings_routes, url_prefix='/api')
app.register_blueprint(event_routes, url_prefix='/api')

# --- 4. SEED ROUTE (Pure Async) ---
@app.route('/api/seed_db')
def seed_db():
    # In 'threading' mode, asyncio.run() works perfectly without crashes!
    return asyncio.run(run_seed())

async def run_seed():
    try:
        if not db.is_connected():
            await db.connect()
            
        user = await db.user.find_unique(where={'username': 'reginedahan'})
        if not user:
            await db.user.create(data={
                'firstname': "Regine",
                'lastname': "Dahan",
                'username': "reginedahan",
                'password': generate_password_hash("agapai321")
            })
            return "User created!"
        return "Already seeded."
    except Exception as e:
        print(f"Seed Error: {e}")
        return str(e), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

# --- 5. LAUNCH ---
if __name__ == '__main__':
    # allow_unsafe_werkzeug=True is still needed when using the default Flask server with SocketIO
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, use_reloader=False, allow_unsafe_werkzeug=True)