import os
import time
import cv2
import asyncio
import base64
import redis
import json
from ultralytics import YOLO
from database import db

# One-time diagnostic log tracker for camera_frame emits
FIRST_EMIT_LOGGED: set = set()

# --- STREAMING & BACKGROUND TASKS ---

async def start_camera_processing():
    """
    Initial startup task. 
    Starts individual stream loops for every camera marked as active.
    """
    await asyncio.sleep(2)  # Brief delay for DB and Socket server
    try:
        active_cameras = await db.camera.find_many(where={'cam_status': True})
        
        # Build a dictionary for the CameraWorker
        # Format: {"1": "rtsp://...", "2": "rtsp://..."}
        camera_sources = {str(cam.id): cam.stream_url for cam in active_cameras}
        
        # 1. Start the general background loops for all active cameras
        for cam in active_cameras:
            print(f"Starting background stream for: {cam.cam_name}")
            asyncio.create_task(stream_camera_loop(cam.id, cam.stream_url))
        
        # 2. Start the specialized CameraWorker (for AI/Redis processing)
        worker = CameraWorker(camera_sources)
        asyncio.create_task(worker.start())

    except Exception as e:
        print(f"Error starting camera streams: {e}")

async def stream_camera_loop(camera_id, rtsp_url):
    """
    Main loop for single camera broadcast to frontend.
    """
    if not rtsp_url or not str(rtsp_url).strip():
        print(f"Skipping camera {camera_id}: No URL provided.")
        return

    cap = cv2.VideoCapture(rtsp_url)
    
    try:
        while True:
            if not cap.isOpened():
                print(f"Stream failed for {camera_id}. Retrying in 5s...")
                await asyncio.sleep(5)
                cap = cv2.VideoCapture(rtsp_url)
                continue

            ret, frame = cap.read()
            if not ret:
                await asyncio.sleep(1)
                continue

            # Encode to base64
            _, buffer = cv2.imencode('.jpg', frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')

            from app import socketio_server
            payload = {
                'cam_id': str(camera_id),
                'frame': frame_base64
            }

            try:
                rooms = getattr(socketio_server.manager, 'rooms', None)
                if isinstance(rooms, dict):
                    ns_rooms = rooms.get('/', {})
                    members = ns_rooms.get(f'camera_{camera_id}')
                    has_listeners = bool(members)
                else:
                    has_listeners = True
            except Exception:
                has_listeners = True

            if has_listeners:
                key = f"cam:{camera_id}"
                if key not in FIRST_EMIT_LOGGED:
                    print(f"[camera_worker] Emitting first camera_frame for {camera_id}")
                    FIRST_EMIT_LOGGED.add(key)
                await socketio_server.emit('camera_frame', payload, room=f'camera_{camera_id}')

            await asyncio.sleep(0.04)  # ~25 FPS
    except asyncio.CancelledError:
        pass
    finally:
        cap.release()

# --- THE ROBUST CAMERA WORKER ---

class CameraWorker:
    def __init__(self, camera_sources):
        self.camera_sources = camera_sources
        self.redis = redis.Redis(host='localhost', port=6379, db=0)
        self.cap = None
        self.frame = None
        self.active_camera_id = None

        # YOLO model (optional)
        self.yolo = None
        self.yolo_enabled = False
        self._yolo_frame_counter = 0
        self._yolo_skip = 5  # run inference every N frames
        self._yolo_last_alert = 0.0
        self._yolo_alert_cooldown = 2.0  # seconds between alerts

        model_path = os.path.join(os.path.dirname(__file__), 'ml', 'yolov11_fin.pt')
        if os.path.exists(model_path):
            try:
                self.yolo = YOLO(model_path)
                self.yolo.to('cpu')
                self.yolo_enabled = True
                print(f"[CameraWorker] Loaded YOLO model: {model_path}")
            except Exception as e:
                print(f"[CameraWorker] Failed to load YOLO model: {e}")
        else:
            print(f"[CameraWorker] YOLO model not found at: {model_path}")

    async def start(self):
        print("CameraWorker: Background AI worker started.")
        while True:
            try:
                # Check Redis for active selection
                active_id_raw = self.redis.get('active_camera_id')
                active_id = active_id_raw.decode() if active_id_raw else None

                # If the selection changed
                if active_id != self.active_camera_id:
                    self.active_camera_id = active_id
                    if self.cap:
                        self.cap.release()
                        self.cap = None
                    
                    source = self.camera_sources.get(self.active_camera_id)
                    
                    # GUARD: Prevent "Connection Refused" to localhost:554
                    if source and str(source).strip():
                        print(f"CameraWorker switching to: {source}")
                        self.cap = cv2.VideoCapture(source)
                    else:
                        print(f"CameraWorker: No source for ID {active_id}")

                # If we have an active capture
                if self.cap and self.cap.isOpened():
                    success, frame = self.cap.read()
                    if success:
                        self.frame = frame
                        
                        # AI Detection Trigger
                        if self.detect_incident(frame):
                            await self.send_alert()

                        # Save latest frame to Redis
                        _, buffer = cv2.imencode('.jpg', self.frame)
                        self.redis.set(f"latest_frame_{self.active_camera_id}", buffer.tobytes())
                    else:
                        await asyncio.sleep(0.5)

            except redis.exceptions.ConnectionError:
                if not getattr(self, '_redis_warned', False):
                    print("CameraWorker Error: Cannot connect to Redis (localhost:6379)")
                    self._redis_warned = True
            except Exception as e:
                print(f"CameraWorker Loop Error: {e}")

            await asyncio.sleep(0.03)  # ~30 FPS

    def detect_incident(self, frame):
        """Detect an incident (motion/object) using YOLO.

        Returns True when a detection is present and cooldown has expired.
        """
        if not self.yolo_enabled or self.yolo is None:
            return False

        self._yolo_frame_counter += 1
        if self._yolo_frame_counter % self._yolo_skip != 0:
            return False

        now = time.time()
        if now - self._yolo_last_alert < self._yolo_alert_cooldown:
            return False

        try:
            # Run inference at a smaller resolution for performance.
            results = self.yolo(frame, conf=0.35, imgsz=640, verbose=False)
            if len(results) == 0:
                return False
            r = results[0]
            # Trigger on any detection; adjust by class if needed.
            if r.boxes and len(r.boxes) > 0:
                self._yolo_last_alert = now
                return True
        except Exception as e:
            print(f"[CameraWorker] YOLO inference error: {e}")

        return False

    async def send_alert(self):
        from app import socketio_server, connected_sids
        if connected_sids:
            await socketio_server.emit("incident_alert", {
                "camera_id": str(self.active_camera_id), 
                "type": "motion"
            })

# --- CRUD LOGIC ---

async def get_cameras_logic():
    cameras = await db.camera.find_many(include={"location": True})
    return [{
        "id": str(cam.id),
        "name": cam.cam_name,
        "status": cam.cam_status,
        "stream_url": cam.stream_url,
        "location_name": cam.location.loc_name if cam.location else None
    } for cam in cameras], 200

async def get_camera_logic(camera_id):
    camera = await db.camera.find_unique(where={"id": int(camera_id)}, include={"location": True})
    if not camera: return {"error": "Camera not found"}, 404
    return {
        "id": str(camera.id),
        "name": camera.cam_name,
        "location_name": camera.location.loc_name if camera.location else None
    }, 200

async def create_camera_logic(camera_data):
    try:
        new_camera = await db.camera.create(data={
            "cam_name": camera_data.get("cam_name"),
            "loc_id": int(camera_data.get("loc_id")),
            "stream_url": camera_data.get("stream_url"),
            "cam_status": True
        })
        return {"status": "success", "camera_id": str(new_camera.id)}, 201
    except Exception as e:
        return {"error": str(e)}, 500

async def update_camera_logic(camera_id, camera_data):
    try:
        updated_camera = await db.camera.update(
            where={"id": int(camera_id)},
            data={
                "cam_name": camera_data.get("cam_name"),
                "loc_id": int(camera_data.get("loc_id")),
                "stream_url": camera_data.get("stream_url")
            }
        )
        return {"status": "success", "camera_id": str(updated_camera.id)}, 200
    except Exception as e:
        return {"error": str(e)}, 500

async def delete_camera_logic(camera_id):
    try:
        await db.camera.delete(where={"id": int(camera_id)})
        return {"status": "success", "message": "Camera deleted"}, 200
    except Exception as e:
        return {"error": str(e)}, 500