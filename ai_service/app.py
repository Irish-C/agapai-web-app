import cv2
import numpy as np
import os
import time
import threading
import serial
import requests
import subprocess

from datetime import datetime, timezone, timedelta
from flask import Flask, Response, request, render_template_string, jsonify, send_from_directory
from ultralytics import YOLO

# Philippine Time timezone (UTC+8)
PH_TZ = timezone(timedelta(hours=8))

# ==========================================
# --- OPENVINO DEVICE CONFIGURATION ---
# ==========================================
# Try GPU first, fallback to CPU if GPU not accessible
# (Important for WSL2 environments)
try:
    from openvino import Core
    available_devices = Core().available_devices
    if 'GPU' in available_devices:
        os.environ['OPENVINO_DEVICE'] = 'GPU'
        print("[DEVICE] GPU detected - using OpenVINO GPU (Intel UHD Graphics)")
    else:
        os.environ['OPENVINO_DEVICE'] = 'CPU'
        print("[DEVICE] GPU not available - using CPU")
except Exception as e:
    os.environ['OPENVINO_DEVICE'] = 'CPU'
    print(f"[DEVICE] Could not detect devices, using CPU: {e}")

# Configure Flask static folder for offline Tailwind CSS
static_folder = os.path.join(os.path.dirname(__file__), 'static')
app = Flask(__name__, static_folder=static_folder, static_url_path='/static')

# Setup snapshots directory
SNAPSHOTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'server', 'static', 'snapshots')
os.makedirs(SNAPSHOTS_DIR, exist_ok=True)

# Serve snapshots as static files
@app.route('/api/snapshots/<filename>')
def serve_snapshot(filename):
    """Serve snapshot images"""
    try:
        # Sanitize filename to prevent directory traversal
        if '/' in filename or '\\' in filename:
            return jsonify({'error': 'Invalid filename'}), 400
        return send_from_directory(SNAPSHOTS_DIR, filename)
    except Exception as e:
        return jsonify({'error': str(e)}), 404

# Enable CORS for frontend to access video_feed
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

# ==========================================
# --- CONFIGURATION & HARDWARE ---
# ==========================================
BAUD_RATE = 115200
MODEL_PATH = r"best_openvino_model"

# ==========================================
# --- AUTO-DETECT SERIAL PORT ---
# ==========================================
def find_esp32_port():
    """Auto-detect ESP32 serial port (works on Windows, Linux, macOS)"""
    import platform
    import glob
    import os
    
    system = platform.system()
    
    # Check common USB serial ports explicitly (more reliable than glob)
    common_ports = []
    if system == 'Windows':
        common_ports = [f'COM{i}' for i in range(1, 256)]
    elif system == 'Darwin':
        common_ports = glob.glob('/dev/tty.*') + glob.glob('/dev/cu.*')
    else:
        # Linux: Check explicit USB ports first (they may not show in glob if just attached via USB/IP)
        for i in range(10):
            common_ports.append(f'/dev/ttyUSB{i}')
            common_ports.append(f'/dev/ttyACM{i}')
        # Skip /dev/ttyS* as they're usually system ports with permission issues
    
    print(f"[HARDWARE] Looking for USB serial devices...")
    print(f"[HARDWARE] Checking: /dev/ttyUSB0-9, /dev/ttyACM0-9")
    
    # First pass: Check which ports exist and are accessible
    accessible_ports = []
    for port in common_ports:
        if os.path.exists(port):
            accessible_ports.append(port)
            print(f"[HARDWARE]   ✓ Found device file: {port}")
    
    if not accessible_ports:
        print(f"[HARDWARE] ✗ No USB devices found!")
        print(f"[HARDWARE] If ESP32 is physically connected, check USB/IP passthrough:")
        print(f"[HARDWARE]   Windows PS (Admin): usbipd attach --wsl --busid <BUSID>")
        print(f"[HARDWARE]   Then: ls /dev/ttyUSB*")
        return None
    
    print(f"[HARDWARE] Attempting connection to {len(accessible_ports)} device(s)...")
    
    # Second pass: Try to connect
    for port in accessible_ports:
        try:
            print(f"[HARDWARE]   Connecting to {port}...")
            s = serial.Serial(port, BAUD_RATE, timeout=1.0)
            time.sleep(0.2)
            s.close()
            print(f"[HARDWARE] ✓ Successfully connected to {port}")
            return port
        except PermissionError:
            print(f"[HARDWARE]   Permission denied on {port}")
            print(f"[HARDWARE]   Fix: sudo chmod 666 {port}")
            continue
        except Exception as e:
            print(f"[HARDWARE]   Failed: {type(e).__name__}: {str(e)[:50]}")
            continue
    
    return None

esp32 = None
SERIAL_PORT = None

# ==========================================
# --- CAMERA RTSP STORAGE (Auto-Start) ---
# ==========================================
current_rtsp_url = None
current_camera_id = None
current_location_name = "Cam"  # Default location name for alerts

# --- HOT-PLUG ESP32 DETECTION THREAD ---
def esp32_hotplug_monitor():
    global esp32, SERIAL_PORT, hardware_connected, hardware_error_message
    last_port = None
    while True:
        port = find_esp32_port()
        if port and (SERIAL_PORT != port or not (esp32 and esp32.is_open)):
            try:
                if esp32 and esp32.is_open:
                    esp32.close()
                esp32 = serial.Serial(port, BAUD_RATE, timeout=0.1)
                SERIAL_PORT = port
                time.sleep(2)
                print(f"[HARDWARE] Hot-plug: Connected to ESP32 on {port}")
                hardware_connected = True
                hardware_error_message = "Connected"

                # # Execute PowerShell script
                # try:
                #     subprocess.run([
                #         "powershell", "-ExecutionPolicy", "Bypass", "-File", "C:\\startup-usb-monitor.ps1"
                #     ], check=True)
                #     print("[SCRIPT] PowerShell script executed successfully.")
                # except subprocess.CalledProcessError as e:
                #     print(f"[SCRIPT ERROR] Failed to execute PowerShell script: {e}")

            except Exception as e:
                hardware_connected = False
                hardware_error_message = f"Hot-plug connect failed: {str(e)[:30]}"
                esp32 = None
        elif not port:
            if esp32 and esp32.is_open:
                esp32.close()
            esp32 = None
            SERIAL_PORT = None
            hardware_connected = False
            hardware_error_message = "Not initialized"
        time.sleep(3)

# --- SERIAL LISTENER THREAD ---
def serial_listener():
    global esp32, hardware_muted, hardware_on_until, hardware_connected, hardware_error_message, SERIAL_PORT
    while True:
        if esp32 and esp32.is_open:
            try:
                if esp32.in_waiting > 0:
                    line = esp32.readline().decode('utf-8').strip()
                    if line == "BUTTON_PRESSED":
                        print("[HARDWARE] Physical Button Pressed! Muting Alert.")
                        with state_lock:
                            hardware_muted = True
                            hardware_on_until = 0.0 # Resets the 10s timer
            except Exception as e:
                print(f"[HARDWARE LISTENER] Error reading from {SERIAL_PORT}: {str(e)[:50]}")
                with hardware_lock:
                    hardware_connected = False
                    hardware_error_message = f"Listener error: {str(e)[:30]}"
                esp32 = None
        time.sleep(0.1)

