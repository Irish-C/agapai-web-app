import cv2
import os
import time
import threading
import serial
import requests
from datetime import datetime, timezone
from flask import Flask, Response, request, render_template_string, jsonify, send_from_directory
from ultralytics import YOLO

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

app = Flask(__name__)

# Setup snapshots directory
SNAPSHOTS_DIR = os.path.join(os.path.dirname(__file__), 'snapshots')
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

SERIAL_PORT = find_esp32_port()
if SERIAL_PORT:
    print(f"[HARDWARE] Auto-detected ESP32 on {SERIAL_PORT} ✓")
else:
    print(f"[HARDWARE] No ESP32 detected on common serial ports")

# ==========================================
# --- CAMERA RTSP STORAGE (Auto-Start) ---
# ==========================================
current_rtsp_url = None
current_camera_id = None

esp32 = None
if SERIAL_PORT:
    try:
        print(f"[HARDWARE] Connecting to ESP32 on {SERIAL_PORT}...")
        esp32 = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=0.1)
        time.sleep(2) 
        print("[HARDWARE] ESP32 Connected!")

        # --- INSERT LISTENER HERE ---
        def serial_listener():
            global hardware_muted, hardware_on_until
            while True:
                if esp32 and esp32.is_open:
                    try:
                        if esp32.in_waiting > 0:
                            # Listen for the message from ESP32
                            line = esp32.readline().decode('utf-8').strip()
                            if line == "BUTTON_PRESSED":
                                print("[HARDWARE] Physical Button Pressed! Muting Alert.")
                                with state_lock:
                                    hardware_muted = True
                                    hardware_on_until = 0.0 # Resets the 10s timer
                    except:
                        pass
                time.sleep(0.1) # Small sleep to prevent high CPU usage

        # Start the thread immediately
        threading.Thread(target=serial_listener, daemon=True).start()
        # ----------------------------
        
    except Exception as e:
        print(f"[HARDWARE ERROR] Could not connect: {e}")
else:
    print("[HARDWARE] Skipping ESP32 initialization - no port detected")

def trigger_hardware(state):
    """Sends ON/OFF signals to the ESP32."""
    global esp32
    if esp32 and esp32.is_open:
        try:
            esp32.write(b'1' if state == "ON" else b'0')
        except:
            pass

