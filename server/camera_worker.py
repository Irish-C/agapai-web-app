import os
import time
import cv2
import asyncio
import json
from database import db
from src.utils.redis_pool import RedisConnectionPool
# Import publish helper to register camera paths with MediaMTX
from src.controllers.camera_controller import publish_camera_to_mediamtx

# Lazy YOLO importer to avoid importing ultralytics when using OpenVINO-only deployments
def _get_YOLO_class():
    try:
        import importlib
        mod = importlib.import_module('ultralytics')
        return getattr(mod, 'YOLO', None)
    except Exception:
        return None
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
        
        # 1. Start the general background loops for all active cameras
        for cam in active_cameras:
            print(f"Starting background stream for: {cam.cam_name}")
            # Fire-and-forget publish to MediaMTX so startup doesn't block.
            async def _publish_async(cid):
                try:
                    resp, status = await publish_camera_to_mediamtx(cid)
                    if status == 200 and isinstance(resp, dict) and resp.get('status') == 'ok':
                        print(f"[start_camera_processing] Published camera {cid} to MediaMTX: {resp.get('path')}")
                    else:
                        print(f"[start_camera_processing] Warning: publish for camera {cid} returned {status} {resp}")
                except Exception as e:
                    print(f"[start_camera_processing] Failed to publish camera {cid} to MediaMTX: {e}")

            asyncio.create_task(_publish_async(cam.id))
            asyncio.create_task(stream_camera_loop(cam.id, cam.stream_url))
        
        # 2. Start the specialized CameraWorker (for AI/Redis processing)
        # Note: CameraWorker now fetches URLs dynamically from DB, no caching
        worker = CameraWorker()
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

    # Prefer MediaMTX proxy path when available to avoid pulling the same
    # camera stream multiple times (centralize pulls through MediaMTX).
    redis = RedisConnectionPool.get()

    def _build_mediamtx_rtsp(cam_id: int) -> str:
        mtx = os.getenv('MEDIAMTX_URL') or os.getenv('MTX_URL')
        if not mtx:
            return ''
        return f"{mtx.rstrip('/')}/cam{cam_id}"

    # Try MediaMTX first (if configured), then fall back to the original RTSP URL
    candidates = []
    try:
        mtx_rtsp = _build_mediamtx_rtsp(camera_id)
        if mtx_rtsp:
            candidates.append(mtx_rtsp)
    except Exception:
        mtx_rtsp = ''
    candidates.append(rtsp_url)

    cap = None
    for url in candidates:
        try:
            # Use FFMPEG backend when available for robust RTSP handling
            cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
            try:
                cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            except Exception:
                pass
            if cap is not None and cap.isOpened():
                if url != rtsp_url:
                    print(f"[stream_camera_loop] Camera {camera_id}: using MediaMTX URL {url}")
                break
            else:
                # release and try next
                try:
                    cap.release()
                except Exception:
                    pass
                cap = None
        except Exception:
            cap = None

    if cap is None:
        # Last resort: attempt to open the raw URL without FFMPEG flag
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
                # Shorter retry delay to avoid large 1s stalls; align with target FPS
                await asyncio.sleep(0.04)
                continue

            # Encode to JPEG at reduced quality and write to Redis for MJPEG consumers.
            try:
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
                if buffer is not None:
                    redis.set(f"latest_frame_raw_{camera_id}", buffer.tobytes())
            except Exception as e:
                print(f"[stream_camera_loop-{camera_id}] JPEG encode/Redis write error: {e}")


            await asyncio.sleep(0.04)  # ~25 FPS
    except asyncio.CancelledError:
        pass
    finally:
        cap.release()

# --- THE ROBUST CAMERA WORKER ---

