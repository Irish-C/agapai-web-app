from ultralytics import YOLO
import cv2
import numpy as np
from datetime import datetime
import time
from picamera2 import Picamera2
from flask import Flask, Response, request, send_file, jsonify
import threading
from collections import Counter
import os
import requests

# --- CONFIGURATION ---
import os
import sys

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Point to the models folder inside the same directory
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'yolov11_fin.pt')
BACKEND_URL = "http://localhost:5000/api/trigger_alert"
SKIP_FRAMES = 3 
SITTING_ALERT_THRESHOLD_SECONDS = 10 
HOST_PORT = 4050
LOG_INTERVAL = 1.0 
LOG_DIR = "daily_logs" 

# --- BACKEND CONNECTION CONFIG ---
# This is where we send the alert data (Node/Express or other Python backend)
BACKEND_URL = "http://localhost:5000/api/trigger_alert"
ALERT_COOLDOWN = 5.0  # Seconds to wait before sending another alert for the same fall

# Global variables
output_frame = None
lock = threading.Lock()
last_alert_sent_time = 0

# Initialize Flask App
app = Flask(__name__)

# Colors and Fonts
COLOR_MAP = {
    'standing': (0, 255, 255), 
    'walking': (0, 255, 255),
    'sitting': (0, 255, 0),       
    'eating': (0, 255, 255),
    'forward fall': (0, 0, 255),   
    'sideward fall': (0, 165, 255), 
    'backward fall': (255, 0, 0)
}
FONT = cv2.FONT_HERSHEY_SIMPLEX
METRIC_TEXT_COLOR = (255, 255, 255) 
FALL_ALERT_COLOR = (0, 0, 255) 

# --- LOGGING HELPER FUNCTION ---
def write_log(message):
    """Writes a message to a daily log file."""
    try:
        if not os.path.exists(LOG_DIR):
            os.makedirs(LOG_DIR)
        date_str = datetime.now().strftime("%Y-%m-%d")
        filename = os.path.join(LOG_DIR, f"log_{date_str}.txt")
        with open(filename, "a") as f:
            f.write(message + "\n")
    except Exception as e:
        print(f"Error writing to log: {e}")

# --- TRIGGER FUNCTION ---
def send_alert_to_backend(fall_type, track_id):
    """Sends a signal to the Main Web App to turn on Hardware Alarm."""
    global last_alert_sent_time
    
    # Check cooldown (don't spam server if it's been less than 5 seconds)
    if (time.time() - last_alert_sent_time) < ALERT_COOLDOWN:
        return

    try:
        print(f" -> 📡 Sending Signal to Backend for {fall_type}...")
        
        # NOTE: We no longer trigger hardware here. We strictly act as a sensor.
        # The Main App (localhost:5000) will receive this and turn on the Siren/Strobe.

        # Notify Backend
        payload = {
            "location": "Camera 1 (Pi)", 
            "fall_type": fall_type,
            "track_id": int(track_id)
        }
        # Send POST request (Fire and forget, short timeout)
        requests.post(BACKEND_URL, json=payload, timeout=0.5)
        
        last_alert_sent_time = time.time()
        print(" -> ✅ Signal Sent Successfully!")
        
    except Exception as e:
        print(f" -> ❌ FAILED to contact Backend: {e}")

