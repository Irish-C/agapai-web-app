# backend/app.py
import eventlet
eventlet.monkey_patch(thread=False) # Thread=False avoids context errors


from flask import Flask, request, jsonify, send_from_directory, Response
from flask_socketio import SocketIO, emit
# from hardware import HardwareAlertSystem 
# # Added the line above for Hardware integration
from dotenv import load_dotenv
import os
import time
import json
import base64
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import threading    
from flask_jwt_extended import JWTManager
import requests # <-- ADDED for Video Proxy

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

# --- Connection Pooling & Timeout ---
# Set pool recycle to less than server's wait_timeout (e.g., 2 hours = 7200 seconds)
app.config['SQLALCHEMY_POOL_RECYCLE'] = 7200 

# Force a test (pre-ping) query on the connection before use for stale connection
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    "pool_pre_ping": True
}
db.init_app(app)

jwt = JWTManager(app)

# Set up CORS policies
socketio = SocketIO(
    app,
    cors_allowed_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    async_mode='eventlet'
)

# Initialize the Hardware Alert System, passing the socketio instance
# hardware_system = HardwareAlertSystem(socketio)

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
    global MOCK_STREAM_RUNNING
    print("Starting mock stream loop...")
    incident_timer = time.time()
    INCIDENT_INTERVAL = 240  # seconds

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

                    # Only emit if MOCK_STREAM_RUNNING is True
                    if MOCK_STREAM_RUNNING:
                        socketio.emit('camera_frame', {
                            'cam_id': cam.id,  # <-- SEND THE DATABASE ID
                            'frame': frame_base64
                        })

            except Exception as e:
                print(f"Error in mock stream loop: {e}")

        # 2. Simulate Periodic Incident Alert
        current_time = time.time()
        if MOCK_STREAM_RUNNING and (current_time - incident_timer > INCIDENT_INTERVAL):
            mock_incident = {
                'type': 'Fall Detected',
                'location': 'Sebastian', # Update this to use a real location
                'timestamp': int(current_time)
            }
            socketio.emit('incident_alert', mock_incident)
            print(f"MOCK ALERT: {mock_incident['type']} at {mock_incident['location']} sent.")
            incident_timer = current_time

        # Simulate ~10 FPS
        socketio.sleep(0.1)

    print("Mock stream loop finished.")

# --- SocketIO Event Handlers ---

# --- SocketIO Event Handlers ---

@socketio.on('connect')
def handle_connect(auth=None):
    """Handles client connection and starts the mock stream if not running."""
    global MOCK_STREAM_THREAD, MOCK_STREAM_RUNNING, mock_stream_event
    print(f'Client connected: {request.sid}')
    
    with frame_lock:
        # Check if the thread object is None. 
        # In Eventlet mode, this is the most reliable check to see if the task has been started.
        if MOCK_STREAM_THREAD is None: # <--- CHANGED: Removed 'or not MOCK_STREAM_THREAD.is_alive()'
            print("Starting mock stream thread...")
            MOCK_STREAM_RUNNING = True
            mock_stream_event.clear() # Clear the stop flag
            # Start the background thread
            MOCK_STREAM_THREAD = socketio.start_background_task(mock_stream_loop)
            
@socketio.on('disconnect')
def handle_disconnect():
    """Handles client disconnections."""
    print(f'Client disconnected: {request.sid}')

# 💡 NEW SOCKET HANDLERS for controlling the mock stream from frontend 💡

@socketio.on('stop_mock_stream')
def handle_stop_mock_stream():
    """Stops the mock frame and incident emission."""
    global MOCK_STREAM_RUNNING
    MOCK_STREAM_RUNNING = False
    print("Mock stream emission stopped by client request.")
    emit('mock_stream_status', {'running': False, 'message': 'Mock stream paused.'})

@socketio.on('start_mock_stream')
def handle_start_mock_stream():
    """Starts/Resumes the mock frame and incident emission."""
    global MOCK_STREAM_RUNNING, MOCK_STREAM_THREAD, mock_stream_event
    
    # 1. Update the flag
    MOCK_STREAM_RUNNING = True
    
    # 2. Check if the thread is alive (it might have been stopped gracefully)
    if MOCK_STREAM_THREAD is None or not MOCK_STREAM_THREAD.is_alive():
        print("Mock stream thread restarting...")
        mock_stream_event.clear()
        MOCK_STREAM_THREAD = socketio.start_background_task(mock_stream_loop)
    else:
        print("Mock stream emission resumed.")
        
    emit('mock_stream_status', {'running': True, 'message': 'Mock stream running.'})


# --- Flask Routes (REST API & Main Entry Point) ---

# 💡 NEW ROUTE for Video Proxy 💡
PICAM_HOST = os.getenv('PICAM_HOST', 'localhost')
PICAM_PORT = os.getenv('PICAM_PORT', 4050)
PICAM_FEED_URL = f"http://{PICAM_HOST}:{PICAM_PORT}/video_feed"

@app.route('/api/live_stream/<int:cam_id>', methods=['GET'])
def live_stream_proxy(cam_id):
    """
    Proxies the Motion JPEG stream from the separate Pi Camera Flask app 
    (running on port 4050) to the main backend (port 5173).
    """
    
    # NOTE: cam_id is currently ignored, as we assume one Pi Camera for now.
    
    try:
        # Stream the request from the Pi Cam app
        response = requests.get(PICAM_FEED_URL, stream=True, timeout=5)
        
        # Check if the Pi Cam app is actually running
        if response.status_code == 200:
            # Return the response directly to the client
            return Response(
                response.iter_content(chunk_size=1024),
                mimetype=response.headers['Content-Type'],
                content_type=response.headers['Content-Type']
            )
        else:
            return f"Error: Pi Camera stream unavailable (Status: {response.status_code})", 503

    except requests.exceptions.RequestException as e:
        # The Pi Camera app is likely not running or unreachable
        print(f"Error connecting to Pi Camera stream at {PICAM_FEED_URL}: {e}")
        return jsonify({'status': 'error', 'message': 'Camera stream connection failed. Is picam.py running?'}), 503


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
    
# # Hardware Alert System API Endpoint of Ultralytics
# @app.route('/api/fall-detected', methods=['POST'])
# def fall_detected_hook():
#     """Endpoint called by the Ultralytics detection script."""
#     data = request.get_json()
#     location = data.get('location', 'Unknown Camera')
    
#     # This calls the method that rings the physical alarm and emits the socket.io event
#     hardware_system.trigger_alert(location=location) 
    
#     # You would typically also add database logging here
    
#     return jsonify({"status": "Alert triggered"}), 200


# Remote Silence Endpoint (Web Interface) - API endpoint that frontend's acknowledgeAlert function calls.
# @app.route('/api/acknowledge-alert', methods=['POST'])
# # You should add authentication/token validation here for a real system
# def acknowledge_alert_hook():
#     """Endpoint called by the web dashboard to silence the alarm."""
    
#     # Check if alarm is active and silence it
#     success = hardware_system.handle_remote_silence() 

#     if success:
#         return jsonify({"success": True, "message": "Alarm silenced and snoozed."}), 200
#     else:
#         return jsonify({"success": False, "message": "No active alarm to silence."}), 200



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
        # Graceful shutdown logic
        MOCK_STREAM_RUNNING = False
        mock_stream_event.set()
        if MOCK_STREAM_THREAD and MOCK_STREAM_THREAD.join():
            # Using eventlet.sleep to give background task a chance to exit
            socketio.sleep(0.5) 
        print("Server shutdown complete.")