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

# 1. Initialization
load_dotenv()
app = Flask(__name__, static_folder='../dist', static_url_path='/')

# Custom JSON Provider for BigInt support
class BigIntProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, int):
            return str(obj)
        return super().default(obj)

app.json = BigIntProvider(app)

# Security & CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')
app.config['JWT_SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')
jwt = JWTManager(app)

# Real-time Engine (Using 'threading' to avoid eventlet conflicts)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# 2. Database Lifecycle (Request-bound)
@app.before_request
async def ensure_db_connected():
    if not db.is_connected():
        await db.connect()

# 3. Helper: Generate Mock Video Frames
def generate_mock_frame(cam_name):
    img = Image.new('RGB', (640, 480), color=(73, 109, 137))
    d = ImageDraw.Draw(img)
    d.text((10, 10), f"Camera: {cam_name}", fill=(255, 255, 0))
    
    buffered = BytesIO()
    img.save(buffered, format="JPEG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

# --- 4. ASYNC BACKGROUND TASK (Isolated Thread) ---
MOCK_STREAM_THREAD = None

def start_mock_stream_wrapper():
    """Initializes a new event loop for the background thread."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(mock_stream_loop())
    finally:
        loop.close()

# --- 1. SEPARATE PRISMA CLIENTS ---
from database import db  # This is for Web Requests
from prisma import Prisma
background_db = Prisma() # This is EXCLUSIVELY for the Background Thread

# --- 2. UPDATED BACKGROUND LOOP ---
async def mock_stream_loop():
    """Independent loop with its own private database client."""
    print("Background loop started...")
    while True:
        try:
            # Connect the PRIVATE client to this thread's loop
            if not background_db.is_connected():
                print("Connecting background-only Prisma client...")
                await background_db.connect()
            
            # Use background_db instead of the global db
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
            if background_db.is_connected():
                await background_db.disconnect()
        
        await asyncio.sleep(1)

# --- 3. UPDATED SOCKET HANDLER ---
@socketio.on('connect')
def handle_connect(auth=None):
    global MOCK_STREAM_THREAD
    print(f'Client connected: {request.sid}')
    
    # Use a standard Thread instead of socketio.start_background_task
    # This provides cleaner loop isolation for Prisma
    if MOCK_STREAM_THREAD is None or not MOCK_STREAM_THREAD.is_alive():
        print("Starting isolated mock stream thread...")
        MOCK_STREAM_THREAD = threading.Thread(target=start_mock_stream_wrapper, daemon=True)
        MOCK_STREAM_THREAD.start()

# --- 6. BLUEPRINTS ---
from src.routes.user_routes import user_routes
from src.routes.camera_routes import camera_routes
from src.routes.settings_routes import settings_routes
from src.routes.event_routes import event_routes

app.register_blueprint(user_routes, url_prefix='/api')
app.register_blueprint(camera_routes, url_prefix='/api')
app.register_blueprint(settings_routes, url_prefix='/api')
app.register_blueprint(event_routes, url_prefix='/api')

# --- 7. API ROUTES ---
@app.route('/seed_db')
async def seed_db():
    user = await db.user.find_unique(where={'username': 'reginedahan'})
    if not user:
        # Re-seeding with Werkzeug-compatible hash
        await db.user.create(data={
            'firstname': "Regine",
            'lastname': "Dahan",
            'username': "reginedahan",
            'password': generate_password_hash("agapai321")
        })
        return "User created!"
    return "Already seeded."

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    return send_from_directory(app.static_folder, 'index.html')

# --- 8. LAUNCH ---
if __name__ == '__main__':
    # use_reloader=False is mandatory to prevent event loop race conditions
    socketio.run(app, host='0.0.0.0', port=5000, use_reloader=False, debug=True)