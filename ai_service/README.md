# AI Detection Service (Port 3000)

Standalone Flask-based AI detection service that processes RTSP camera feeds and detects fall events and inactivity patterns.

## Setup

### Install Dependencies
```bash
cd ai_service
pip install -r requirements.txt
```

### Configuration

Create a `.env` file in the `ai_service/` directory (optional):
```
ESP32_PORT=COM3           # Serial port for ESP32 (Windows: COM3, Linux: /dev/ttyUSB0)
MODEL_PATH=best_openvino_model  # Path to YOLO model
BACKEND_URL=http://localhost:5000  # Main backend URL
AI_SERVICE_PORT=3001      # Port this service runs on
AI_SERVICE_HOST=0.0.0.0   # Bind address
```

## CSS & Frontend Assets

### Offline Tailwind CSS

The web interface uses a locally-built Tailwind CSS file (no CDN required):

**Generate/Update CSS:**
```bash
npm run build:ai-css
```

**Watch for Changes (Development):**
```bash
npm run build:ai-css:watch
```

This scans `ai_service/app.py` for Tailwind classes and builds `ai_service/static/tailwind.css`.

**Files:**
- `tailwind.ai-service.config.js` — Tailwind configuration
- `ai_service/styles.css` — Tailwind input file
- `ai_service/static/tailwind.css` — Generated CSS (not committed, ~90KB)

The app works completely offline after the CSS is built.

## Running the Service

### Standalone Mode
```bash
python app.py
```

The service will be available at `http://localhost:3000`

### With Backend Integration
The main backend (server) automatically manages the lifecycle of this service via `AIServiceManager`.

When a user publishes a camera in the dashboard:
1. Backend starts the AI service (if not running)
2. Backend sends RTSP URL to `/api/start`
3. Service processes video stream and detects events
4. Service sends alerts back to backend at `/api/ai/alerts`
5. Backend broadcasts alerts to frontend via Socket.IO

When a camera is unpublished:
1. Backend sends request to `/api/stop`
2. Service stops processing and cleans up

## API Endpoints

### Start Detection
```bash
POST http://localhost:3000/api/start
Content-Type: application/json

{
  "camera_id": 1,
  "rtsp_url": "rtsp://admin:password@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0"
}
```

### Stop Detection
```bash
POST http://localhost:3000/api/stop
Content-Type: application/json

{
  "camera_id": 1
}
```

### Get Live Stream
```
GET http://localhost:3000/api/video_feed?camera_id=1
```
Returns MJPEG video stream with annotated detections.

### Get Current Alerts
```bash
GET http://localhost:3000/api/alerts
```

### Acknowledge Alerts
```bash
POST http://localhost:3000/api/ack
```

## Detection Features

- **Fall Detection**: Identifies fall events on the floor
- **Inactivity Detection**: 
  - LOW: > 5 minutes
  - MEDIUM: > 15 minutes
  - HIGH: > 30 minutes (critical)
- **Zone-Based Monitoring**: Define up to 30 detection zones
- **Hardware Integration**: Controls ESP32-based alarm system

## Troubleshooting

**Model Not Loading**
- Ensure model files exist at `MODEL_PATH`
- Check for CUDA/GPU availability
- Verify torch/torchvision installation

**Cannot Connect to RTSP**
- Verify camera IP, port, username, password
- Check network connectivity
- Try with ffmpeg directly: `ffplay "rtsp://..."`

**Hardware Not Responding**
- Check ESP32 serial port (Windows: Device Manager, Linux: `dmesg`)
- Verify baud rate matches (115200)
- Test serial connection with minicom/Putty
