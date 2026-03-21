import os
import cv2
import asyncio
import base64
import time
import uuid
from ultralytics import YOLO
from database import db
import yaml
import subprocess
import signal
import socket
from urllib.parse import urlsplit, urlunsplit
from src.utils.redis_pool import RedisConnectionPool

# Get Redis client from singleton pool
def get_redis():
    return RedisConnectionPool.get()

# Helper: server root
_SERVER_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
_MTX_BIN = os.path.join(_SERVER_DIR, 'mediamtx')
_MTX_CONF = os.path.join(_SERVER_DIR, 'mediamtx.yml')
_MTX_PID = os.path.join(_SERVER_DIR, 'mediamtx.pid')


def _is_tcp_listening(host: str, port: int, timeout: float = 0.4) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False


async def ensure_mediamtx_running() -> bool:
    """Start MediaMTX if RTSP port is not available.

    Returns True when RTSP listener is available after the check.
    """
    if _is_tcp_listening('127.0.0.1', 8554):
        return True

    if not os.path.exists(_MTX_BIN):
        print(f"[camera_controller] MediaMTX binary not found at {_MTX_BIN}")
        return False

    try:
        proc = subprocess.Popen(
            [_MTX_BIN, _MTX_CONF],
            cwd=_SERVER_DIR,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        with open(_MTX_PID, 'w') as pf:
            pf.write(str(proc.pid))

        # Give MediaMTX a brief moment to bind sockets.
        await asyncio.sleep(0.8)
        ok = _is_tcp_listening('127.0.0.1', 8554)
        if ok:
            print('[camera_controller] MediaMTX started and listening on :8554')
        else:
            print('[camera_controller] MediaMTX start attempted, but :8554 is still unavailable')
        return ok
    except Exception as e:
        print(f"[camera_controller] Failed to start MediaMTX: {e}")
        return False

# Snapshot storage (for alert snapshots)
SNAPSHOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../static/snapshots'))
os.makedirs(SNAPSHOT_DIR, exist_ok=True)
SNAPSHOT_BASE_URL = os.getenv('SNAPSHOT_BASE_URL') or os.getenv('VITE_API_URL') or 'http://localhost:5000'

# Load YOLO model if available
MODEL_PATH = os.path.join(os.path.dirname(__file__), '../../ml/yolov11_fin.pt')
YOLO_MODEL = None
print(f"[camera_controller] Attempting to load YOLO from: {MODEL_PATH}")
try:
    if os.path.exists(MODEL_PATH):
        print(f"[camera_controller] Model file exists, loading...")
        YOLO_MODEL = YOLO(MODEL_PATH)
        YOLO_MODEL.to('cpu')
        print(f"[camera_controller] ✓ Loaded YOLO model: {MODEL_PATH}")
    else:
        print(f"[camera_controller] ✗ YOLO model not found at: {MODEL_PATH}")
except Exception as e:
    print(f"[camera_controller] ✗ Failed to load YOLO model: {e}")
    import traceback
    traceback.print_exc()

# Track whether we've logged the first emit for a camera (one-time diagnostic)
_FIRST_EMIT_LOGGED: set = set()

async def start_camera_processing():
    """
    Initial startup task. 
    It waits for the database to connect, then starts individual stream loops 
    for every camera marked as active (cam_status=True).
    """
    await asyncio.sleep(2) # Brief delay to ensure DB and Socket server are ready
    try:
        active_cameras = await db.camera.find_many(where={'cam_status': True})
        
        print(f"[start_camera_processing] Found {len(active_cameras)} active cameras")
        
        for cam in active_cameras:
            print(f"[start_camera_processing] Starting stream: {cam.cam_name} -> {cam.stream_url}")
            # Launch each camera in its own background task
            asyncio.create_task(stream_camera_loop(cam.id, cam.stream_url))
    except Exception as e:
        print(f"[start_camera_processing] Error starting camera streams: {e}")

async def stream_camera_loop(camera_id, rtsp_url):
    """The main loop for a single camera.

    Captures frames, encodes them to base64, and emits them via Socket.IO.

    Only triggers alerts for *falls* and *inactivity* (not general motion).
    """
    # Normalize local RTSP URLs without explicit port to MediaMTX default 8554.
    # Example: rtsp://localhost/stream1 -> rtsp://localhost:8554/stream1
    def normalize_rtsp_url(raw_url: str) -> str:
        try:
            parsed = urlsplit(raw_url)
            if parsed.scheme != 'rtsp':
                return raw_url

            host = (parsed.hostname or '').lower()
            if host not in {'localhost', '127.0.0.1', '::1'}:
                return raw_url

            if parsed.port is not None:
                return raw_url

            userinfo = ''
            if parsed.username:
                userinfo = parsed.username
                if parsed.password:
                    userinfo += f":{parsed.password}"
                userinfo += '@'

            host_for_netloc = parsed.hostname or 'localhost'
            new_netloc = f"{userinfo}{host_for_netloc}:8554"
            return urlunsplit((parsed.scheme, new_netloc, parsed.path, parsed.query, parsed.fragment))
        except Exception:
            return raw_url

    normalized_url = normalize_rtsp_url(rtsp_url)
    if normalized_url != rtsp_url:
        print(f"[stream_camera_loop] Camera {camera_id}: normalized local RTSP URL to {normalized_url}")

    # Use TCP transport and small buffer for lower latency and fewer stale frames
    os.environ.setdefault("OPENCV_FFMPEG_CAPTURE_OPTIONS", "rtsp_transport;tcp|timeout;5000000")
    cap = cv2.VideoCapture(normalized_url, cv2.CAP_FFMPEG)
    try:
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    except Exception:
        # Not all OpenCV builds support setting buffer size; ignore if it fails
        pass

    # Track camera status
    camera_status = 'connecting'  # connecting, online, offline, error
    last_status_emit = 0.0
    connection_start_time = time.time()
    connection_timeout = 15.0  # seconds before marking as error
    
    async def emit_camera_status(status_str: str, reason: str = ''):
        """Emit camera status update to frontend."""
        nonlocal last_status_emit
        now = time.time()
        if now - last_status_emit < 1.0:  # Avoid spam, max 1 per second
            return
        
        from app import socketio_server
        try:
            message = f"{status_str.upper()}"
            if reason:
                message += f": {reason}"
            await socketio_server.emit('camera_status', {
                'cam_id': str(camera_id),
                'status': status_str,
                'message': message
            })
            last_status_emit = now
        except Exception as e:
            print(f"[stream_camera_loop] Failed to emit status: {e}")

    async def persist_event(event_type: str, class_name: str, frame=None):
        """Persist an event log to the DB (including a snapshot) and emit a new_alert socket event."""
        try:
            snapshot_url = ''
            if frame is not None:
                # Save a snapshot image for later viewing
                try:
                    safe_class = ''.join(c if c.isalnum() else '_' for c in class_name)
                    filename = f"cam{camera_id}_{safe_class}_{int(time.time())}_{uuid.uuid4().hex[:8]}.jpg"
                    file_path = os.path.join(SNAPSHOT_DIR, filename)

                    # Encode and write the frame as JPEG
                    _, buffer = cv2.imencode('.jpg', frame)
                    with open(file_path, 'wb') as f:
                        f.write(buffer.tobytes())

                    snapshot_url = f"{SNAPSHOT_BASE_URL.rstrip('/')}/snapshots/{filename}"
                except Exception as e:
                    print(f"[camera_controller] Failed to save snapshot: {e}")

            # Ensure event type exists
            event_type_obj = await db.eventtype.find_first(where={'event_type_name': event_type})
            if not event_type_obj:
                event_type_obj = await db.eventtype.create(data={'event_type_name': event_type})

            # Ensure class exists
            event_class_obj = await db.eventclass.find_first(where={'class_name': class_name})
            if not event_class_obj:
                event_class_obj = await db.eventclass.create(
                    data={'class_name': class_name, 'event_type_id': event_type_obj.id}
                )

            # Create the event log
            new_event = await db.eventlog.create(
                data={
                    'cam_id': int(camera_id),
                    'event_class_id': event_class_obj.id,
                    'file_path': snapshot_url,
                },
                include={'camera': True, 'event_class': True}
            )

            # Emit to frontend (new_alert) only if enabled in camera toggles (DB-backed)
            try:
                # Consult global notification settings (global overrides per-camera toggles)
                gs = await db.globalsetting.find_first()
                emit_flag = True
                if gs is not None:
                    if event_type.lower() == 'fall':
                        emit_flag = bool(getattr(gs, 'emit_fall', True))
                    elif event_type.lower() == 'inactivity':
                        emit_flag = bool(getattr(gs, 'emit_inactivity', False))

                if emit_flag:
                    from app import socketio_server, connected_sids
                    payload = {
                        'id': str(new_event.id),
                        'type': new_event.event_class.class_name,
                        'location': new_event.camera.cam_name if new_event.camera else 'Unknown',
                        'timestamp': new_event.timestamp.isoformat(),
                        'snapshot_url': new_event.file_path,
                        'status': 'unacknowledged'
                    }
                    if connected_sids:
                        await socketio_server.emit('new_alert', payload)
            except Exception:
                pass

        except Exception as e:
            print(f"[camera_controller] Failed to persist event: {e}")

    # YOLO inference control
    frame_counter = 0
    yolo_skip = 6  # Run YOLO every N frames (tunable - lower for faster detection)
    cached_annotated_frame = None  # Cache annotated frame to reuse across YOLO cycles
    last_fall_alert = 0.0
    fall_alert_cooldown = 2.0

    # Inactivity detection
    last_active_time = time.time()
    # Track last time the model detected a person/object of interest.
    last_person_detection = time.time()
    inactivity_timeout = 20.0  # seconds of no motion to declare inactivity
    last_inactivity_alert = 0.0
    inactivity_alert_cooldown = 30.0

    # Simple motion detection (frame differencing) to track activity
    prev_gray = None
    motion_threshold = 3000  # total contour area threshold

    # Map YOLO class labels to fall event classes
    # Adjust these mappings to match your model's output labels.
    def map_yolo_class_to_event(cls_name: str):
        """Return an event class name (for 'Fall' events) or None."""
        if not cls_name:
            return None

        cls_lower = cls_name.lower()

        # FALLS
        if 'fall' in cls_lower or 'fallen' in cls_lower:
            if 'forward' in cls_lower:
                return 'Forward Fall'
            if 'back' in cls_lower or 'backward' in cls_lower:
                return 'Backward Fall'
            if 'side' in cls_lower:
                return 'Side Fall'
            # Generic fallback for any other fall labels
            return 'Forward Fall'

        return None

    try:
        # Log YOLO status on first frame
        yolo_status_logged = False
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                print(f"[stream_camera_loop] Stream failed for camera {camera_id}. Retrying in 5s...")
                await emit_camera_status('offline', 'No frames received')
                await asyncio.sleep(5)
                cap = cv2.VideoCapture(normalized_url, cv2.CAP_FFMPEG)
                connection_start_time = time.time()  # Reset timeout when reconnecting
                continue

            # Log YOLO status once on first frame
            if not yolo_status_logged:
                if YOLO_MODEL is not None:
                    print(f"[stream_camera_loop] Camera {camera_id}: YOLO_MODEL is LOADED ✓")
                else:
                    print(f"[stream_camera_loop] Camera {camera_id}: YOLO_MODEL is NONE ✗ (not loaded)")
                yolo_status_logged = True

            # Camera is online, emit online status once
            if camera_status != 'online':
                camera_status = 'online'
                await emit_camera_status('online', 'Camera connected')
                connection_start_time = None  # Clear timeout

            # Check connection timeout (only while connecting)
            if camera_status == 'connecting':
                elapsed = time.time() - connection_start_time
                if elapsed > connection_timeout:
                    camera_status = 'error'
                    print(f"[stream_camera_loop] Camera {camera_id} connection timeout ({connection_timeout}s)")
                    await emit_camera_status('error', f'Connection timeout after {int(connection_timeout)}s')
                    await asyncio.sleep(5)
                    cap = cv2.VideoCapture(normalized_url, cv2.CAP_FFMPEG)
                    connection_start_time = time.time()  # Reset for next attempt
                    continue

            now = time.time()
            frame_counter += 1

            # Track general activity via simple frame differencing (no alert emitted)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            gray = cv2.GaussianBlur(gray, (21, 21), 0)

            if prev_gray is not None:
                delta = cv2.absdiff(prev_gray, gray)
                thresh = cv2.threshold(delta, 25, 255, cv2.THRESH_BINARY)[1]
                thresh = cv2.dilate(thresh, None, iterations=2)
                contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                motion_area = sum(cv2.contourArea(c) for c in contours)
                if motion_area > motion_threshold:
                    last_active_time = now

            prev_gray = gray

            # Run YOLO periodically (reduces CPU load) and trigger fall alerts
            fall_event_class = None
            
            # Check if AI is enabled globally
            try:
                gs = await db.globalsetting.find_first()
                ai_enabled_now = bool(getattr(gs, 'ai_enabled', True)) if gs else True
            except Exception:
                ai_enabled_now = True
            
            # Get previous AI state (initialize on first run)
            if not hasattr(stream_camera_loop, '_prev_ai_enabled'):
                stream_camera_loop._prev_ai_enabled = ai_enabled_now
            
            ai_enabled = ai_enabled_now
            
            # If AI was enabled but is now disabled, clear the cached annotated frame immediately
            if stream_camera_loop._prev_ai_enabled and not ai_enabled:
                cached_annotated_frame = None
                print(f"[stream_camera_loop] 🔴 Frame {frame_counter}: AI DISABLED - clearing cache, switching to raw video")
            
            # Update previous state for next iteration
            stream_camera_loop._prev_ai_enabled = ai_enabled
            
            # Debug: Log YOLO condition check every 600 frames (10x reduction for performance)
            if frame_counter % 600 == 0:
                print(f"[stream_camera_loop] Frame {frame_counter}: YOLO_MODEL={YOLO_MODEL is not None}, ai_enabled={ai_enabled}, frame_counter%yolo_skip={frame_counter % yolo_skip}")
            
            if YOLO_MODEL and ai_enabled and (frame_counter % yolo_skip == 0):
                try:
                    # Run the model at higher resolution for better accuracy
                    # Lowered conf to 0.3 to catch more detections
                    results = YOLO_MODEL(frame, conf=0.3, imgsz=640, verbose=False)
                    
                    if len(results) > 0:
                        r = results[0]
                        num_detections = len(r.boxes) if r.boxes else 0
                        
                        if frame_counter % 600 == 0:  # Log every 600 frames (~10 sec at 60fps)
                            print(f"[camera_controller] Frame {frame_counter}: YOLO ran, detected {num_detections} object(s)")
                        
                        # Use YOLO's built-in .plot() to draw bounding boxes and cache it
                        cached_annotated_frame = r.plot()
                        frame = cached_annotated_frame
                        
                        if r.boxes is not None and len(r.boxes) > 0:  # Removed per-frame logging for performance
                            # Detections logged above at frame_counter % 600 interval
                            # First: check for person/human detections to drive inactivity logic
                            person_detected = False
                            for box in r.boxes:
                                cls_id = int(box.cls[0])
                                cls_name = YOLO_MODEL.names.get(cls_id, str(cls_id))
                                if 'person' in cls_name.lower() or 'human' in cls_name.lower() or 'people' in cls_name.lower():
                                    person_detected = True
                                    break

                            if person_detected:
                                last_person_detection = now

                            # Then: existing fall-detection logic (separate concern)
                            for box in r.boxes:
                                cls_id = int(box.cls[0])
                                cls_name = YOLO_MODEL.names.get(cls_id, str(cls_id))
                                mapped_class = map_yolo_class_to_event(cls_name)
                                if mapped_class:
                                    fall_event_class = mapped_class
                                    # Use the first matching fall class per frame
                                    break

                            if fall_event_class:
                                # If a fall is detected, consider that activity as well
                                last_person_detection = now
                        else:
                            if frame_counter % 3000 == 0:  # Log every 3000 frames (~50 sec)
                                print(f"[camera_controller] Frame {frame_counter}: No objects detected by YOLO")
                    else:
                        if frame_counter % 3000 == 0:
                            print(f"[camera_controller] Frame {frame_counter}: Empty YOLO results")

                except Exception as e:
                    print(f"[camera_controller] YOLO inference error on frame {frame_counter}: {e}")
                    import traceback
                    traceback.print_exc()
            else:
                # If AI is enabled but YOLO didn't run this frame, reuse cached frame
                # If AI is disabled, use raw frame (don't use old cached annotated frames)
                if ai_enabled and cached_annotated_frame is not None:
                    frame = cached_annotated_frame
                    if frame_counter % 1200 == 0:  # Log every 1200 frames (~20 sec at 60fps)
                        print(f"[camera_controller] Frame {frame_counter}: Reusing cached annotated frame")
                elif ai_enabled and frame_counter % 3000 == 0:
                    print(f"[camera_controller] Frame {frame_counter}: No cached frame available, using raw frame")
                elif not ai_enabled and frame_counter % 3000 == 0:
                    print(f"[camera_controller] Frame {frame_counter}: AI disabled, using raw frame")
            if fall_event_class and (now - last_fall_alert) > fall_alert_cooldown:
                last_fall_alert = now
                # Check global settings for fall persistence
                try:
                    gs = await db.globalsetting.find_first()
                    persist_fall = bool(getattr(gs, 'persist_fall', True)) if gs is not None else True
                except Exception:
                    persist_fall = True

                if persist_fall:
                    # persist_event handles emission via emit_flag (respects global settings)
                    await persist_event('Fall', fall_event_class, frame)

            # Inactivity: prefer model-based detection when available.
            inactive_by_model = False
            if YOLO_MODEL:
                if now - last_person_detection > inactivity_timeout:
                    inactive_by_model = True
            else:
                # Fallback to motion-based detection when model is not available
                if now - last_active_time > inactivity_timeout:
                    inactive_by_model = True

            # Inactivity detected (model or motion), but emission/persist removed
            # to avoid noisy alerts. last_inactivity_alert is still tracked
            # to avoid rapid re-checks if needed in future.
            if inactive_by_model and (now - last_inactivity_alert) > inactivity_alert_cooldown:
                last_inactivity_alert = now

            # 1. ENCODE FRAME: Convert the OpenCV image to JPEG
            # Lower quality (50) for faster transmission - matches Flask example performance
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
            frame_bytes = buffer.tobytes()

            # 2. STORE TO REDIS: For MJPEG streaming (faster than Socket.IO)
            try:
                r = get_redis()
                r.set(f'latest_frame_{camera_id}', frame_bytes)
                r.set('latest_frame', frame_bytes)  # Fallback
            except Exception as e:
                print(f"[camera_controller] Redis error: {e}")

            # 3. EMIT FRAME TO FRONTEND: Also emit via Socket.IO for alerts and status
            # ❌ REMOVED - inefficient duplicate path (base64 + Socket.IO overhead)
            # Use HTTP MJPEG instead (/video_feed endpoint reads from Redis)
            # from app import socketio_server
            # frame_base64 = base64.b64encode(frame_bytes).decode('utf-8')
            # payload = {'cam_id': str(camera_id), 'frame': frame_base64}
            # try:
            #     rooms = getattr(socketio_server.manager, 'rooms', None)
            #     if isinstance(rooms, dict):
            #         ns_rooms = rooms.get('/', {})
            #         members = ns_rooms.get(f'camera_{camera_id}')
            #         has_listeners = bool(members)
            #     else:
            #         has_listeners = True
            # except Exception:
            #     has_listeners = True
            # if has_listeners:
            #     key = f"cam:{camera_id}"
            #     if key not in _FIRST_EMIT_LOGGED:
            #         print(f"[camera_controller] Emitting first camera_frame for {camera_id}")
            #         _FIRST_EMIT_LOGGED.add(key)
            #     await socketio_server.emit('camera_frame', payload, room=f'camera_{camera_id}')

            # 4. FPS CONTROL
            await asyncio.sleep(0.0167)  # ~60 FPS
    except asyncio.CancelledError:
        pass
    finally:
        cap.release()
        print(f"Stopped stream for camera {camera_id}")


async def get_cameras_logic():
    cameras = await db.camera.find_many(include={"location": True})
    result = []
    for cam in cameras:
        cam_id = str(cam.id)
        result.append({
            "id": cam_id, # Convert BigInt to string for JSON safety
            "name": cam.cam_name,
            "status": cam.cam_status,
            "stream_url": cam.stream_url,
            "location_name": cam.location.loc_name if cam.location else None,
        })
    return result, 200

async def get_camera_logic(camera_id):
    camera = await db.camera.find_unique(
        where={"id": int(camera_id)},
        include={"location": True}
    )
    if not camera:
        return {"error": "Camera not found"}, 404
    cam_id = str(camera.id)
    return {
        "id": cam_id,
        "name": camera.cam_name,
        "location_name": camera.location.loc_name if camera.location else None,
    }, 200

async def create_camera_logic(camera_data):
    try:
        # Create camera with DB-backed toggles (defaults applied by Prisma schema)
        data_payload = {
            "cam_name": camera_data.get("cam_name"),
            "loc_id": int(camera_data.get("loc_id")),
            "stream_url": camera_data.get("stream_url"),
            "cam_status": True
        }
        # Per-camera toggles are managed via global settings. Do not accept toggle overrides here.

        new_camera = await db.camera.create(data=data_payload)
        return {"status": "success", "camera_id": str(new_camera.id)}, 201
    except Exception as e:
        return {"error": str(e)}, 500

# PATCH logic for updating camera details
async def update_camera_logic(camera_id, camera_data):
    try:
        cam_name = camera_data.get("cam_name")
        loc_id = camera_data.get("loc_id")
        stream_url = camera_data.get("stream_url")
        if loc_id is None:
            return {"error": "loc_id is required and cannot be None"}, 400
        update_payload = {
            "cam_name": cam_name,
            "loc_id": int(loc_id),
            "stream_url": stream_url
        }
        # Per-camera toggles are managed via global settings. Do not accept toggle overrides here.

        updated_camera = await db.camera.update(
            where={"id": int(camera_id)},
            data=update_payload
        )

        return {"status": "success", "camera_id": str(updated_camera.id)}, 200
    except Exception as e:
        return {"error": str(e)}, 500

async def delete_camera_logic(camera_id):
    try:
        # First, unpublish from MediaMTX if published
        await unpublish_camera_from_mediamtx(camera_id)
        
        # Then delete from database
        await db.camera.delete(where={"id": int(camera_id)})
        return {"status": "success", "message": "Camera deleted and unpublished from MediaMTX"}, 200
    except Exception as e:
        return {"error": str(e)}, 500


async def publish_camera_to_mediamtx(camera_id):
    """Ensure MediaMTX has a path for this camera, restart mediamtx, and
    return the public HLS and WebRTC endpoints."""
    try:
        camera = await db.camera.find_unique(where={"id": int(camera_id)})
        if not camera:
            return {"error": "Camera not found"}, 404

        path_name = f"cam{camera.id}"
        stream_url = camera.stream_url

        # Load existing mediamtx.yml
        with open(_MTX_CONF, 'r') as f:
            cfg = yaml.safe_load(f) or {}

        if 'paths' not in cfg:
            cfg['paths'] = {}

        # Add or update path
        cfg['paths'][path_name] = {
            'source': stream_url,
            'sourceOnDemand': True
        }

        # Backup and write config
        try:
            with open(_MTX_CONF + '.bak', 'w') as bak:
                yaml.safe_dump(cfg, bak)
        except Exception:
            pass

        with open(_MTX_CONF, 'w') as f:
            yaml.safe_dump(cfg, f)

        # Restart mediamtx: kill if pid exists, then start a new process
        try:
            if os.path.exists(_MTX_PID):
                with open(_MTX_PID, 'r') as pf:
                    old = pf.read().strip()
                    if old:
                        try:
                            os.kill(int(old), signal.SIGTERM)
                        except Exception:
                            pass
        except Exception:
            pass

        # Start mediamtx binary
        try:
            proc = subprocess.Popen([
                _MTX_BIN, _MTX_CONF
            ], cwd=_SERVER_DIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            with open(_MTX_PID, 'w') as pf:
                pf.write(str(proc.pid))
        except Exception as e:
            return {"error": f"Failed to start mediamtx: {e}"}, 500

        host = os.getenv('VITE_API_URL') or 'http://127.0.0.1'
        hls_url = f"{host}:8888/{path_name}/index.m3u8"
        webrtc_url = f"{host}:8889/{path_name}/whep"

        return {"status": "ok", "hls": hls_url, "webrtc": webrtc_url, "path": path_name}, 200
    except Exception as e:
        return {"error": str(e)}, 500


async def unpublish_camera_from_mediamtx(camera_id):
    """Remove camera path from MediaMTX config and restart mediamtx."""
    try:
        camera = await db.camera.find_unique(where={"id": int(camera_id)})
        if not camera:
            return {"error": "Camera not found"}, 404

        path_name = f"cam{camera.id}"

        # Load existing mediamtx.yml
        with open(_MTX_CONF, 'r') as f:
            cfg = yaml.safe_load(f) or {}

        if 'paths' not in cfg:
            cfg['paths'] = {}

        # Remove path if it exists
        if path_name in cfg['paths']:
            del cfg['paths'][path_name]

        # Backup and write config
        try:
            with open(_MTX_CONF + '.bak', 'w') as bak:
                yaml.safe_dump(cfg, bak)
        except Exception:
            pass

        with open(_MTX_CONF, 'w') as f:
            yaml.safe_dump(cfg, f)

        # Restart mediamtx: kill if pid exists, then start a new process
        try:
            if os.path.exists(_MTX_PID):
                with open(_MTX_PID, 'r') as pf:
                    old = pf.read().strip()
                    if old:
                        try:
                            os.kill(int(old), signal.SIGTERM)
                        except Exception:
                            pass
        except Exception:
            pass

        # Start mediamtx binary
        try:
            proc = subprocess.Popen([
                _MTX_BIN, _MTX_CONF
            ], cwd=_SERVER_DIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            with open(_MTX_PID, 'w') as pf:
                pf.write(str(proc.pid))
        except Exception as e:
            return {"error": f"Failed to start mediamtx: {e}"}, 500

        return {"status": "ok", "message": "Camera unpublished."}, 200
    except Exception as e:
        return {"error": str(e)}, 500