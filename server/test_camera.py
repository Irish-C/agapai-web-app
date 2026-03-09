import cv2
import os
from flask import Flask, Response, request, render_template_string
from ultralytics import YOLO

app = Flask(__name__)

# --- PATH & MODEL SETUP ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "./ml/yolov11_fin.pt")

AI_AVAILABLE = False
try:
    if os.path.exists(MODEL_PATH):
        model = YOLO(MODEL_PATH)
        model.to('cpu')  # Standard laptops use CPU
        AI_AVAILABLE = True
        print("[SUCCESS] YOLOv11 Loaded.")
except Exception as e:
    print(f"[ERROR] {e}")

# --- INTERFACE ---
HTML_PAGE = """
<!DOCTYPE html>
<html>
<head>
    <title>Dahua AI | High Performance</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-white p-10 font-sans">
    <div class="max-w-4xl mx-auto bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
        <h1 class="text-2xl font-bold text-blue-400 mb-4">Fall Detection - Optimized</h1>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="bg-slate-900 p-4 rounded-lg border border-slate-700 h-fit">
                <p class="text-[10px] text-slate-500 uppercase font-bold mb-4">Settings</p>
                <input id="ip" type="text" value="192.168.254.211" class="w-full bg-slate-800 p-2 rounded mb-4 text-sm">
                <button onclick="connect()" class="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold">START STREAM</button>
            </div>
            <div class="md:col-span-3">
                <div class="rounded-xl border-4 border-slate-900 bg-black overflow-hidden">
                    <img id="display" class="w-full h-auto" src="">
                </div>
            </div>
        </div>
    </div>
    <script>
        function connect() {
            const ip = document.getElementById('ip').value;
            document.getElementById('display').src = `/video_feed?ip=${ip}&t=${new Date().getTime()}`;
        }
    </script>
</body>
</html>
"""

def generate_frames(rtsp_url):
    # TCP transport and low buffer for reduced latency
    os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|timeout;5000000"
    cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
    
    # PERFORMANCE TWEAK: Set buffer size small
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    
    frame_count = 0
    last_results = None

    while True:
        success, frame = cap.read()
        if not success:
            break
        
        frame_count += 1
        
        # --- OPTIMIZATION: FRAME SKIPPING ---
        # Only run AI every 3rd frame to save CPU
        if AI_AVAILABLE and frame_count % 3 == 0:
            # Resize frame to 320px width for AI math (way faster)
            # YOLO still works great at lower resolutions
            results = model(frame, verbose=False, conf=0.4, imgsz=320)
            last_results = results[0].plot()
        
        # Display the AI-processed frame if available, otherwise show raw
        display_frame = last_results if last_results is not None else frame

        # --- OPTIMIZATION: ENCODE QUALITY ---
        # Lowering quality to 50% makes the "data trip" to the browser much faster
        _, buffer = cv2.imencode('.jpg', display_frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
    
    cap.release()

@app.route('/')
def index():
    return render_template_string(HTML_PAGE, ai_status=AI_AVAILABLE)

@app.route('/video_feed')
def video_feed():
    ip = request.args.get('ip', '192.168.254.211')
    pw = 'agapai143'
    # subtype=1 is the most important setting for performance!
    url = f"rtsp://admin:{pw}@{ip}:554/cam/realmonitor?channel=1&subtype=1"
    return Response(generate_frames(url), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=3000, threaded=True)