# Start hot-plug monitor and serial listener threads
threading.Thread(target=esp32_hotplug_monitor, daemon=True).start()
threading.Thread(target=serial_listener, daemon=True).start()

# --- ESP32 MEMORY ---
last_sent_state = None
last_sent_time = 0.0

def trigger_hardware(state):
    print(f"[DEBUG] trigger_hardware called with state={state}, hardware_muted={hardware_muted}, hardware_on_until={hardware_on_until}, active_alerts={active_alerts}")
    """Sends ON/OFF signals to the ESP32 and tracks connection health."""
    global esp32, hardware_connected, hardware_last_successful_send
    global consecutive_hardware_failures, hardware_error_message, SERIAL_PORT
    global last_sent_state, last_sent_time
    
    current_time = time.time()
    
    # 1. Anti-spam logic: Only send if state changed or 10 seconds passed
    if state == "ON":
        if last_sent_time is not None and (current_time - last_sent_time < 10.0) and state == last_sent_state:
            return
    
    # 2. Attempt to reconnect if port was detected before but connection is dead
    if (esp32 is None or not esp32.is_open) and SERIAL_PORT:
        try:
            print(f"[HARDWARE] Attempting to reconnect to {SERIAL_PORT}...")
            esp32 = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=0.1)
            time.sleep(0.5)
            print(f"[HARDWARE] ✓ Reconnected to {SERIAL_PORT}")
        except Exception as e:
            print(f"[HARDWARE] Reconnection failed: {e}")
            with hardware_lock:
                hardware_connected = False
                hardware_error_message = f"Reconnection failed: {str(e)[:30]}"
            return
    
    # 3. Send the command
    if esp32 and esp32.is_open:
        try:
            # Send with newline (\n) to prevent buffer lockups
            esp32.write(b'1\n' if state == "ON" else b'0\n')
            
            # Update memory
            last_sent_state = state
            if state == 'ON' and hardware_muted:
                last_sent_time = current_time
                print(f"[HARDWARE] >>> ON Signal Sent (10s Cooldown Started)")
            
            last_sent_state = state

            # Update health tracking
            with hardware_lock:
                hardware_connected = True
                hardware_last_successful_send = current_time
                consecutive_hardware_failures = 0
                hardware_error_message = "Connected"
        except Exception as e:
            with hardware_lock:
                consecutive_hardware_failures += 1
                hardware_error_message = f"Write failed: {str(e)[:30]}"
                if consecutive_hardware_failures >= MAX_HARDWARE_CONSECUTIVE_FAILURES:
                    hardware_connected = False
                    last_sent_state = None 
    else:
        with hardware_lock:
            hardware_connected = False
            hardware_error_message = "Serial port closed"
            last_sent_state = None

# ==========================================
# --- ALERT PUBLISHING QUEUE (Background) ---
# ==========================================
alert_queue = []
alert_queue_lock = threading.Lock()

def publish_alerts_background():
    """Background thread that publishes alerts without blocking the stream"""
    consecutive_failures = 0
    max_consecutive_failures = 10
    
    while True:
        try:
            with alert_queue_lock:
                if alert_queue:
                    payload = alert_queue.pop(0)
                else:
                    payload = None
            
            if payload:
                try:
                    print(f"[ALERT WORKER] Attempting to send: {payload.get('class_name')} to http://localhost:5000/api/alerts")
                    response = requests.post(
                        'http://localhost:5000/api/alerts',
                        json=payload,
                        timeout=2
                    )
                    if response.status_code in [200, 201]:
                        print(f"[ALERT SENT ✓] Camera {payload.get('camera_id')}: {payload.get('alert_message')}")
                        consecutive_failures = 0
                    else:
                        print(f"[ALERT ERROR] HTTP {response.status_code}: {response.text[:100]}")
                        # Put it back in queue to retry
                        with alert_queue_lock:
                            alert_queue.insert(0, payload)
                        consecutive_failures += 1
                except Exception as e:
                    # Put it back in queue to retry
                    with alert_queue_lock:
                        alert_queue.insert(0, payload)
                    print(f"[ALERT ERROR] Request failed: {str(e)[:100]}")
                    consecutive_failures += 1
                    
                    if consecutive_failures >= max_consecutive_failures:
                        print(f"[ALERT WORKER] WARNING: {consecutive_failures} consecutive failures - check backend connection!")
            else:
                time.sleep(0.1)  # Small sleep when queue is empty
        except Exception as e:
            print(f"[BACKGROUND ALERT ERROR] Unexpected error: {e}")
            time.sleep(1)

# Start alert background thread
threading.Thread(target=publish_alerts_background, daemon=True).start()