def publish_alert_to_backend(camera_id, alert_message, frame=None, event_type="Detection"):
    """Publish alert to backend for database logging and Socket.IO broadcasting"""
    try:
        # Extract the actual detected class name from alert message
        # Alert messages are like: "Floor: Backward Fall Detected!" or "Zone 1: Critical Inactivity (...)"
        class_name = None
        event_class_id = 1  # Default
        
        if "Floor:" in alert_message:
            # Extract fall type: "Floor: Backward Fall Detected!" → "Backward Fall"
            parts = alert_message.split("Floor: ")[1].split(" Detected")[0]
            class_name = parts
            event_class_id = 2  # Falls
        elif "Inactivity" in alert_message:
            # Extract inactivity level: "Zone 1: Inactivity (High) (30:45)" → "Inactivity (High)"
            if "Inactivity" in alert_message:
                parts = alert_message.split(": ")[1].split(" (")[0]
                class_name = parts  # "Inactivity (High)", "Inactivity (Medium)", etc.
            event_class_id = 3  # Inactivity
        
        # Save snapshot if frame is provided
        snapshot_url = ''
        if frame is not None:
            try:
                timestamp = int(time.time() * 1000)  # milliseconds for uniqueness
                snapshot_filename = f"alert_cam{camera_id}_{timestamp}.jpg"
                snapshot_path = os.path.join(SNAPSHOTS_DIR, snapshot_filename)
                
                # Save the frame as JPEG
                success = cv2.imwrite(snapshot_path, frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                if success:
                    snapshot_url = f"http://localhost:3000/api/snapshots/{snapshot_filename}"
                    print(f"[SNAPSHOT SAVED] {snapshot_filename}")
            except Exception as e:
                print(f"[SNAPSHOT ERROR] Could not save snapshot: {e}")
        
        payload = {
            'camera_id': camera_id,
            'event_class_id': event_class_id,
            'alert_message': alert_message,
            'class_name': class_name,  # Send the extracted class name
            'snapshot_url': snapshot_url,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        response = requests.post(
            'http://localhost:5000/api/alerts',
            json=payload,
            timeout=2
        )
        if response.status_code in [200, 201]:
            print(f"[ALERT SENT] Camera {camera_id}: {alert_message}")
        else:
            print(f"[ALERT ERROR] Backend returned {response.status_code}")
    except Exception as e:
        print(f"[ALERT ERROR] Could not send to backend: {e}")

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
PATIENCE_SECONDS = 3.0

# --- STREAM HEALTH MONITORING ---
stream_lock = threading.Lock()
stream_connected = False
stream_last_success_time = 0.0
consecutive_failed_reads = 0
stream_error_message = "Not started"
MAX_CONSECUTIVE_FAILURES = 50  # ~5 seconds at 10 FPS
FRAME_TIMEOUT_SECONDS = 3.0    # Timeout if no frame for 3 seconds 

INACTIVITY_LOW_SEC = 300   # 5 minutes
INACTIVITY_MED_SEC = 900   # 15 minutes
INACTIVITY_HIGH_SEC = 1800 # 30 minutes

safe_bed_classes = ["Lying Down", "Sitting", "Eating"]
fall_classes = ["Forward Fall", "Backward Fall", "Sideward Fall"]

try:
    model = YOLO(MODEL_PATH, task="detect")
    AI_AVAILABLE = True
    print(f"[SYSTEM] Model loaded successfully")
    print(f"[DEVICE] Using device: CPU (OpenVINO will use GPU if available via env vars)")
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

# ==========================================
# --- WEB INTERFACE (HTML + JS) ---
# ==========================================
HTML_PAGE = """
<!DOCTYPE html>
<html>
<head>
    <title>Agapai Multi-Zone Monitor</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @keyframes flashRed {
            0%, 100% { border-color: rgb(15 23 42); box-shadow: inset 0 2px 4px 0 rgb(59 130 246 / 0.2); }
            50% { border-color: rgb(220 38 38); box-shadow: inset 0 0 30px rgb(220 38 38 / 0.8); }
        }
        .alarm-active { animation: flashRed 1.5s infinite; }
    </style>
</head>
<body class="bg-slate-900 text-white p-10 font-sans">
    <div class="max-w-6xl mx-auto bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
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
            </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div class="space-y-4">
                <div class="bg-slate-900 p-4 rounded-lg border border-slate-700">
                    <label class="block text-xs font-bold text-slate-500 mb-2 uppercase">Configuration</label>
                    <input id="ip" type="text" value="192.168.2.211" class="w-full bg-slate-800 p-2 rounded mb-3 text-sm border border-slate-600 focus:border-blue-500 outline-none transition-colors">
                    <input id="pass" type="password" value="agapai143" class="w-full bg-slate-800 p-2 rounded mb-3 text-sm border border-slate-600 focus:border-blue-500 outline-none transition-colors">
                    
                    <button onclick="connect()" class="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold transition-all shadow-lg active:scale-95 mb-4">
                        START ENGINE
                    </button>

                    <label class="block text-xs font-bold text-slate-500 mb-2 uppercase mt-2">Zone Management</label>
                    <div class="flex space-x-2 mb-2">
                        <button onclick="undoROI()" class="flex-1 bg-yellow-600 hover:bg-yellow-500 py-2 rounded text-xs font-bold transition-all shadow active:scale-95">UNDO (C)</button>
                        <button onclick="clearROIs()" class="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded text-xs font-bold transition-all shadow active:scale-95">CLEAR ALL (X)</button>
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

            <div class="lg:col-span-3">
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
        }, 1000);

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
    
    os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|timeout;5000000"
    cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Minimize buffer for low latency
    
    if not cap.isOpened():
        error_msg = f"[ERROR] Could not connect to stream: {rtsp_url}"
        print(error_msg)
        with stream_lock:
            stream_connected = False
            stream_error_message = "Failed to open stream"
            consecutive_failed_reads = 0
        return

    # Initialize stream as connected
    with stream_lock:
        stream_connected = True
        stream_last_success_time = time.time()
        consecutive_failed_reads = 0
        stream_error_message = "Stream active"

    frame_skip_counter = 0
    last_inference_time = time.time()
    inference_interval = 0.25  # Run YOLO every 250ms (4 FPS - optimized for CPU)
    
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

        # --- AI INFERENCE (Only every 250ms, not every frame) ---
        floor_detections = []
        if should_infer and AI_AVAILABLE:
            last_inference_time = current_time
            with model_lock:
                results = model(frame, verbose=False, conf=0.5, imgsz=640) 
            
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
                                tracker["label"] = label
                                tracker["start_time"] = current_time
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
                        
                        if elapsed >= INACTIVITY_HIGH_SEC:
                            box_color = (0, 0, 255)       
                            status_text = f"HIGH INACT [{time_str}]"
                            current_frame_alerts.append(f"Zone {i+1}: Inactivity (High) ({time_str})")
                        elif elapsed >= INACTIVITY_MED_SEC:
                            box_color = (0, 165, 255)     
                            status_text = f"MED INACT [{time_str}]"
                        elif elapsed >= INACTIVITY_LOW_SEC:
                            box_color = (0, 255, 255)     
                            status_text = f"LOW INACT [{time_str}]"
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

        # --- UPDATED 10-SECOND HARDWARE TIMER LOGIC ---
        with state_lock:
            active_alerts = current_frame_alerts
            
            # Publish new alerts to backend for logging and Socket.IO
            if len(current_frame_alerts) > 0:
                for alert in current_frame_alerts:
                    publish_alert_to_backend(current_camera_id, alert, frame=frame)
            
            # If there is a new alert and we haven't muted it, push the timer 10 seconds into the future
            if len(active_alerts) > 0 and not hardware_muted:
                hardware_on_until = current_time + 10.0
            
            # If the 10 seconds have safely passed and no alerts remain, reset the mute state
            if current_time >= hardware_on_until and len(active_alerts) == 0:
                hardware_muted = False
            
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
    """Initialize AI detection for a camera (called from backend when camera is added)."""
    global current_rtsp_url, current_camera_id
    
    data = request.json
    camera_id = data.get('camera_id')
    rtsp_url = data.get('rtsp_url')
    
    if not camera_id or not rtsp_url:
        return jsonify({"status": "error", "message": "Missing camera_id or rtsp_url"}), 400
    
    # Store RTSP URL globally
    current_rtsp_url = rtsp_url
    current_camera_id = camera_id
    
    # Reset detection state
    with state_lock:
        global rois, bed_trackers, active_alerts, hardware_muted, hardware_on_until
        rois = []
        bed_trackers.clear()
        active_alerts = []
        hardware_muted = False
        hardware_on_until = 0.0
    
    print(f"[API] ✓ AI service initialized for camera {camera_id}")
    return jsonify({"status": "success", "message": f"Detection ready for camera {camera_id}"}), 200

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
    global current_camera_id
    
    ip = request.args.get('ip')
    pw = request.args.get('pass')
    camera_id = request.args.get('camera_id')  # Get camera_id from request
    
    if not ip or not pw:
        # Check if backend initialized camera
        if current_rtsp_url:
            return Response(generate_frames(current_rtsp_url), mimetype='multipart/x-mixed-replace; boundary=frame')
        return jsonify({"error": "No camera configured"}), 400
    
    # Set current_camera_id for alert tracking
    if camera_id:
        current_camera_id = camera_id
    
    url = f"rtsp://admin:{pw}@{ip}:554/cam/realmonitor?channel=1&subtype=0"
    return Response(generate_frames(url), mimetype='multipart/x-mixed-replace; boundary=frame')

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

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=3000, threaded=True)
