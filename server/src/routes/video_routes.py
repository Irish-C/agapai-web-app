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
# Streaming and heavy inference helpers were removed. Keep a placeholder
# so the detect endpoint can gracefully report model-unavailable.
YOLO_MODEL = None

# Async Redis pool to avoid blocking the event loop when waiting for frames
REDIS_URL = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379')
redis_pool = aioredis.from_url(REDIS_URL, decode_responses=False)

router = APIRouter()

# --- 1. Video Feed Endpoint ---
@router.get('/video_feed')
async def video_feed_disabled(camera_id: str | None = None):
    """Streaming endpoint disabled.

    Streaming functionality has been removed from the backend. This route
    remains to provide a clear 404-like JSON response for callers.
    """
    return JSONResponse(status_code=410, content={'status': 'disabled', 'message': 'Streaming endpoint removed'})


# --- 2. Capture Camera Snapshot Endpoint ---
@router.post('/api/cameras/{camera_id}/snapshot')
async def capture_camera_snapshot_disabled(camera_id: str):
    return JSONResponse(status_code=410, content={'status': 'disabled', 'message': 'Snapshot endpoint removed'})


# --- 3. Analyze Camera Event Endpoint ---
@router.post('/api/cameras/{camera_id}/analyze')
async def analyze_camera_event_disabled(camera_id: str):
    return JSONResponse(status_code=410, content={'status': 'disabled', 'message': 'Analyze endpoint removed'})


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
