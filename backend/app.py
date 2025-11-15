# backend/app.py
import eventlet
eventlet.monkey_patch(thread=False) # Thread=False avoids context errors


from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
import os
import time
import json
import base64
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import threading    
from flask_jwt_extended import JWTManager

from models import Location, EventType, EventClass, Camera, Role
from database import db
from routes.user_routes import user_routes
from routes.camera_routes import camera_routes
from routes.event_routes import event_routes
from routes.settings_routes import settings_routes


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

# Set up CORS policies
socketio = SocketIO(
    app,
    cors_allowed_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    async_mode='eventlet'
)

# Register Blueprints
app.register_blueprint(user_routes, url_prefix='/api')
app.register_blueprint(camera_routes, url_prefix='/api')
app.register_blueprint(event_routes, url_prefix='/api')
app.register_blueprint(settings_routes, url_prefix='/api')

# --- MOCK Stream Functions (Simulate OpenVINO/Fuzzy Logic) ---

# Global flag to control the main stream thread loop
MOCK_STREAM_RUNNING = True

# This dict will hold the last frame data for each camera
MOCK_FRAME_DATA = {}

# Event to control the mock stream loop
mock_stream_event = threading.Event()

# Lock for thread-safe access to MOCK_FRAME_DATA
frame_lock = threading.Lock()
MOCK_STREAM_THREAD = None # Global thread object

def generate_mock_frame(cam_id, cam_name):
    """Generates a simple red JPEG frame with text overlay (Base64 encoded)."""
    try:
        from PIL import Image, ImageDraw, ImageFont 
    except ImportError:
        return base64.b64encode(b"MOCK STREAM ERROR: No Image Lib").decode('utf-8')

    # Create a simple dark red image (320x240)
    img = Image.new('RGB', (320, 240), color='darkred')
    d = ImageDraw.Draw(img)

    # Add text overlay
    text = f"AGAPAI MOCK STREAM\n{cam_name.upper()} (ID: {cam_id})\nTime: {time.strftime('%H:%M:%S')}"

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
        
        # 1. Generate and emit frames (for M-JPEG stream)
        # Use app_context to allow database queries in this thread
        with app.app_context():
            try:
                # Get all cameras from the database
                cameras_from_db = Camera.query.all()
                
                if not cameras_from_db:
                    # If no cameras in DB, print a waiting message
                    print("Mock Stream: No cameras in database. Waiting...")
                    socketio.sleep(5) # Wait 5 seconds before checking again
                    continue

                for cam in cameras_from_db:
                    # Use cam.id as the cam_id
                    frame_base64 = generate_mock_frame(cam.id, cam.cam_name)

                    with frame_lock:
                        MOCK_FRAME_DATA[cam.id] = frame_base64

                    socketio.emit('camera_frame', {
                        'cam_id': cam.id,  # <-- SEND THE DATABASE ID
                        'frame': frame_base64
                    })

            except Exception as e:
                print(f"Error in mock stream loop: {e}")

        # 2. Simulate Periodic Incident Alert
        current_time = time.time()
        if current_time - incident_timer > INCIDENT_INTERVAL:
            mock_incident = {
                'type': 'Fall Detected',
                'location': 'Living Room', # You could update this to use a real location
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
def handle_connect(auth=None):
    # ...
    global MOCK_STREAM_THREAD # Ensure you're modifying the global variable
    with frame_lock:
        # Start the background thread only if it hasn't been started yet
        if MOCK_STREAM_THREAD is None:
            print("Starting mock stream thread...")
            MOCK_STREAM_THREAD = socketio.start_background_task(mock_stream_loop)

@socketio.on('disconnect')
def handle_disconnect():
    """Handles client disconnections."""
    print(f'Client disconnected: {request.sid}')

# --- Flask Routes (REST API & Main Entry Point) ---

@app.route('/create_db')
def create_db():
    # Import all models here so flask shell isn't required
    from models import Role, User, Location, EventType, EventClass, Camera, EventLog
    with app.app_context():
        db.create_all()
    return "Database tables created!"

@app.route('/seed_db')
def seed_db():
    """
    Seeds the database with one of each required item
    so the mock log generator can work.
    """
    with app.app_context():
        try:
            # Check if data already exists to avoid duplicates
            if Location.query.first() or Camera.query.first() or EventType.query.first():
                return "Database already has data. Seed skipped."

            print("Seeding database...")

            # 1. Create a Location
            new_loc = Location(loc_name="Sebastian")
            db.session.add(new_loc)

            # 2. Create EventType
            new_event_type = EventType(event_type_name="Fall")
            db.session.add(new_event_type)
            
            # Commit so we can get IDs for the next step
            db.session.commit()

            # 3. Create EventClass 
            new_event_class = EventClass(
                class_name="Backward Fall",
                event_type_id=new_event_type.id
            )
            db.session.add(new_event_class)

            # 4. Create a Camera
            new_cam = Camera(
                cam_name="Cam 1",
                loc_id=new_loc.id
            )
            db.session.add(new_cam)
            
            # 5. Create a default Role
            if not Role.query.first():
                new_role = Role(role_name="Admin")
                db.session.add(new_role)

            db.session.commit()
            
            print("Database seeding successful!")
            return "Database seeded with 1 Location, 1 Camera, 1 EventType, and 1 EventClass."

        except Exception as e:
            db.session.rollback()
            print(f"Error seeding database: {e}")
            return f"Error seeding database: {e}", 500
        
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_index(path):
    """Serves the main index.html for all frontend routes (React Router)."""
    return send_from_directory(os.path.join(os.path.dirname(__file__), '..', 'dist'), 'index.html')

@app.route('/api/camera_status', methods=['GET'])
def get_camera_status():
    """
    Returns camera status from the DATABASE now.
    This replaces the old mock route.
    """
    try:
        cameras = Camera.query.all()
        status_list = []
        for cam in cameras:
            status_list.append({
                'id': cam.id,
                'location': cam.location.loc_name if cam.location else 'Unknown',
                'status': 'Connected' if cam.cam_status else 'Disconnected'
            })
        return jsonify({'status': 'success', 'cameras': status_list}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# --- Start Server ---

if __name__ == '__main__':
    print("Starting Flask server with SocketIO on port 5000...")
    print("Eventlet applied. Using eventlet for asynchronous mode.")
    print(f"Async mode: {socketio.async_mode}")

    try:
        socketio.run(app, host='0.0.0.0', port=5000, debug=False, use_reloader=False)
    except KeyboardInterrupt:
        print("Server shutting down...")
    finally:
        MOCK_STREAM_RUNNING = False
        mock_stream_event.set()
        if MOCK_STREAM_THREAD and MOCK_STREAM_THREAD.join():
            MOCK_STREAM_THREAD.join()
        print("Server shutdown complete.")