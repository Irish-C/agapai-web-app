import os
import time
import uuid
import asyncio
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, JSONResponse
import cv2
import numpy as np

from database import db
from src.utils.input_sanitization import sanitize_input
from src.utils.rate_limiter import enforce_ip_rate_limit
import redis.asyncio as aioredis
from src.controllers.camera_controller import analyze_camera_snapshot, YOLO_MODEL

# Async Redis pool to avoid blocking the event loop when waiting for frames
REDIS_URL = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379')
redis_pool = aioredis.from_url(REDIS_URL, decode_responses=False)

router = APIRouter()

# --- 1. Video Feed Endpoint ---
@router.get('/video_feed')
async def video_feed(camera_id: str | None = None):
    """MJPEG streaming endpoint.

    - If `camera_id` is provided, it reads from Redis key `latest_frame_{camera_id}`.
    - Otherwise, it falls back to the global `latest_frame` key.
    """

    try:
        camera_id = sanitize_input(camera_id) if camera_id else None
        if camera_id:
            camera_id = str(camera_id)
        
        stream_key = f"latest_frame_{camera_id}" if camera_id else "latest_frame"

        async def generate():
            chunk_count = 0
            while True:
                try:
                    # Await the async Redis client so other requests aren't blocked
                    frame_bytes = await redis_pool.get(stream_key)

                    if not frame_bytes:
                        # Debug: surface when Redis has no frame for this camera
                        print(f"[video_feed DEBUG] No frame in Redis for key: {stream_key}")
                        await asyncio.sleep(0.1)
                        continue

                    chunk_count += 1
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n'
                           b'Content-Length: ' + str(len(frame_bytes)).encode() + b'\r\n\r\n'
                           + frame_bytes + b'\r\n')

                    # Throttle slightly to avoid pegging CPU (approx ~30fps)
                    await asyncio.sleep(0.033)
                except Exception as e:
                    print(f"[video_feed] Streaming error: {e}")
                    break

        return StreamingResponse(generate(), media_type='multipart/x-mixed-replace; boundary=frame')
    except Exception as e:
        print(f"[video_feed] Error initializing stream for camera {camera_id}: {e}")
        return JSONResponse(status_code=500, content={'error': str(e)})


# --- 2. Capture Camera Snapshot Endpoint ---
@router.post('/api/cameras/{camera_id}/snapshot')
async def capture_camera_snapshot(camera_id: str):
    """Capture latest frame for camera from Redis, save snapshot, and create DB event log.

    Returns the public snapshot URL and DB event id when successful.
    """
    try:
        cam_id = str(camera_id)
        r = RedisConnectionPool.get()
        # Try raw latest full-resolution frame key first, then annotated/latest
        keys = [f'latest_frame_raw_{cam_id}', f'latest_frame_{cam_id}', 'latest_frame']
        frame_bytes = None
        for k in keys:
            try:
                val = r.get(k)
            except Exception:
                val = None
            if val:
                frame_bytes = val
                break

        if not frame_bytes:
            return JSONResponse(status_code=404, content={'status': 'error', 'message': 'No frame available'})

        # Save snapshot file
        filename = f"cam{cam_id}_manual_{int(time.time())}_{uuid.uuid4().hex[:8]}.jpg"
        snapshots_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'static', 'snapshots')
        os.makedirs(snapshots_dir, exist_ok=True)
        file_path = os.path.join(snapshots_dir, filename)
        with open(file_path, 'wb') as f:
            f.write(frame_bytes)

        # Persist DB entries similar to persist_event in camera_controller
        # Ensure event type and class
        event_type_obj = await db.eventtype.find_first(where={'event_type_name': 'Snapshot'})
        if not event_type_obj:
            event_type_obj = await db.eventtype.create(data={'event_type_name': 'Snapshot'})

        class_name = 'Manual Snapshot'
        event_class_obj = await db.eventclass.find_first(where={'class_name': class_name})
        if not event_class_obj:
            event_class_obj = await db.eventclass.create(data={'class_name': class_name, 'event_type_id': event_type_obj.id})

        host = os.getenv('VITE_API_URL') or f'http://127.0.0.1:5000'
        snapshot_url = f"{host.rstrip('/')}/snapshots/{filename}"

        new_event = await db.eventlog.create(
            data={
                'cam_id': int(cam_id),
                'event_class_id': event_class_obj.id,
                'file_path': snapshot_url,
            },
            include={'camera': True, 'event_class': True}
        )

        # Optionally emit socket event for new alert
        try:
            from src.services.socket_manager import socketio_server, connected_sids
            if connected_sids:
                await socketio_server.emit('new_alert', {
                    'id': str(new_event.id),
                    'type': new_event.event_class.class_name,
                    'location': new_event.camera.cam_name if new_event.camera else 'Unknown',
                    'timestamp': new_event.timestamp.isoformat(),
                    'snapshot_url': new_event.file_path,
                    'status': 'unacknowledged'
                })
        except Exception:
            pass

        return {'status': 'success', 'snapshot_url': snapshot_url, 'event_id': str(new_event.id)}
    except Exception as e:
        print(f"[capture_camera_snapshot] Error: {e}")
        return JSONResponse(status_code=500, content={'status': 'error', 'message': str(e)})


