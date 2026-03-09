# camera_worker.py
import cv2
import asyncio
import redis

class CameraWorker:
    def __init__(self, camera_sources):
        # camera_sources: dict {camera_id: source_url}
        self.camera_sources = camera_sources
        self.redis = redis.Redis(host='localhost', port=6379, db=0)
        self.cap = None
        self.frame = None
        self.active_camera_id = None

    async def start(self):
        while True:
            # Check for active camera selection
            active_id = self.redis.get('active_camera_id')
            if active_id:
                active_id = active_id.decode()
            if active_id != self.active_camera_id:
                # Switch camera stream
                self.active_camera_id = active_id
                if self.cap:
                    self.cap.release()
                source = self.camera_sources.get(self.active_camera_id)
                if source:
                    self.cap = cv2.VideoCapture(source)
                else:
                    self.cap = None
            if self.cap:
                success, frame = self.cap.read()
                if not success:
                    await asyncio.sleep(0.1)
                    continue
                self.frame = frame
                # Example detection trigger
                if self.detect_incident(frame):
                    await self.send_alert()
                # Save latest processed frame to Redis
                _, buffer = cv2.imencode('.jpg', self.frame)
                self.redis.set('latest_frame', buffer.tobytes())
            await asyncio.sleep(0.03)  # ~30 FPS

    def detect_incident(self, frame):
        # Replace with YOLO / AI model
        return False

    async def send_alert(self):
        from app import socketio_server
        await socketio_server.emit(
            "incident_alert",
            {"camera_id": self.camera_id, "type": "motion"}
        )