# --- BACKGROUND THREAD: CAMERA & YOLO ---
def run_tracking():
    global output_frame, lock
    
    print(f"Loading model from {MODEL_PATH}...")
    model = YOLO(MODEL_PATH)
    
    # State Management
    sitting_start_times = {} 
    last_boxes = []
    last_track_ids = []
    last_clss = []
    last_confs = []
    frame_count = 0
    
    # Timers
    prev_frame_time = time.time()
    last_log_time = time.time()

    # Camera Setup
    print("Initializing Pi Camera 3...")
    try:
        picam2 = Picamera2()
        config = picam2.create_preview_configuration(main={"size": (640, 480)})
        picam2.configure(config)
        picam2.set_controls({"AfMode": 2}) 
        picam2.start()
    except Exception as e:
        print(f"Camera Error: {e}")
        return

    print("Camera started. AI processing running in background...")
    print("---------------------------------------------------")
    print(f"LOGS STARTED. Updates every {LOG_INTERVAL}s.")
    print("---------------------------------------------------")

    while True:
        # 1. Capture
        frame = picam2.capture_array()
        im0 = cv2.cvtColor(frame, cv2.COLOR_RGBA2BGR)
        
        # 2. Frame Skipping Logic (AI Detection)
        if frame_count % SKIP_FRAMES == 0:
            results = model.track(im0, persist=True, conf=0.55, iou=0.5, imgsz=320, verbose=False)
            
            last_boxes = []
            last_track_ids = []
            last_clss = []
            last_confs = []
            
            if results and results[0].boxes.id is not None:
                last_boxes = results[0].boxes.xyxy.cpu().numpy().astype(int)
                last_track_ids = results[0].boxes.id.cpu().numpy().astype(int)
                last_clss = results[0].boxes.cls.cpu().numpy().astype(int)
                last_confs = results[0].boxes.conf.cpu().numpy()

            # --- REAL-TIME TERMINAL & FILE LOGGING ---
            current_time = time.time()
            timestamp = datetime.now().strftime("%H:%M:%S")

            if (current_time - last_log_time) > LOG_INTERVAL:
                if len(last_clss) > 0:
                    detected_names = [model.names[cls] for cls in last_clss]
                    counts = Counter(detected_names)
                    summary = ", ".join([f"{k}: {v}" for k, v in counts.items()])
                    
                    log_msg = f"[{timestamp}] STATUS: {summary}"
                    print(log_msg)
                    write_log(log_msg)
                last_log_time = current_time

        frame_count += 1
        
        # 3. Draw & Logic
        current_class_counts = {}
        
        if len(last_boxes) > 0:
            for box, track_id, cls, conf in zip(last_boxes, last_track_ids, last_clss, last_confs):
                class_name = model.names[cls]
                x1, y1, x2, y2 = box
                
                current_class_counts[class_name] = current_class_counts.get(class_name, 0) + 1
                
                # --- B. IMMEDIATE LOGGING & ALARM TRIGGER (Falls) ---
                if 'fall' in class_name.lower():
                     timestamp = datetime.now().strftime("%H:%M:%S")
                     alert_msg = f"[{timestamp}] ⚠️  CRITICAL ALERT: {class_name.upper()} DETECTED! (ID: {track_id})"
                     print(alert_msg)
                     write_log(alert_msg) 

                     # <--- SEND SIGNAL TO MAIN BACKEND --->
                     send_alert_to_backend(class_name, track_id)

                # --- TIMER LOGIC (Sitting) ---
                timer_str = ""
                timer_color = METRIC_TEXT_COLOR
                
                if class_name.lower() == 'sitting':
                    if track_id not in sitting_start_times:
                        sitting_start_times[track_id] = time.time()
                    
                    elapsed = time.time() - sitting_start_times[track_id]
                    mins = int(elapsed // 60)
                    secs = int(elapsed % 60)
                    timer_str = f"Time: {mins:02}:{secs:02}"
                    
                    # Alert Threshold
                    if elapsed > SITTING_ALERT_THRESHOLD_SECONDS:
                        timer_color = FALL_ALERT_COLOR
                        if SITTING_ALERT_THRESHOLD_SECONDS < elapsed < (SITTING_ALERT_THRESHOLD_SECONDS + 0.5):
                            timestamp = datetime.now().strftime("%H:%M:%S")
                            alert_msg = f"[{timestamp}] ⚠️  ALERT: Person (ID {track_id}) has been sitting for {SITTING_ALERT_THRESHOLD_SECONDS}s"
                            print(alert_msg)
                            write_log(alert_msg)

                else:
                    if track_id in sitting_start_times:
                        del sitting_start_times[track_id]

                # Draw Visuals
                color = COLOR_MAP.get(class_name.lower(), (255, 255, 255))
                cv2.rectangle(im0, (x1, y1), (x2, y2), color, 2)
                
                label = f"{class_name} {conf:.2f}"
                (w, h), _ = cv2.getTextSize(label, FONT, 0.5, 1)
                cv2.rectangle(im0, (x1, y1 - h - 5), (x1 + w, y1), color, -1)
                cv2.putText(im0, label, (x1, y1 - 5), FONT, 0.5, (0,0,0), 1)
                
                if timer_str:
                    (tw, th), _ = cv2.getTextSize(timer_str, FONT, 0.6, 2)
                    cv2.rectangle(im0, (x1, y2 + 5), (x1 + tw + 10, y2 + 25), color, -1)
                    cv2.putText(im0, timer_str, (x1 + 5, y2 + 20), FONT, 0.6, timer_color, 2)

        # 4. Dashboard (FPS)
        curr_time = time.time()
        sys_fps = 0
        if (curr_time - prev_frame_time) > 0:
            sys_fps = 1 / (curr_time - prev_frame_time)
        prev_frame_time = curr_time
        
        cv2.rectangle(im0, (0, 0), (200, 100 + (len(current_class_counts)*25)), (0,0,0), -1)
        cv2.putText(im0, f"FPS: {sys_fps:.1f}", (10, 20), FONT, 0.6, (0, 255, 0), 2)
        cv2.putText(im0, datetime.now().strftime("%H:%M:%S"), (10, 45), FONT, 0.6, (255, 255, 255), 1)
        
        y_off = 70
        for cname, count in current_class_counts.items():
            cv2.putText(im0, f"{cname}: {count}", (10, y_off), FONT, 0.6, (255, 255, 255), 1)
            y_off += 25

        # 5. Update Global Frame
        with lock:
            output_frame = im0.copy()

# --- WEB SERVER ROUTES ---
def generate():
    global output_frame, lock
    while True:
        with lock:
            if output_frame is None:
                continue
            (flag, encodedImage) = cv2.imencode(".jpg", output_frame)
            if not flag:
                continue
        yield(b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + 
              bytearray(encodedImage) + b'\r\n')

@app.route("/video_feed")
def video_feed():
    return Response(generate(), mimetype = "multipart/x-mixed-replace; boundary=frame")

@app.route("/download_log")
def download_log():
    date_param = request.args.get('date') 
    if not date_param:
        return "Error: Date parameter required", 400
    filename = f"log_{date_param}.txt"
    filepath = os.path.join(LOG_DIR, filename)
    if os.path.exists(filepath):
        return send_file(filepath, as_attachment=True)
    else:
        return f"No logs found for date: {date_param}", 404

@app.route("/")
def index():
    return "<h1>AGAPAI Camera Sensor Active</h1><p>Status: Monitoring...</p>"

if __name__ == '__main__':
    # Start Tracking in Background Thread
    t = threading.Thread(target=run_tracking)
    t.daemon = True
    t.start()
    
    print(f"Starting AGAPAI Camera Sensor on port {HOST_PORT}...")
    # Run Flask
    app.run(host='0.0.0.0', port=HOST_PORT, debug=False, threaded=True)