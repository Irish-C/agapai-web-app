# camera_worker.py
import cv2
import asyncio

class CameraWorker:
    def __init__(self, camera_id, source):
        self.camera_id = camera_id
        self.source = source
        self.cap = cv2.VideoCapture(source)
        self.frame = None

    async def start(self):
        while True:
            success, frame = self.cap.read()
            if not success:
                await asyncio.sleep(0.1)
                continue

            self.frame = frame

            # Example detection trigger
            if self.detect_incident(frame):
                await self.send_alert()

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