def publish_alert_to_backend(camera_id, alert_message, frame=None, event_type="Detection", location_name="Unknown"):
    """Queue alert to be published asynchronously by background thread"""
    global alert_queue
    
    try:
        # Always get the latest location from backend cache if possible
        if camera_id is not None:
            location_name = get_camera_location(camera_id)
        # Save snapshot if frame is provided
        snapshot_filename = ''
        if frame is not None:
            try:
                now = datetime.now(PH_TZ)
                date_str = now.strftime('%Y%m%d')
                time_str = now.strftime('%H%M%S')
                location_safe = location_name.lower().replace(' ', '_').replace('/', '_')
                snapshot_filename = f"cam{camera_id}_{location_safe}_{date_str}_{time_str}.jpg"
                snapshot_path = os.path.join(SNAPSHOTS_DIR, snapshot_filename)
                success = cv2.imwrite(snapshot_path, frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                if success:
                    print(f"[SNAPSHOT SAVED] {snapshot_filename}")
                else:
                    print(f"[SNAPSHOT ERROR] Failed to write JPEG to {snapshot_path}")
                    snapshot_filename = ''
            except Exception as e:
                print(f"[SNAPSHOT ERROR] Could not save snapshot: {e}")
                snapshot_filename = ''
        print(f"[ALERT DEBUG] Raw alert_message: '{alert_message}'")
        print(f"[ALERT DEBUG] Location: '{location_name}'")
        print(f"[ALERT DEBUG] Camera ID: {camera_id}")
        class_name = None
        event_class_id = 1  # Default
        if "Floor:" in alert_message:
            try:
                parts = alert_message.split("Floor: ")[1].split(" Detected")[0]
                class_name = parts
                event_class_id = 2  # Falls
                print(f"[ALERT DEBUG] ✓ FLOOR matched: class_name='{class_name}'")
            except Exception as e:
                print(f"[ALERT DEBUG] ✗ FLOOR extraction failed: {e}, msg='{alert_message}'")
        elif "Inactivity" in alert_message:
            try:
                full_text = alert_message.split(": ")[1]
                print(f"[ALERT DEBUG] Inactivity full_text: '{full_text}'")
                class_name = full_text.rsplit(" (", 1)[0]
                print(f"[ALERT DEBUG] Extracted class_name: '{class_name}'")
                event_class_id = 4  # Placeholder - backend will look up by class_name
                print(f"[ALERT DEBUG] ✓ INACTIVITY matched: class_name='{class_name}'")
            except Exception as e:
                print(f"[ALERT DEBUG] ✗ INACTIVITY extraction failed: {e}, msg='{alert_message}'")
        else:
            print(f"[ALERT DEBUG] ✗ NO PATTERN MATCHED: msg='{alert_message}'")
        print(f"[ALERT DEBUG] Ready to queue: class_name='{class_name}', event_class_id={event_class_id}, location='{location_name}'")
        local_timestamp = datetime.now(PH_TZ).isoformat()
        print(f"[TIMESTAMP] Recording Philippine Time: {local_timestamp}")
        payload = {
            'camera_id': camera_id,
            'event_class_id': event_class_id,
            'alert_message': alert_message,
            'class_name': class_name,
            'snapshot_filename': snapshot_filename,
            'location_name': location_name,
            'timestamp': local_timestamp
        }
        with alert_queue_lock:
            alert_queue.append(payload)
            print(f"[ALERT QUEUED ✓] Queue size now: {len(alert_queue)}, message: '{alert_message}'")
    except Exception as e:
        print(f"[ALERT QUEUE ERROR] {e}")

# ==========================================
# --- AI & TRACKING STATE INITIALIZATION ---
# ==========================================
model_lock = threading.Lock() 
state_lock = threading.Lock() 

# --- TRACKING GLOBALS ---
rois = [] 
bed_trackers = {}
active_alerts = [] 
hardware_muted = False 
hardware_on_until = 0.0 # NEW: Tracks the 10-second timer
PATIENCE_SECONDS = 5.0

# --- CAMERA LOCATION CACHE ---
camera_locations = {}  # {camera_id: location_name}
location_cache_lock = threading.Lock()

def fetch_camera_locations():
    """Fetch camera locations from backend and cache them"""
    global camera_locations
    try:
        response = requests.get('http://localhost:5000/api/cameras/config/locations', timeout=2)
        if response.status_code == 200:
            data = response.json()
            if 'cameras' in data:
                with location_cache_lock:
                    camera_locations = data['cameras']
                print(f"[LOCATION CACHE] Updated camera locations: {camera_locations}")
        else:
            print(f"[LOCATION ERROR] Backend returned {response.status_code}")
    except Exception as e:
        print(f"[LOCATION WARNING] Could not fetch camera locations: {e}")
        # Don't crash - continue with empty cache

def get_camera_location(camera_id):
    """Get location for a camera ID, or default to Unknown"""
    with location_cache_lock:
        return camera_locations.get(str(camera_id), "Unknown")

# --- STREAM HEALTH MONITORING ---
stream_lock = threading.Lock()
stream_connected = False
stream_last_success_time = 0.0
consecutive_failed_reads = 0
stream_error_message = "Not started"
MAX_CONSECUTIVE_FAILURES = 50  # ~5 seconds at 10 FPS
FRAME_TIMEOUT_SECONDS = 3.0    # Timeout if no frame for 3 seconds 

# --- HARDWARE HEALTH MONITORING ---
hardware_lock = threading.Lock()
hardware_connected = False
hardware_last_successful_send = 0.0
consecutive_hardware_failures = 0
hardware_error_message = "Not initialized"
HARDWARE_TIMEOUT_SECONDS = 10.0     # No successful send for 10s = timeout
HARDWARE_CHECK_INTERVAL = 2.0       # Background monitor checks every 2s
MAX_HARDWARE_CONSECUTIVE_FAILURES = 50  # Increased threshold (matches stream robustness)

# --- INACTIVITY CONFIGURATION (DYNAMIC) ---
config_lock = threading.Lock()
INACTIVITY_LOW_SEC = 1800   # 30 minutes
INACTIVITY_MED_SEC = 3600   # 60 minutes
INACTIVITY_HIGH_SEC = 7200 # 120 minutes

safe_bed_classes = ["Lying Down", "Sitting", "Eating"]
fall_classes = ["Forward Fall", "Backward Fall", "Sideward Fall"]

try:
    model = YOLO(MODEL_PATH, task="detect")
    AI_AVAILABLE = True
    print(f"[SYSTEM] Model loaded successfully")
    print(f"[DEVICE] Using device: {os.environ.get('OPENVINO_DEVICE', 'CPU')}")
except Exception as e:
    AI_AVAILABLE = False
    print(f"[ERROR] Could not load model: {e}")

# ==========================================
# --- HELPER FUNCTIONS ---
# ==========================================
def draw_text_outline(img, text, pos, text_color=(255, 255, 255)):
    font = cv2.FONT_HERSHEY_DUPLEX
    font_scale = 0.6
    x, y = pos
    cv2.putText(img, text, (x, y), font, font_scale, (255, 255, 255), 3, cv2.LINE_AA)
    cv2.putText(img, text, (x, y), font, font_scale, text_color, 1, cv2.LINE_AA)

def generate_error_frame(error_message, frame_width=1280, frame_height=720):
    """Generate an error frame to display when RTSP connection fails.
    
    This ensures the HTTP response contains data, preventing the browser from cancelling the request.
    """
    frame = np.zeros((frame_height, frame_width, 3), dtype=np.uint8)
    
    # Red border
    cv2.rectangle(frame, (0, 0), (frame_width-1, frame_height-1), (0, 0, 255), 5)
    
    # Title
    cv2.putText(frame, "Connection Error", (50, 100), cv2.FONT_HERSHEY_DUPLEX, 1.5, (0, 0, 255), 2)
    
    # Error message
    y = 180
    for line in error_message.split('\n'):
        cv2.putText(frame, line, (50, y), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (150, 150, 150), 1)
        y += 40
    
    # Hint
    hint = "Check: 1) Camera IP reachable  2) RTSP credentials  3) Firewall settings  4) Network connectivity"
    cv2.putText(frame, hint, (30, frame_height - 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 100, 100), 1)
    
    return frame

# ==========================================
# --- WEB INTERFACE (HTML + JS) ---
# ==========================================
HTML_PAGE = """
<!DOCTYPE html>
<html>
<head>
    <title>Agapai Multi-Zone Monitor</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%230ea5e9'/><circle cx='50' cy='50' r='35' fill='%23020617'/><text x='50' y='60' font-size='40' font-weight='bold' fill='%230ea5e9' text-anchor='middle'>A</text></svg>">
    <link rel="stylesheet" href="/static/tailwind.css">
    <style>
        @keyframes flashRed {
            0%, 100% { border-color: rgb(15 23 42); box-shadow: inset 0 2px 4px 0 rgb(59 130 246 / 0.2); }
            50% { border-color: rgb(220 38 38); box-shadow: inset 0 0 30px rgb(220 38 38 / 0.8); }
        }
        .alarm-active { animation: flashRed 1.5s infinite; }
    </style>
</head>
<body class="bg-slate-900 text-white p-2 font-sans">
    <div class="w-full bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-2xl">
        <div class="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
            <div>
                <h1 class="text-2xl font-bold text-blue-400">Agapai Multi-Zone Web Monitor</h1>
                <p class="text-slate-400 text-xs font-mono">Draw ROIs directly on the video feed!</p>
            </div>
            <div class="text-right">
                <span class="block text-[10px] text-slate-500 uppercase tracking-widest">Model Status</span>
                <span class="px-3 py-1 rounded text-xs font-bold {{ 'bg-green-600' if ai_status else 'bg-red-600' }}">
                    {{ 'YOLOv11 LOADED' if ai_status else 'MODEL ERROR' }}
                </span>
                <div class="mt-3">
                    <span class="block text-[10px] text-slate-500 uppercase tracking-widest">Stream Status</span>
                    <span id="streamStatus" class="px-3 py-1 rounded text-xs font-bold bg-gray-600 cursor-help" title="Checking...">
                        CHECKING...
                    </span>
                </div>
                <div class="mt-3">
                    <span class="block text-[10px] text-slate-500 uppercase tracking-widest">Hardware Status</span>
                    <span id="hardwareStatus" class="px-3 py-1 rounded text-xs font-bold bg-gray-600 cursor-help" title="Checking...">
                        CHECKING...
                    </span>
                </div>
            </div>
        </div>
        
        <div class="grid grid-cols-5 gap-2">
            <div class="col-span-1 space-y-4">
                <div class="bg-slate-900 p-4 rounded-lg border border-slate-700">
                    <label class="block text-xs font-bold text-slate-500 mb-2 uppercase">Configuration</label>
                    <input id="ip" type="text" value="192.168.2.211" class="w-full bg-slate-800 p-2 rounded mb-3 text-sm border border-slate-600 focus:border-blue-500 outline-none transition-colors">
                    <input id="pass" type="password" value="agapai143" class="w-full bg-slate-800 p-2 rounded mb-3 text-sm border border-slate-600 focus:border-blue-500 outline-none transition-colors">
                    
                    <button onclick="connect()" class="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold transition-all shadow-lg active:scale-95 mb-4">
                        START ENGINE
                    </button>

                    <label class="block text-xs font-bold text-slate-500 mb-2 uppercase mt-2">Zone Management</label>
                    <div class="flex space-x-2 mb-4">
                        <button onclick="undoROI()" class="flex-1 bg-yellow-600 hover:bg-yellow-500 py-2 rounded text-xs font-bold transition-all shadow active:scale-95">UNDO (C)</button>
                        <button onclick="clearROIs()" class="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded text-xs font-bold transition-all shadow active:scale-95">CLEAR ALL (X)</button>
                    </div>

                    <label class="block text-xs font-bold text-slate-500 mb-2 uppercase">Inactivity Thresholds</label>
                    <div class="space-y-2 mb-3">
                        <div>
                            <label class="text-[10px] text-slate-400">Low (min):</label>
                            <select id="lowMin" class="w-full bg-slate-800 p-2 rounded text-sm border border-slate-600 focus:border-blue-500 outline-none transition-colors">
                                <option value="5s">5 seconds (Test)</option>
                                <option value="10s">10 seconds (Test)</option>
                                <option value="30s">30 seconds (Test)</option>
                                <option value="30" selected>30 minutes</option>
                                <option value="60">1 hour</option>
                                <option value="120">2 hours</option>
                                <option value="180">3 hours</option>
                                <option value="240">4 hours</option>
                                <option value="300">5 hours</option>
                                <option value="360">6 hours</option>
                                <option value="420">7 hours</option>
                                <option value="480">8 hours</option>
                                <option value="540">9 hours</option>
                                <option value="600">10 hours</option>
                                <option value="660">11 hours</option>
                                <option value="720">12 hours</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] text-slate-400">Medium (min):</label>
                            <select id="medMin" class="w-full bg-slate-800 p-2 rounded text-sm border border-slate-600 focus:border-blue-500 outline-none transition-colors">
                                <option value="5s">5 seconds (Test)</option>
                                <option value="10s">10 seconds (Test)</option>
                                <option value="30s">30 seconds (Test)</option>
                                <option value="30">30 minutes</option>
                                <option value="60" selected>1 hour</option>
                                <option value="120">2 hours</option>
                                <option value="180">3 hours</option>
                                <option value="240">4 hours</option>
                                <option value="300">5 hours</option>
                                <option value="360">6 hours</option>
                                <option value="420">7 hours</option>
                                <option value="480">8 hours</option>
                                <option value="540">9 hours</option>
                                <option value="600">10 hours</option>
                                <option value="660">11 hours</option>
                                <option value="720">12 hours</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] text-slate-400">High (min):</label>
                            <select id="highMin" class="w-full bg-slate-800 p-2 rounded text-sm border border-slate-600 focus:border-blue-500 outline-none transition-colors">
                                <option value="5s">5 seconds (Test)</option>
                                <option value="10s">10 seconds (Test)</option>
                                <option value="30s">30 seconds (Test)</option>
                                <option value="30">30 minutes</option>
                                <option value="60">1 hour</option>
                                <option value="120" selected>2 hours</option>
                                <option value="180">3 hours</option>
                                <option value="240">4 hours</option>
                                <option value="300">5 hours</option>
                                <option value="360">6 hours</option>
                                <option value="420">7 hours</option>
                                <option value="480">8 hours</option>
                                <option value="540">9 hours</option>
                                <option value="600">10 hours</option>
                                <option value="660">11 hours</option>
                                <option value="720">12 hours</option>
                            </select>
                        </div>
                        <button onclick="updateInactivityThresholds()" class="w-full bg-green-600 hover:bg-green-500 py-2 rounded text-xs font-bold transition-all shadow active:scale-95">
                            UPDATE THRESHOLDS
                        </button>
                    </div>
                </div>

                <div class="bg-red-950/20 p-4 rounded-lg border border-red-900/30 transition-colors" id="alertContainer">
                    <label class="block text-xs font-bold text-red-500 mb-2 uppercase flex justify-between items-center">
                        <span>Live Alerts</span>
                        <span id="alertCount" class="bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] hidden">0</span>
                    </label>
                    <div id="alertBox" class="space-y-2 text-sm max-h-32 overflow-y-auto mb-3">
                        <p class="text-slate-500 text-xs italic">System Normal. No active alerts.</p>
                    </div>
                    <button onclick="acknowledgeAlerts()" id="ackBtn" class="w-full bg-red-600 hover:bg-red-500 py-2 rounded text-xs font-bold transition-all shadow hidden active:scale-95">
                        ACKNOWLEDGE (A)
                    </button>
                </div>
            </div>

            <div class="col-span-4">
                <div id="videoWrapper" class="hidden relative rounded-xl border-4 border-slate-900 bg-black aspect-video overflow-hidden shadow-inner shadow-blue-500/20 transition-all duration-300">
                    <img id="display" class="w-full h-full object-fill absolute top-0 left-0" src="">
                    <canvas id="roiCanvas" class="w-full h-full absolute top-0 left-0 cursor-crosshair z-10"></canvas>
                </div>
                <div id="placeholder" class="bg-slate-900 aspect-video rounded-xl flex items-center justify-center text-slate-600 border-2 border-dashed border-slate-700">
                    <p class="italic text-sm text-center">Awaiting camera initialization...</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        // --- STREAM HEALTH MONITORING ---
        setInterval(() => {
            fetch('/stream_health').then(r => r.json()).then(data => {
                const statusBadge = document.getElementById('streamStatus');
                if (data.connected) {
                    statusBadge.className = 'px-3 py-1 rounded text-xs font-bold bg-green-600 cursor-help';
                    statusBadge.textContent = 'STREAM ACTIVE';
                    statusBadge.title = `Connected (Camera ID: ${data.camera_id || 'N/A'})\nTime since last frame: ${data.time_since_last_frame.toFixed(1)}s`;
                } else {
                    statusBadge.className = 'px-3 py-1 rounded text-xs font-bold bg-red-600 cursor-help';
                    statusBadge.textContent = 'STREAM OFFLINE';
                    statusBadge.title = `Error: ${data.error_message}\nFailed reads: ${data.consecutive_failed_reads}`;
                }
            }).catch(err => {
                const statusBadge = document.getElementById('streamStatus');
                statusBadge.className = 'px-3 py-1 rounded text-xs font-bold bg-yellow-600 cursor-help';
                statusBadge.textContent = 'UNREACHABLE';
                statusBadge.title = 'Cannot reach AI service health endpoint';
            });
        }, 1000);  // <-- Every 1 second

        // --- HARDWARE HEALTH MONITORING ---
        setInterval(() => {
            fetch('/hardware_health').then(r => r.json()).then(data => {
                const hardwareBadge = document.getElementById('hardwareStatus');
                if (data.connected) {
                    hardwareBadge.className = 'px-3 py-1 rounded text-xs font-bold bg-green-600 cursor-help';
                    hardwareBadge.textContent = 'HARDWARE ACTIVE';
                    hardwareBadge.title = `ESP32 Connected\nTime since last send: ${data.time_since_last_successful_send.toFixed(1)}s`;
                } else {
                    hardwareBadge.className = 'px-3 py-1 rounded text-xs font-bold bg-red-600 cursor-help';
                    hardwareBadge.textContent = 'HARDWARE FAIL';
                    hardwareBadge.title = `Error: ${data.error_message}\nConsecutive failures: ${data.consecutive_failures}`;
                }
            }).catch(err => {
                const hardwareBadge = document.getElementById('hardwareStatus');
                hardwareBadge.className = 'px-3 py-1 rounded text-xs font-bold bg-yellow-600 cursor-help';
                hardwareBadge.textContent = 'UNREACHABLE';
                hardwareBadge.title = 'Cannot reach hardware health endpoint';
            });
        }, 1000);  // <-- Every 1 second

        // --- ALERT POLLING LOGIC ---
        let alertsMuted = false;
        let previousAlertCount = 0;

        setInterval(() => {
            fetch('/get_alerts').then(r => r.json()).then(data => {
                const alerts = data.alerts;
                const alertBox = document.getElementById('alertBox');
                const ackBtn = document.getElementById('ackBtn');
                const alertCount = document.getElementById('alertCount');
                const videoWrapper = document.getElementById('videoWrapper');
                const alertContainer = document.getElementById('alertContainer');
                
                if (alerts.length > 0) {
                    alertBox.innerHTML = alerts.map(a => `<div class="p-2 bg-red-900/40 border border-red-500/50 rounded text-red-100 font-bold text-xs tracking-wide shadow-sm flex items-center"><span class="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>${a}</div>`).join('');
                    
                    ackBtn.classList.remove('hidden');
                    alertCount.classList.remove('hidden');
                    alertCount.innerText = alerts.length;
                    
                    // Un-mute alarms if new alerts pop up
                    if (alerts.length > previousAlertCount) {
                        alertsMuted = false;
                    }
                    
                    // Visual Alarm
                    if (!alertsMuted) {
                        videoWrapper.classList.add('alarm-active');
                        alertContainer.classList.replace('bg-red-950/20', 'bg-red-950/60');
                        alertContainer.classList.replace('border-red-900/30', 'border-red-600');
                    } else {
                        videoWrapper.classList.remove('alarm-active');
                        alertContainer.classList.replace('bg-red-950/60', 'bg-red-950/20');
                        alertContainer.classList.replace('border-red-600', 'border-red-900/30');
                    }
                } else {
                    alertBox.innerHTML = `<p class="text-slate-500 text-xs italic">System Normal. No active alerts.</p>`;
                    ackBtn.classList.add('hidden');
                    alertCount.classList.add('hidden');
                    videoWrapper.classList.remove('alarm-active');
                    alertContainer.classList.replace('bg-red-950/60', 'bg-red-950/20');
                    alertContainer.classList.replace('border-red-600', 'border-red-900/30');
                    alertsMuted = false; 
                }
                previousAlertCount = alerts.length;
            });
        }, 1000); 

        function acknowledgeAlerts() {
            if (previousAlertCount > 0) {
                alertsMuted = true;
                // Tell the backend to mute the physical ESP32 buzzer and kill the timer
                fetch('/ack_alerts', {method: 'POST'});
                
                document.getElementById('videoWrapper').classList.remove('alarm-active');
                const container = document.getElementById('alertContainer');
                container.classList.replace('bg-red-950/60', 'bg-red-950/20');
                container.classList.replace('border-red-600', 'border-red-900/30');
            }
        }

        // --- CAMERA LOGIC ---
        function connect() {
            const ip = document.getElementById('ip').value;
            const pass = document.getElementById('pass').value;
            
            document.getElementById('placeholder').classList.add('hidden');
            const wrapper = document.getElementById('videoWrapper');
            wrapper.classList.remove('hidden');
            
            document.getElementById('display').src = `/video_feed?ip=${ip}&pass=${pass}&t=${new Date().getTime()}`;
            setTimeout(setupCanvas, 500);
        }

        // --- ROI DRAWING LOGIC ---
        function setupCanvas() {
            const canvas = document.getElementById('roiCanvas');
            const ctx = canvas.getContext('2d');
            let isDrawing = false;
            let startX = 0, startY = 0;

            function resize() {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
            }
            window.addEventListener('resize', resize);
            resize();

            canvas.addEventListener('mousedown', (e) => {
                isDrawing = true;
                startX = e.offsetX;
                startY = e.offsetY;
            });

            canvas.addEventListener('mousemove', (e) => {
                if (!isDrawing) return;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = '#00a5ff';
                ctx.lineWidth = 2;
                ctx.strokeRect(startX, startY, e.offsetX - startX, e.offsetY - startY);
            });

            canvas.addEventListener('mouseup', (e) => {
                isDrawing = false;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                const x1 = startX / canvas.width;
                const y1 = startY / canvas.height;
                const x2 = e.offsetX / canvas.width;
                const y2 = e.offsetY / canvas.height;

                fetch('/add_roi', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ roi: [[x1, y1], [x2, y2]] })
                });
            });
        }

        function undoROI() { fetch('/undo_roi', {method: 'POST'}); }
        function clearROIs() { fetch('/clear_roi', {method: 'POST'}); }

        // --- INACTIVITY THRESHOLDS UPDATE ---
        async function updateInactivityThresholds() {
            const lowMin = document.getElementById('lowMin').value;
            const medMin = document.getElementById('medMin').value;
            const highMin = document.getElementById('highMin').value;

            // Helper function to handle both seconds and minutes
            function parseTime(val) {
                if (val === "0") return 0;
                if (val.endsWith('s')) return parseInt(val); // It's already in seconds
                return parseInt(val) * 60; // Convert minutes to seconds
            }

            // Calculate final seconds
            const lowSec = parseTime(lowMin);
            const medSec = parseTime(medMin);
            const highSec = parseTime(highMin);

            // Send the converted values to the backend
            fetch('/api/inactivity-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    low_sec: lowSec,
                    med_sec: medSec,
                    high_sec: highSec,
                }),
            })
            .then(response => {
                if (response.ok) {
                    alert(`✓ Thresholds Updated!\nLow: ${lowSec}s, Med: ${medSec}s, High: ${highSec}s`);
                } else {
                    alert('Failed to update thresholds. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error updating thresholds:', error);
                alert('An error occurred while updating thresholds.');
            });
        }

        // --- KEYBOARD SHORTCUTS ---
        document.addEventListener('keydown', function(event) {
            if (event.target.tagName === 'INPUT') return; 

            if (event.key.toLowerCase() === 'c') undoROI();
            if (event.key.toLowerCase() === 'x') clearROIs();
            if (event.key.toLowerCase() === 'a') acknowledgeAlerts(); 
        });
    </script>
</body>
</html>
"""

# ==========================================
# --- VIDEO PROCESSING CORE ---
# ==========================================
def generate_frames(rtsp_url):
    global active_alerts, hardware_muted, hardware_on_until
    global stream_connected, stream_last_success_time, consecutive_failed_reads, stream_error_message
    
    print(f"[generate_frames] Attempting to open RTSP stream: {rtsp_url[:60]}...")
    
    # Setup FFMPEG options with explicit timeout (in microseconds)
    os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|timeout;5000000"  # 5 second timeout
    
    # Try to open the video source with timeout handling
    cap = None
    try:
        cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Minimize buffer for low latency
        
        # Try to read one frame with a timeout to detect connection issues early
        # Set a short timeout before first read attempt
        cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 5000)  # 5 second read timeout
        
        # Attempt first frame read to check connection
        success, test_frame = cap.read()
        if not success:
            raise Exception("Could not read first frame from stream")
            
        print(f"[generate_frames] ✓ Successfully opened RTSP stream")
        
    except Exception as e:
        error_msg = f"[ERROR] Failed to open RTSP stream: {str(e)}"
        print(error_msg)
        
        # Release resources
        if cap:
            cap.release()
        
        with stream_lock:
            stream_connected = False
            stream_error_message = f"Connection failed: {str(e)[:40]}"
            consecutive_failed_reads = 0
        
        # Extract camera IP for error message
        try:
            url_parts = rtsp_url.split('@')
            camera_ip = url_parts[-1].split(':')[0] if '@' in rtsp_url else 'unknown'
        except:
            camera_ip = 'unknown'
        
        # Yield error frames to notify frontend
        error_detail = f"Connection Failed\nIP: {camera_ip}\nError: {str(e)[:30]}"
        error_frame = generate_error_frame(error_detail)
        
        error_start = time.time()
        while time.time() - error_start < 10:  # Show error for 10 seconds
            success, buffer = cv2.imencode('.jpg', error_frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            if success:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            time.sleep(0.5)
        return

    # Initialize stream as connected
    with stream_lock:
        stream_connected = True
        stream_last_success_time = time.time()
        consecutive_failed_reads = 0
        stream_error_message = "Stream active"

    frame_skip_counter = 0
    last_inference_time = time.time()
    inference_interval = 0.20  # Inference every 200ms (5 FPS)
    
    # FPS tracking
    frame_count = 0
    fps_start_time = time.time()
    current_fps = 0

    while True:
        success, frame = cap.read()
        current_time = time.time()
        
        if not success:
            with stream_lock:
                consecutive_failed_reads += 1
                # Check if we've exceeded max consecutive failures
                if consecutive_failed_reads >= MAX_CONSECUTIVE_FAILURES:
                    stream_connected = False
                    stream_error_message = f"Too many failed reads ({consecutive_failed_reads})"
                # Check for frame timeout
                elif current_time - stream_last_success_time > FRAME_TIMEOUT_SECONDS:
                    stream_connected = False
                    stream_error_message = f"Frame timeout (no frame for {FRAME_TIMEOUT_SECONDS}s)"
            
            time.sleep(0.01)
            continue
        
        # Successfully read a frame - reset failure counter and update timestamp
        with stream_lock:
            consecutive_failed_reads = 0
            stream_last_success_time = current_time
            stream_connected = True
            stream_error_message = "Stream active"
            
        frame_skip_counter += 1
        if frame_skip_counter % 5 != 0:  # Process 1/5 frames for streaming
            continue
        
        # Update FPS counter
        frame_count += 1
        elapsed = time.time() - fps_start_time
        if elapsed >= 1.0:  # Update FPS every second
            current_fps = frame_count / elapsed
            frame_count = 0
            fps_start_time = time.time()
        
        should_infer = (current_time - last_inference_time) >= inference_interval 
            
        h, w = frame.shape[:2]

        pixel_rois = []
        with state_lock:
            for r in rois:
                x1, y1 = int(r[0][0] * w), int(r[0][1] * h)
                x2, y2 = int(r[1][0] * w), int(r[1][1] * h)
                tl = (min(x1, x2), min(y1, y2))
                br = (max(x1, x2), max(y1, y2))
                pixel_rois.append((tl, br))

            keys_to_remove = [k for k in bed_trackers.keys() if k >= len(pixel_rois)]
            for k in keys_to_remove:
                del bed_trackers[k]
            for i in range(len(pixel_rois)):
                if i not in bed_trackers:
                    bed_trackers[i] = {"label": None, "start_time": 0, "last_seen": 0, "box": None}

        instruction_text = f"Zones Active: {len(pixel_rois)}/30"
        fps_text = f"FPS: {current_fps:.1f}"
        draw_text_outline(frame, fps_text, (20, 15), (0, 0, 0))
        draw_text_outline(frame, instruction_text, (20, 30), (0, 0, 0))

        # --- AI INFERENCE (Only every 200ms, not every frame) ---
        floor_detections = []
        if should_infer and AI_AVAILABLE:
            last_inference_time = current_time
            with model_lock:
                results = model(frame, verbose=False, conf=0.65, imgsz=640) 
            
            for r in results:
                for box in r.boxes:
                    bx1, by1, bx2, by2 = map(int, box.xyxy[0]) 
                    class_id = int(box.cls[0])            
                    label = model.names[class_id]         
                    
                    center_x = int((bx1 + bx2) / 2)
                    center_y = int((by1 + by2) / 2)
                    
                    roi_idx = -1
                    for i, (tl, br) in enumerate(pixel_rois):
                        if tl[0] < center_x < br[0] and tl[1] < center_y < br[1]:
                            roi_idx = i
                            break

                    if roi_idx != -1:
                        if label in ["Standing", "Walking"]:
                            continue 
                        if label in fall_classes:
                            label = "Lying Down"
                        if label not in safe_bed_classes:
                            continue 

                        with state_lock:
                            tracker = bed_trackers[roi_idx]
                            if tracker["label"] != label:
                                # Only start a new timer if they were previously NOT in the zone
                                if tracker["label"] is None:
                                    tracker["start_time"] = current_time
                                tracker["label"] = label
                            tracker["last_seen"] = current_time
                            tracker["box"] = (bx1, by1, bx2, by2)
                    else:
                        floor_detections.append((bx1, by1, bx2, by2, label))

        # --- DRAWING & ALERT GENERATION LOGIC (Every frame, not just inference frames) ---
        current_frame_alerts = []
        
        with state_lock:
            occupied_rois = set()
            for i, tracker in bed_trackers.items():
                if tracker["label"] is not None and (current_time - tracker["last_seen"] <= PATIENCE_SECONDS):
                    occupied_rois.add(i)

            for i, (tl, br) in enumerate(pixel_rois):
                if i not in occupied_rois:
                    cv2.rectangle(frame, tl, br, (200, 200, 200), 1) 

            for i, tracker in bed_trackers.items():
                if tracker["label"] is not None:
                    if current_time - tracker["last_seen"] > PATIENCE_SECONDS:
                        tracker["label"] = None
                        tracker["box"] = None
                    else:
                        elapsed = int(current_time - tracker["start_time"])
                        mins, secs = divmod(elapsed, 60)
                        time_str = f"{mins:02d}:{secs:02d}"
                        tx1, ty1, tx2, ty2 = tracker["box"]
                        
                        # Read thresholds safely
                        with config_lock:
                            low_threshold = INACTIVITY_LOW_SEC
                            med_threshold = INACTIVITY_MED_SEC
                            high_threshold = INACTIVITY_HIGH_SEC
                        
                        if elapsed >= high_threshold:
                            box_color = (0, 0, 255)       
                            status_text = f"HIGH INACT [{time_str}]"
                            current_frame_alerts.append(f"Zone {i+1}: Inactivity (High) ({time_str})")
                        elif elapsed >= med_threshold:
                            box_color = (0, 165, 255)     
                            status_text = f"MED INACT [{time_str}]"
                            current_frame_alerts.append(f"Zone {i+1}: Inactivity (Medium) ({time_str})")
                        elif elapsed >= low_threshold:
                            box_color = (0, 255, 255)     
                            status_text = f"LOW INACT [{time_str}]"
                            current_frame_alerts.append(f"Zone {i+1}: Inactivity (Low) ({time_str})")
                        else:
                            if tracker["label"] == "Lying Down":
                                box_color = (139, 69, 19) 
                            else:
                                box_color = (72, 107, 18) 
                            status_text = f"{tracker['label']} [{time_str}]"

                        cv2.rectangle(frame, (tx1, ty1), (tx2, ty2), box_color, 2)
                        draw_text_outline(frame, status_text, (tx1, max(10, ty1 - 10)), box_color)

        for (fx1, fy1, fx2, fy2, flabel) in floor_detections:
            if flabel == "Lying Down":
                continue
            if flabel in fall_classes:
                f_color = (0, 0, 255)
                current_frame_alerts.append(f"Floor: {flabel} Detected!")
            elif flabel in ["Sitting", "Walking", "Standing", "Eating"]:
                f_color = (72, 107, 18) 
            else:
                f_color = (150, 150, 150)

            cv2.rectangle(frame, (fx1, fy1), (fx2, fy2), f_color, 2)
            draw_text_outline(frame, flabel, (fx1, max(10, fy1 - 10)), f_color)

        # --- 10-SECOND HARDWARE TIMER LOGIC ---
  
        with state_lock:
            # NEW: Only update active_alerts if there are NEW alerts this frame
            if len(current_frame_alerts) > 0:
                # New alert detected - keep it for 10 seconds
                active_alerts = current_frame_alerts
                if not hardware_muted:
                    hardware_on_until = current_time + 10.0
                
                # Publish new alerts to backend for logging and Socket.IO
                for alert in current_frame_alerts:
                    publish_alert_to_backend(current_camera_id, alert, frame=frame, location_name=current_location_name)
            
            elif current_time >= hardware_on_until:
                # Timer expired - only NOW clear the alerts and reset mute state
                active_alerts = []
                hardware_muted = False
            
            # else: Keep previous active_alerts until the timer expires
            
            # Fire the hardware if we are currently inside the 10-second window and not muted
            if current_time < hardware_on_until and not hardware_muted:
                trigger_hardware("ON")
            else:
                trigger_hardware("OFF")

        # Encode to JPEG (high quality for good FPS)
        success, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        if not success:
            continue
            
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

# ==========================================
# --- FLASK ROUTES ---
# ==========================================
@app.route('/')
def index():
    return render_template_string(HTML_PAGE, ai_status=AI_AVAILABLE)

@app.route('/api/start', methods=['POST'])
def api_start():
    """Initialize AI detection for the single camera."""
    global current_rtsp_url, current_camera_id, current_location_name
    
    data = request.json
    rtsp_url = data.get('rtsp_url')
    location_name = data.get('location_name', 'Unknown')  # Optional location name
    
    if not rtsp_url:
        return jsonify({"status": "error", "message": "Missing rtsp_url"}), 400
    
    # Always use camera_id = 1 for single-camera architecture
    current_camera_id = 1
    current_rtsp_url = rtsp_url
    current_location_name = location_name  # Store location for alerts
    
    # Reset detection state
    with state_lock:
        global rois, bed_trackers, active_alerts, hardware_muted, hardware_on_until
        rois = []
        bed_trackers.clear()
        active_alerts = []
        hardware_muted = False
        hardware_on_until = 0.0
    
    print(f"[API] ✓ AI service initialized for camera at location: {current_location_name}")
    return jsonify({"status": "success", "message": "Detection ready"}), 200

@app.route('/api/stop', methods=['POST'])
def api_stop():
    """Stop AI detection (called from backend when camera is deleted)."""
    global current_rtsp_url, current_camera_id
    
    # Clear stored RTSP URL
    current_rtsp_url = None
    current_camera_id = None
    
    # Reset all state
    with state_lock:
        global active_alerts, hardware_muted, hardware_on_until
        active_alerts = []
        hardware_muted = False
        hardware_on_until = 0.0
    
    trigger_hardware("OFF")
    print(f"[API] ✓ AI service stopped")
    return jsonify({"status": "success", "message": "Detection stopped"}), 200

@app.route('/video_feed')
def video_feed():
    global current_camera_id, current_rtsp_url
    
    ip = request.args.get('ip')
    pw = request.args.get('pass')
    camera_id = request.args.get('camera_id')  # Get camera_id from request
    
    # Determine which RTSP URL to use
    rtsp_url = None
    if ip and pw:
        # Frontend provided IP and password - construct RTSP URL
        rtsp_url = f"rtsp://admin:{pw}@{ip}:554/cam/realmonitor?channel=1&subtype=0"
        if camera_id:
            current_camera_id = camera_id
    elif current_rtsp_url:
        # Use the URL that was set by backend via /api/start
        rtsp_url = current_rtsp_url
    else:
        # No camera configured
        print("[VIDEO_FEED] No camera configured (no ip/pw provided and no current_rtsp_url set)")
        return jsonify({"error": "No camera configured. Call /api/start first."}), 400
    
    print(f"[VIDEO_FEED] Starting stream for camera_id={camera_id or 'unknown'}, URL={rtsp_url[:50]}...")
    return Response(generate_frames(rtsp_url), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/get_alerts')
def get_alerts():
    with state_lock:
        return jsonify({"alerts": active_alerts})

@app.route('/stream_health')
def stream_health():
    """Return current stream health status"""
    with stream_lock:
        time_since_last_frame = time.time() - stream_last_success_time if stream_last_success_time else 0
        return jsonify({
            "connected": stream_connected,
            "error_message": stream_error_message,
            "consecutive_failed_reads": consecutive_failed_reads,
            "time_since_last_frame": time_since_last_frame,
            "camera_id": current_camera_id
        })

@app.route('/hardware_health')
def hardware_health():
    """Return current hardware (ESP32) health status"""
    with hardware_lock:
        time_since_last_send = time.time() - hardware_last_successful_send if hardware_last_successful_send > 0 else 0
        return jsonify({
            "connected": hardware_connected,
            "error_message": hardware_error_message,
            "consecutive_failures": consecutive_hardware_failures,
            "time_since_last_successful_send": time_since_last_send
        })

@app.route('/ack_alerts', methods=['POST'])
def ack_alerts():
    global hardware_muted, hardware_on_until
    with state_lock:
        hardware_muted = True
        hardware_on_until = 0.0 # Instantly kill the 10-second timer
    return jsonify({"status": "success"})

@app.route('/add_roi', methods=['POST'])
def add_roi():
    data = request.json
    with state_lock:
        if len(rois) < 30:
            rois.append(data['roi'])
    return jsonify({"status": "success"})

@app.route('/undo_roi', methods=['POST'])
def undo_roi():
    with state_lock:
        if len(rois) > 0:
            rois.pop()
    return jsonify({"status": "success"})

@app.route('/clear_roi', methods=['POST'])
def clear_roi():
    global rois, bed_trackers
    with state_lock:
        rois = []
        bed_trackers.clear()
    return jsonify({"status": "success"})

def hardware_reconnection_monitor():
    """Background thread that continuously monitors ESP32 connection and auto-reconnects."""
    global esp32, hardware_connected, consecutive_hardware_failures, hardware_error_message, SERIAL_PORT, hardware_last_successful_send
    
    print("[HARDWARE MONITOR] Starting background reconnection monitor...")
    
    while True:
        try:
            current_time = time.time()
            
            # READ STATUS SAFELY WITH LOCK (prevent race conditions)
            with hardware_lock:
                is_disconnected = esp32 is None or (isinstance(esp32, serial.Serial) and not esp32.is_open)
                time_since_last_send = current_time - hardware_last_successful_send if hardware_last_successful_send > 0 else 0
                is_timeout = (hardware_last_successful_send > 0 and time_since_last_send > HARDWARE_TIMEOUT_SECONDS)
            
            if (is_disconnected or is_timeout) and SERIAL_PORT:
                if is_timeout:
                    print(f"[HARDWARE MONITOR] Timeout detected: no successful send for {time_since_last_send:.1f}s")
                else:
                    print(f"[HARDWARE MONITOR] Detected disconnection. Attempting to reconnect to {SERIAL_PORT}...")
                
                try:
                    # Clean up old connection if it exists (with lock to prevent conflicts)
                    with hardware_lock:
                        if esp32 and isinstance(esp32, serial.Serial):
                            try:
                                esp32.close()
                            except:
                                pass
                            esp32 = None
                    
                    # Attempt new connection (outside lock to avoid blocking other operations)
                    new_port = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=0.1)
                    time.sleep(0.5)
                    
                    # Update both esp32 and health status with lock
                    with hardware_lock:
                        esp32 = new_port
                        hardware_connected = True
                        hardware_last_successful_send = current_time
                        consecutive_hardware_failures = 0
                        hardware_error_message = "Reconnected by monitor"
                    
                    print(f"[HARDWARE MONITOR] ✓ Successfully reconnected to {SERIAL_PORT}")
                
                except Exception as e:
                    print(f"[HARDWARE MONITOR] Reconnection attempt failed: {str(e)[:50]}")
                    with hardware_lock:
                        hardware_connected = False
                        hardware_error_message = f"Monitor reconnect failed: {str(e)[:25]}"
                        esp32 = None
            
            time.sleep(HARDWARE_CHECK_INTERVAL)
        
        except Exception as e:
            print(f"[HARDWARE MONITOR ERROR] Unexpected error: {e}")
            time.sleep(HARDWARE_CHECK_INTERVAL)


@app.route('/api/inactivity-config', methods=['POST'])
def update_inactivity_config():
    """Update inactivity thresholds dynamically"""
    global INACTIVITY_LOW_SEC, INACTIVITY_MED_SEC, INACTIVITY_HIGH_SEC
    
    try:
        data = request.json
        low = int(data.get('low_sec', 1800))
        med = int(data.get('med_sec', 3600))
        high = int(data.get('high_sec', 7200))
        
        # Validate (Lowered to 1 second for testing)
        if low < 1 or med < 1 or high < 1:
            return jsonify({"status": "error", "message": "All values must be >= 1 second"}), 400
        if low >= med or med >= high:
            return jsonify({"status": "error", "message": "Must be: Low < Medium < High"}), 400
        
        with config_lock:
            INACTIVITY_LOW_SEC = low
            INACTIVITY_MED_SEC = med
            INACTIVITY_HIGH_SEC = high
        
        print(f"[CONFIG] ✓ Inactivity thresholds updated: Low={low}s, Med={med}s, High={high}s")
        return jsonify({
            "status": "success",
            "low_sec": low,
            "med_sec": med,
            "high_sec": high,
            "message": "Thresholds updated successfully"
        }), 200
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    # Start ESP32 hardware reconnection monitor if port was detected
    if SERIAL_PORT:
        print("[STARTUP] Starting background hardware reconnection monitor...")
        threading.Thread(target=hardware_reconnection_monitor, daemon=True).start()
    
    # Fetch camera locations from backend on startup (non-blocking)
    print("[STARTUP] Fetching camera locations from backend in background...")
    threading.Thread(target=fetch_camera_locations, daemon=True).start()
    
    app.run(host='0.0.0.0', port=3000, threaded=True)