# --- 3. Analyze Camera Event Endpoint ---
@router.post('/api/cameras/{camera_id}/analyze')
async def analyze_camera_event(camera_id: str):
    """Run server-side AI (YOLO/OpenVINO) on the latest frame and persist snapshot if detections found."""
    try:
        cam_id = int(camera_id)
    except Exception:
        return JSONResponse(status_code=400, content={'status': 'error', 'message': 'invalid camera id'})

    try:
        resp, status = await analyze_camera_snapshot(cam_id)
        return JSONResponse(status_code=status if isinstance(status, int) else 200, content=resp)
    except Exception as e:
        print(f"[analyze_camera_event] Error: {e}")
        return JSONResponse(status_code=500, content={'status': 'error', 'message': str(e)})


# --- 4. Detect Endpoint ---
@router.post('/detect')
async def detect_endpoint(request: Request):
    """Simple detection stub for client testing.

    Accepts binary JPEG in the request body and returns mock normalized detections.
    The client should include `X-Request-Ts` header which will be echoed back as `request_timestamp`.
    """
    try:
        # Basic rate limiting for detect endpoint (per-IP)
        try:
            allowed, retry_after = await enforce_ip_rate_limit(
                request=request,
                namespace='detect',
                limit=8,              # allow ~8 requests
                window_seconds=1,     # per second
            )
        except Exception:
            # If rate limiter fails, be conservative and allow request
            allowed, retry_after = True, 0

        if not allowed:
            return JSONResponse(status_code=429, content={'status': 'error', 'message': 'Rate limit exceeded', 'retry_after_seconds': retry_after}, headers={'Retry-After': str(retry_after)})

        # Check content-type header
        content_type = request.headers.get('content-type', '') or ''
        if 'image' not in content_type.lower() and 'octet-stream' not in content_type.lower():
            return JSONResponse(status_code=415, content={'status': 'error', 'message': 'Unsupported Media Type. Expected image/jpeg'},)

        # Enforce maximum payload size (protect small devices and model pipeline)
        MAX_BYTES = 300 * 1024  # 300 KB
        content_length = request.headers.get('content-length')
        if content_length:
            try:
                if int(content_length) > MAX_BYTES:
                    return JSONResponse(status_code=413, content={'status': 'error', 'message': 'Payload too large'})
            except Exception:
                pass

        # Read body bytes
        body = await request.body()
        if not body:
            return JSONResponse(status_code=400, content={'status': 'error', 'message': 'No image received'})

        if len(body) > MAX_BYTES:
            return JSONResponse(status_code=413, content={'status': 'error', 'message': 'Payload too large'})

        req_ts = request.headers.get('X-Request-Ts') or request.headers.get('X-Request-Timestamp')

        # Decode incoming JPEG into an OpenCV image
        try:
            arr = np.frombuffer(body, dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is None:
                return JSONResponse(status_code=400, content={'status': 'error', 'message': 'Failed to decode image'})
        except Exception as e:
            return JSONResponse(status_code=400, content={'status': 'error', 'message': 'Invalid image data'})

        if YOLO_MODEL is None:
            return JSONResponse(status_code=503, content={'status': 'error', 'message': 'AI model not loaded'})

        # Run inference off the event loop
        try:
            t_infer_start = time.perf_counter()
            results = await asyncio.to_thread(lambda: YOLO_MODEL.predict(source=img, conf=0.3, imgsz=640, verbose=False))
            t_infer_end = time.perf_counter()
            infer_ms = (t_infer_end - t_infer_start) * 1000
            print(f"[detect] Inference time: {infer_ms:.1f}ms")
        except Exception as e:
            print(f"[detect] YOLO inference error: {e}")
            return JSONResponse(status_code=500, content={'status': 'error', 'message': 'Inference failed'})

        detections = []
        try:
            if results and len(results) > 0:
                r = results[0]
                img_h, img_w = img.shape[:2]
                boxes = getattr(r, 'boxes', None)
                if boxes is not None:
                    for box in boxes:
                        try:
                            xy = box.xyxy[0]
                            x1, y1, x2, y2 = float(xy[0]), float(xy[1]), float(xy[2]), float(xy[3])
                            cls_id = int(box.cls[0]) if hasattr(box, 'cls') else int(box.cls) if isinstance(box.cls, (int, float)) else 0
                            conf = float(box.conf[0]) if hasattr(box, 'conf') else float(box.conf) if hasattr(box, 'conf') else 0.0
                            label = YOLO_MODEL.names.get(cls_id, str(cls_id)) if hasattr(YOLO_MODEL, 'names') else str(cls_id)
                            nx = x1 / img_w
                            ny = y1 / img_h
                            nw = (x2 - x1) / img_w
                            nh = (y2 - y1) / img_h
                            detections.append({'label': label, 'confidence': round(conf, 3), 'box': [nx, ny, nw, nh]})
                        except Exception:
                            continue
        except Exception as e:
            print(f"[detect] Failed to parse results: {e}")

        return JSONResponse(content={
            'request_timestamp': int(req_ts) if req_ts and str(req_ts).isdigit() else int(time.time() * 1000),
            'response_timestamp': int(time.time() * 1000),
            'detections': detections
        })
    except Exception as e:
        print(f"[detect_endpoint] Error: {e}")
        return JSONResponse(status_code=500, content={'status': 'error', 'message': str(e)})
