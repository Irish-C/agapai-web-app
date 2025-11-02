import time
import json
import base64
from io import BytesIO
from PIL import Image, ImageDraw

from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
import os

# --- MOCKING MODULES (Replace with actual imports later) ---
class MockCore:
    """Mocks the OpenVINO Core for model loading."""
    def read_model(self, model): return self
    def compile_model(self, model, device_name): return self
    def infer(self, inputs): return [None]
    def input(self, index): return None
    def output(self, index): return None
class MockPicam:
    def capture_array(self): return None
    def start(self): pass
# Replace actual library imports with these mock classes
MockOpenVinoCore = MockCore() 

# --- FLASK APP INITIALIZATION ---
load_dotenv() 
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'agapai_default_secret') 
# Using eventlet for asynchronous support, essential for SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet') 

# --- MOCK DATA/CONFIG ---
MOCK_USERS = {
    "admin@agapai.com": {"password": "adminpass", "role": "admin"},
    "caregiver@agapai.com": {"password": "carepass", "role": "general"}
}
MOCK_MODEL_XML = 'mock_yolov8_fall.xml'
MOCK_MODEL_BIN = 'mock_yolov8_fall.bin'


# ---------------------------------------------------------------------
# A. REAL-TIME VIDEO & ALERT LOOP (MOCK)
# ---------------------------------------------------------------------

def generate_mock_frame(text="AGAPAI MOCK STREAM"):
    """Creates a dummy red image frame with text, encoded to base64."""
    img = Image.new('RGB', (640, 480), color = 'red')
    d = ImageDraw.Draw(img)
    d.text((10,10), text, fill=(255,255,255))
    
    # Encode to JPEG base64 for transmission
    buf = BytesIO()
    img.save(buf, format='JPEG')
    return base64.b64encode(buf.getvalue()).decode('utf-8')


def mock_stream_loop():
    """
    MOCK function: Simulates the continuous RPi Capture -> OpenVINO -> FuzzyLogic loop.
    """
    print("MOCK: Loading OpenVINO Model...")
    try:
        # 1. MOCK MODEL LOAD: If files exist, this simulates the successful load.
        MockOpenVinoCore.read_model(MOCK_MODEL_XML) 
        print(f"MOCK: Successfully loaded {MOCK_MODEL_XML} and {MOCK_MODEL_BIN}")
    except Exception as e:
        print(f"MOCK ERROR: Could not load mock model files. Check path! {e}")
        return # Stop stream if mock load fails

    while True:
        # This loop runs the central processing every 0.1 seconds (10 FPS)
        
        # 2. MOCK INFERENCE: Simulate frame processing
        frame_data = generate_mock_frame(f"MOCK STREAMING: {time.strftime('%H:%M:%S')}")
        
        video_payload = {
            'camera_id': 'cam1', # Corresponds to a camera_id in your DB
            'image': frame_data,
            'timestamp': time.time()
        }
        # 3. WEBSOCKET EMIT: Sends the mock frame to all connected clients
        socketio.emit('video_frame', video_payload, broadcast=True)

        # 4. MOCK ALERT: Simulate a Fall Alert every 30 seconds
        if int(time.time()) % 30 == 0:
            alert_payload = {
                'type': 'Fall Detected',
                'location': 'Living Room',
                'message': 'CRITICAL: Fall confirmed by MOCK FuzzyLogic.',
                'timestamp': time.time()
            }
            socketio.emit('incident_alert', alert_payload, broadcast=True)
            print("--- MOCK ALERT EMITTED ---")
            
        socketio.sleep(0.1) # SocketIO-friendly sleep


# ---------------------------------------------------------------------
# B. WEBSOCKET HANDLERS
# ---------------------------------------------------------------------

@socketio.on('connect')
def handle_connect():
    """When a React client connects, start the background stream."""
    print(f"Client connected: {request.sid}")
    # Start the stream loop as a separate thread
    socketio.start_background_task(target=mock_stream_loop)


@socketio.on('disconnect')
def handle_disconnect():
    print(f"Client disconnected: {request.sid}")


# ---------------------------------------------------------------------
# C. REST API HANDLERS (for Login and Reports)
# ---------------------------------------------------------------------

@app.route('/api/login', methods=['POST'])
def login():
    """Handles REST login request from the LoginPage."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user_info = MOCK_USERS.get(email)

    if user_info and user_info['password'] == password:
        return jsonify({
            "message": "Login successful",
            "token": "mock_jwt_token_for_" + user_info['role'],
            "role": user_info['role'],
            "user_id": 1 # Mock ID
        }), 200
    
    return jsonify({"message": "Invalid credentials"}), 401

@app.route('/api/reports', methods=['GET'])
def get_reports():
    """Handles REST request for Report data from the ReportsPage."""
    
    # MOCK DATA: This is where you would query QuestDB
    mock_report_data = {
        "summary": "Mock data loaded from Flask API.",
        "incidents_by_location": [{"location": "Living Room", "count": 15}, {"location": "Hallway", "count": 5}],
        "monthly_trends": [{"month": "Jan", "falls": 10, "inactivity": 20}, {"month": "Feb", "falls": 15, "inactivity": 25}],
    }
    return jsonify(mock_report_data), 200


# ---------------------------------------------------------------------
# D. RUN SERVER
# ---------------------------------------------------------------------
if __name__ == '__main__':
    print("Starting Flask server with SocketIO on port 5000...")
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)