class CameraWorker:
    def __init__(self):
        self.redis = RedisConnectionPool.get()
        self.cap = None
        self.frame = None
        self.active_camera_id = None

        # YOLO model (optional)
        self.yolo = None
        self.yolo_enabled = False
        self._yolo_frame_counter = 0
        self._yolo_skip = 10  # run inference every N frames (increased to reduce CPU load)
        self._yolo_last_alert = 0.0
        self._yolo_alert_cooldown = 2.0  # seconds between alerts
        self.cached_annotated_frame = None  # Cache annotated frame for smooth rendering

        model_path = os.path.join(os.path.dirname(__file__), 'ml', 'yolov11_fin.pt')
        if os.path.exists(model_path):
            try:
                YOLO = _get_YOLO_class()
                if YOLO is not None:
                    self.yolo = YOLO(model_path)
                    try:
                        self.yolo.to('cpu')
                    except Exception:
                        # Some model backends may not support .to(); ignore if it fails
                        pass
                    self.yolo_enabled = True
                    print(f"[CameraWorker] Loaded ultralytics YOLO model: {model_path}")
                else:
                    print(f"[CameraWorker] ultralytics not available; skipping YOLO load for: {model_path}")
            except Exception as e:
                print(f"[CameraWorker] Failed to load YOLO model: {e}")
        else:
            print(f"[CameraWorker] YOLO model not found at: {model_path}")

    async def get_camera_url(self, camera_id):
        """Fetch camera URL from database dynamically (no caching)."""
        try:
            camera = await db.camera.find_unique(where={"id": int(camera_id)})
            if camera and camera.stream_url:
                return camera.stream_url
            else:
                print(f"[CameraWorker] Camera {camera_id} not found or has no URL")
                return None
        except Exception as e:
            print(f"[CameraWorker] Error fetching URL for camera {camera_id}: {e}")
            return None

    async def start(self):
        """Start independent processing tasks for each published camera."""
        print("CameraWorker: Background AI worker started.")
        
        # Monitor published cameras and spawn tasks for each
        active_tasks = {}
        last_published_check = 0
        
        while True:
            try:
                now = time.time()
                
                # Check Redis for published cameras (every 5 seconds)
                if now - last_published_check > 5:
                    last_published_check = now
                    published = self.redis.smembers('published_cameras')
                    published_ids = {cid.decode() if isinstance(cid, bytes) else cid for cid in published}
                    
                    # Remove tasks for unpublished cameras
                    for camera_id in list(active_tasks.keys()):
                        if camera_id not in published_ids:
                            print(f"[CameraWorker] Stopping camera {camera_id}")
                            active_tasks[camera_id].cancel()
                            del active_tasks[camera_id]
                    
                    # Start tasks for newly published cameras
                    for camera_id in published_ids:
                        if camera_id not in active_tasks:
                            # Fetch URL dynamically from database (not cached)
                            source = await self.get_camera_url(camera_id)
                            if source and str(source).strip():
                                print(f"[CameraWorker] Starting task for camera {camera_id}")
                                task = asyncio.create_task(self._process_camera(camera_id, source))
                                active_tasks[camera_id] = task
                
                await asyncio.sleep(0.5)  # Check every 500ms
                
            except Exception as e:
                print(f"CameraWorker supervisor error: {e}")
                await asyncio.sleep(1)

    async def _process_camera(self, camera_id, rtsp_url):
        """Process a single camera independently with dynamic frame pacing and watchdog timeout."""
        cap = None
        yolo_frame_counter = 0
        cached_annotated = None
        target_fps = 30  # Target 30 FPS = ~33ms per frame
        target_frame_time = 1.0 / target_fps
        last_frame_time = time.time()  # Track last successful frame
        frame_read_timeout = 5.0  # Timeout for cap.read() to fail (seconds)
        watchdog_timeout = 5.0  # Force reconnect if no frames for N seconds
        
        try:
            print(f"[CameraWorker-{camera_id}] Connecting to {rtsp_url[:50]}...")
            cap = cv2.VideoCapture(rtsp_url)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Minimal buffering
            
            frame_count = 0
            while True:
                frame_start = time.time()  # Track when frame processing begins
                
                if not cap or not cap.isOpened():
                    print(f"[CameraWorker-{camera_id}] Stream disconnected, reconnecting...")
                    await asyncio.sleep(2)
                    cap = cv2.VideoCapture(rtsp_url)
                    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                    last_frame_time = time.time()  # Reset watchdog on reconnect
                    continue
                
                # Watchdog: Force reconnect if no frames for watchdog_timeout seconds
                time_since_last_frame = time.time() - last_frame_time
                if time_since_last_frame > watchdog_timeout:
                    print(f"[CameraWorker-{camera_id}] ⏱️ Watchdog timeout: No frames for {time_since_last_frame:.1f}s, forcing reconnect...")
                    cap.release()
                    await asyncio.sleep(2)
                    cap = cv2.VideoCapture(rtsp_url)
                    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                    last_frame_time = time.time()
                    continue
                
                # Non-blocking read with timeout (run in thread pool to avoid blocking event loop)
                try:
                    success, frame = await asyncio.wait_for(
                        asyncio.to_thread(cap.read),
                        timeout=frame_read_timeout
                    )
                except asyncio.TimeoutError:
                    print(f"[CameraWorker-{camera_id}] ⏱️ Read timeout ({frame_read_timeout}s), reconnecting...")
                    cap.release()
                    await asyncio.sleep(2)
                    cap = cv2.VideoCapture(rtsp_url)
                    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                    last_frame_time = time.time()
                    continue
                
                if not success or frame is None:
                    await asyncio.sleep(0.1)
                    continue
                
                # Frame received successfully - update watchdog
                last_frame_time = time.time()
                frame_count += 1
                yolo_frame_counter += 1
                
                # Run YOLO only every 5 frames
                if yolo_frame_counter % 5 == 0 and self.yolo_enabled:
                    try:
                        results = self.yolo(frame, conf=0.35, imgsz=640, verbose=False)
                        if len(results) > 0:
                            r = results[0]
                            if r.boxes and len(r.boxes) > 0:
                                # Commented out: r.plot() would draw annotations here.
                                # Annotation rendering is handled by the central inference worker
                                # to avoid duplicate rendering and excessive CPU usage.
                                # cached_annotated = r.plot()
                                cached_annotated = None
                                print(f"[CameraWorker-{camera_id}] 🎯 Detection: {len(r.boxes)} object(s)")
                            else:
                                cached_annotated = None
                    except Exception as e:
                        print(f"[CameraWorker-{camera_id}] YOLO error: {e}")
                
                # Use annotated frame if available
                output_frame = cached_annotated if cached_annotated is not None else frame

                # Write latest annotated/raw frame into Redis as JPEG (low quality to save CPU/bandwidth)
                try:
                    # Lower JPEG quality for high-resolution streams
                    _, buffer = cv2.imencode('.jpg', output_frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
                    if buffer is not None:
                        # store as bytes so the /video_feed endpoint and MJPEG consumer can read it
                        self.redis.set(f"latest_frame_{camera_id}", buffer.tobytes())
                        # Log first emit per camera once for diagnostics
                        if camera_id not in FIRST_EMIT_LOGGED:
                            print(f"[CameraWorker-{camera_id}] Wrote first frame to Redis (latest_frame_{camera_id})")
                            FIRST_EMIT_LOGGED.add(camera_id)
                except Exception as e:
                    print(f"[CameraWorker-{camera_id}] Frame save error: {e}")
                
                # Dynamic sleep: adjust based on actual processing time
                elapsed = time.time() - frame_start
                sleep_time = max(0, target_frame_time - elapsed)
                await asyncio.sleep(sleep_time)
                
        except asyncio.CancelledError:
            print(f"[CameraWorker-{camera_id}] Task cancelled")
        except Exception as e:
            print(f"[CameraWorker-{camera_id}] Unexpected error: {e}")
        finally:
            if cap:
                cap.release()
            print(f"[CameraWorker-{camera_id}] Terminated")

    def detect_incident(self, frame):
        """Detect incidents using YOLO with frame caching.
        
        Runs inference every 5 frames but renders boxes on every frame
        using cached annotated frame for smooth, continuous playback.
        
        Returns annotated frame (with YOLO boxes) and detection flag.
        """
        detected = False
        
        if not self.yolo_enabled or self.yolo is None:
            if self._yolo_frame_counter % 150 == 0:  # Log every 5 seconds at 30 FPS
                print(f"[CameraWorker] YOLO disabled for camera {self.active_camera_id}")
            return self.cached_annotated_frame if self.cached_annotated_frame is not None else frame, False

        self._yolo_frame_counter += 1
        
        # Log every 150 frames (~5 seconds) to show we're processing
        if self._yolo_frame_counter % 150 == 0:
            print(f"[CameraWorker] Frame #{self._yolo_frame_counter}, Camera: {self.active_camera_id}, Skip: {self._yolo_frame_counter % self._yolo_skip}, Cooldown left: {self._yolo_alert_cooldown - (time.time() - self._yolo_last_alert):.1f}s")
        
        # Run YOLO inference only every N frames for efficiency
        will_run_inference = (self._yolo_frame_counter % self._yolo_skip == 0)
        
        if will_run_inference:
            now = time.time()
            cooldown_remaining = self._yolo_alert_cooldown - (now - self._yolo_last_alert)
            
            # Only run inference if alert cooldown has passed
            if cooldown_remaining <= 0:
                try:
                    print(f"[CameraWorker] Running YOLO inference on frame #{self._yolo_frame_counter} for camera {self.active_camera_id}")
                    # Run inference at 640px for good quality
                    results = self.yolo(frame, conf=0.35, imgsz=640, verbose=False)
                    
                    if len(results) > 0:
                        r = results[0]
                        
                        # Check for detections and cache the annotated frame
                        if r.boxes and len(r.boxes) > 0:
                            # Commented out: use central inference worker for drawing.
                            # self.cached_annotated_frame = results[0].plot()
                            self.cached_annotated_frame = None
                            self._yolo_last_alert = now
                            detected = True
                            print(f"[CameraWorker] 🎯 Detection on camera {self.active_camera_id}: {len(r.boxes)} object(s)")
                        else:
                            if self._yolo_frame_counter % 150 == 0:
                                print(f"[CameraWorker] No objects detected on frame #{self._yolo_frame_counter}")
                            self.cached_annotated_frame = None
                    else:
                        print(f"[CameraWorker] Empty results from YOLO")
                        self.cached_annotated_frame = None
                except Exception as e:
                    print(f"[CameraWorker] YOLO inference error: {e}")
                    import traceback
                    traceback.print_exc()
                    self.cached_annotated_frame = None
            else:
                if self._yolo_frame_counter % 150 == 0:
                    print(f"[CameraWorker] Cooldown active, {cooldown_remaining:.1f}s remaining")
        
        # Always use cached annotated frame if available (smooth continuous stream)
        annotated_frame = self.cached_annotated_frame if self.cached_annotated_frame is not None else frame
        
        return annotated_frame, detected

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