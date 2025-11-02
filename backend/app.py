import os
import time
import base64
import json
import threading
from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv

# Import mock models and routes modules (assuming they will be placed in models/ and routes/)
# NOTE: These imports rely on the 'backend' directory being the package root, 
# or being runnable directly for development like 'python backend/app.py'
from routes.user_routes import user_routes
# from services.data_service import data_service # Not yet created, placeholder below
# from models.fall_detection import FallDetectionModel # Not yet created, placeholder below

# --- Configuration & Initialization ---

# Load environment variables from .env
load_dotenv()

# The error messages "could not parse statement starting at line X" usually mean 
# the .env file has comments or variables not strictly in 'KEY=VALUE' format. 
# We ignore these warnings as they don't stop execution.

# Initialize Flask App
app = Flask(__name__, static_folder='../dist', static_url_path='/')
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')
# Set up CORS policies to allow connections from the Vite development server (port 5173)
socketio = SocketIO(
    app, 
    cors_allowed_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"], 
    async_mode='eventlet' 
)

# Register Blueprints
app.register_blueprint(user_routes, url_prefix='/api')

# --- MOCK Stream Functions (Simulate OpenVINO/Fuzzy Logic) ---

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
        # We simulate the AI by drawing directly. A real pipeline uses OpenCV.
        from PIL import Image, ImageDraw, ImageFont 
    except ImportError:
        # Fallback if Pillow/OpenCV is not available
        return base64.b64encode(b"MOCK STREAM ERROR: No Image Lib").decode('utf-8')

    # Create a simple red image (320x240)
    img = Image.new('RGB', (320, 240), color='red')
    d = ImageDraw.Draw(img)

    # Add text overlay
    text = f"AGAPAI MOCK STREAM\n{cam_id.upper()} LIVE\nTime: {time.strftime('%H:%M:%S')}"
    
    # Simple font setup (Pillow default)
    try:
        font = ImageFont.truetype("arial.ttf", 16) # Try loading a system font
    except IOError:
        font = ImageFont.load_default() # Fallback

    d.text((10, 10), text, fill=(255, 255, 255), font=font)

    # Encode as JPEG
    from io import BytesIO
    buffer = BytesIO()
    img.save(buffer, format='jpeg', quality=70)
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def mock_stream_loop():
    """Continuously sends mock video frames and periodic incidents."""
    print("Starting mock stream loop...")
    incident_timer = time.time()
    INCIDENT_INTERVAL = 30 # seconds

    while MOCK_STREAM_RUNNING and not mock_stream_event.is_set():
        current_time = time.time()
        
        # 1. Generate and emit frames (for M-JPEG stream)
        for cam_id in MOCK_CAMERAS:
            frame_base64 = generate_mock_frame(cam_id)
            
            with frame_lock:
                MOCK_FRAME_DATA[cam_id] = frame_base64

            # Emit the frame data via SocketIO
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
            # Emit the incident data via SocketIO
            socketio.emit('incident_alert', mock_incident)
            print(f"MOCK ALERT: {mock_incident['type']} at {mock_incident['location']} sent.")
            incident_timer = current_time

        # Sleep to control the stream rate (simulating 10 FPS)
        socketio.sleep(0.1)
    
    print("Mock stream loop finished.")

# --- SocketIO Event Handlers ---

@socketio.on('connect')
def handle_connect():
    """Handles new client connections."""
    print(f'Client connected: {request.sid}')
    
    # Start the mock stream thread if it's not already running and needed
    global MOCK_STREAM_THREAD
    if MOCK_STREAM_RUNNING and not (MOCK_STREAM_THREAD and MOCK_STREAM_THREAD.is_alive()):
        MOCK_STREAM_THREAD = socketio.start_background_task(target=mock_stream_loop)

@socketio.on('disconnect')
def handle_disconnect():
    """Handles client disconnections."""
    print(f'Client disconnected: {request.sid}')

# --- Flask Routes (REST API & Main Entry Point) ---

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_index(path):
    """Serves the main index.html for all frontend routes (React Router)."""
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/api/camera_status', methods=['GET'])
def get_camera_status():
    """Placeholder for a camera status REST endpoint (M-JPEG fallback/initialization check)."""
    status = [
        {'id': cam, 'location': 'Location Placeholder', 'status': 'Connected' if cam in MOCK_FRAME_DATA else 'Disconnected'}
        for cam in MOCK_CAMERAS
    ]
    return jsonify({'status': 'success', 'cameras': status}), 200

# --- Start Server ---

# The mock stream thread object
MOCK_STREAM_THREAD = None 

if __name__ == '__main__':
    print("Starting Flask server with SocketIO on port 5000...")
    
    # Check if eventlet is being used
    try:
        import eventlet
        eventlet.monkey_patch()
        print("Eventlet applied. Using eventlet for asynchronous mode.")
    except ImportError:
        print("Eventlet not found. Running in default threaded mode (may not be ideal for websockets).")

    try:
        # Running with eventlet or default threaded WSGI server
        socketio.run(app, host='0.0.0.0', port=5000, debug=True)
    except KeyboardInterrupt:
        print("Server shutting down...")
    finally:
        # Gracefully stop the mock stream thread on exit
        global MOCK_STREAM_RUNNING
        MOCK_STREAM_RUNNING = False
        mock_stream_event.set() 
        if MOCK_STREAM_THREAD and MOCK_STREAM_THREAD.is_alive():
            MOCK_STREAM_THREAD.join()
        print("Server shutdown complete.")