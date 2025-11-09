import eventlet
eventlet.monkey_patch()

from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
import os
import time
import json
import base64
from io import BytesIO
from PIL import Image, ImageDraw
import threading    
from flask_jwt_extended import JWTManager

from database import db
from routes.user_routes import user_routes

# from services.data_service import data_service # Not yet created
# from models.fall_detection import FallDetectionModel # Not yet created

# --- Configuration & Initialization ---

# Load environment variables from .env
load_dotenv()

# Initialize Flask App
app = Flask(__name__, static_folder='../dist', static_url_path='/')

app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')
app.config['JWT_SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY')

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Disable to avoid overhead
db.init_app(app)

jwt = JWTManager(app)

# Set up CORS policies to allow connections from the Vite development server (port 5173)
socketio = SocketIO(
    app,
    cors_allowed_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    async_mode='eventlet'
)

# Register Blueprints
app.register_blueprint(user_routes, url_prefix='/api')

# --- MOCK Stream Functions (Simulate OpenVINO/Fuzzy Logic) ---

# Global flag to control the main stream thread loop
MOCK_STREAM_RUNNING = True

# This dict will hold the last frame data for each camera
MOCK_FRAME_DATA = {}
MOCK_CAMERAS = ['cam1', 'cam2', 'cam3', 'cam4']

# Event to control the mock stream loop
mock_stream_event = threading.Event()

# Lock for thread-safe access to MOCK_FRAME_DATA
frame_lock = threading.Lock()

def generate_mock_frame(cam_id):
    """Generates a simple red JPEG frame with text overlay (Base64 encoded)."""
    try:
        from PIL import Image, ImageDraw, ImageFont 
    except ImportError:
        return base64.b64encode(b"MOCK STREAM ERROR: No Image Lib").decode('utf-8')

    # Create a simple red image (320x240)
    img = Image.new('RGB', (320, 240), color='red')
    d = ImageDraw.Draw(img)

    # Add text overlay
    text = f"AGAPAI MOCK STREAM\n{cam_id.upper()} LIVE\nTime: {time.strftime('%H:%M:%S')}"

    # Simple font setup
    try:
        font = ImageFont.truetype("arial.ttf", 16)
    except IOError:
        font = ImageFont.load_default()

    d.text((10, 10), text, fill=(255, 255, 255), font=font)

    # Encode as JPEG
    buffer = BytesIO()
    img.save(buffer, format='jpeg', quality=70)
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def mock_stream_loop():
    """Continuously sends mock video frames and periodic incidents."""
    print("Starting mock stream loop...")
    incident_timer = time.time()
    INCIDENT_INTERVAL = 30  # seconds

    while MOCK_STREAM_RUNNING and not mock_stream_event.is_set():
        current_time = time.time()

        # 1. Generate and emit frames (for M-JPEG stream)
        for cam_id in MOCK_CAMERAS:
            frame_base64 = generate_mock_frame(cam_id)

            with frame_lock:
                MOCK_FRAME_DATA[cam_id] = frame_base64

            socketio.emit('camera_frame', {
                'cam_id': cam_id,
                'frame': frame_base64
            })

        # 2. Simulate Periodic Incident Alert
        if current_time - incident_timer > INCIDENT_INTERVAL:
            mock_incident = {
                'type': 'Fall Detected',
                'location': 'Living Room',
                'timestamp': int(current_time)
            }
            socketio.emit('incident_alert', mock_incident)
            print(f"MOCK ALERT: {mock_incident['type']} at {mock_incident['location']} sent.")
            incident_timer = current_time

        # Simulate ~10 FPS
        socketio.sleep(0.1)

    print("Mock stream loop finished.")

# --- SocketIO Event Handlers ---

@socketio.on('connect')
def handle_connect():
    """Handles new client connections."""
    print(f'Client connected: {request.sid}')

    global MOCK_STREAM_THREAD
    if MOCK_STREAM_THREAD and MOCK_STREAM_THREAD.is_alive():
        MOCK_STREAM_THREAD.join()


@socketio.on('disconnect')
def handle_disconnect():
    """Handles client disconnections."""
    print(f'Client disconnected: {request.sid}')

# --- Flask Routes (REST API & Main Entry Point) ---

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_index(path):
    """Serves the main index.html for all frontend routes (React Router)."""
    return send_from_directory(os.path.join(os.path.dirname(__file__), '..', 'dist'), 'index.html')

@app.route('/api/camera_status', methods=['GET'])
def get_camera_status():
    """Returns a mock camera connection status list."""
    status = [
        {'id': cam, 'location': 'Location Placeholder', 'status': 'Connected' if cam in MOCK_FRAME_DATA else 'Disconnected'}
        for cam in MOCK_CAMERAS
    ]
    return jsonify({'status': 'success', 'cameras': status}), 200

# --- Start Server ---

MOCK_STREAM_THREAD = None

if __name__ == '__main__':
    print("Starting Flask server with SocketIO on port 5000...")
    print("Eventlet applied. Using eventlet for asynchronous mode.")
    print(f"Async mode: {socketio.async_mode}")

    try:
        socketio.run(app, host='0.0.0.0', port=5000, debug=True, use_reloader=False)
    except KeyboardInterrupt:
        print("Server shutting down...")
    finally:
        MOCK_STREAM_RUNNING = False
        mock_stream_event.set()
        if MOCK_STREAM_THREAD and MOCK_STREAM_THREAD.is_alive():
            MOCK_STREAM_THREAD.join()
        print("Server shutdown complete.")
