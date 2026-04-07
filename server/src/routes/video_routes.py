import os
import time
import uuid
import asyncio
import json
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, JSONResponse
import cv2
import numpy as np
import httpx
import asyncio
from urllib.parse import urlparse
from pathlib import Path

from database import db
from src.utils.input_sanitization import sanitize_input
from src.utils.rate_limiter import enforce_ip_rate_limit
import redis.asyncio as aioredis

# Initialize YOLO model with GPU if available
YOLO_MODEL = None
_MODEL_LOAD_ATTEMPTED = False

def _load_yolo_model():
    """Lazily load YOLO model with GPU support via OpenVINO."""
    global YOLO_MODEL, _MODEL_LOAD_ATTEMPTED
    if _MODEL_LOAD_ATTEMPTED:
        return YOLO_MODEL
    
    _MODEL_LOAD_ATTEMPTED = True
    try:
        from ultralytics import YOLO
        model_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), '..', '..', 'ml', 'best_openvino_model')
        )
        if not os.path.exists(model_path):
            print(f"[video_routes] Model path not found: {model_path}")
            return None
        
        # Check if it's an OpenVINO model
        is_ov_model = os.path.isdir(model_path) and any(
            p.endswith('.xml') or p.endswith('.bin') for p in os.listdir(model_path)
        )
        
        # For OpenVINO models, pass device='cpu' to avoid CUDA errors
        # OPENVINO_DEVICE env var controls actual device (CPU/GPU/HETERO:GPU,CPU)
        YOLO_MODEL = YOLO(model_path, task='detect')
        ov_device = os.environ.get('OPENVINO_DEVICE') or os.environ.get('DEVICE') or 'HETERO:GPU,CPU'
        print(f"[video_routes] YOLO model loaded (OpenVINO={is_ov_model}, device={ov_device})")
        return YOLO_MODEL
    except Exception as e:
        print(f"[video_routes] Failed to load YOLO model: {e}")
        return None

# Async Redis pool to avoid blocking the event loop when waiting for frames
REDIS_URL = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379')
redis_pool = aioredis.from_url(REDIS_URL, decode_responses=False)

router = APIRouter()


@router.get('/snapshots/stream/{camera_id}')
async def stream_latest_snapshot(camera_id: str):
    """Stream the latest overlay snapshot for a camera as MJPEG (multipart/x-mixed-replace).

    The endpoint repeatedly reads `static/snapshots/latest_{camera_id}.jpg` and yields
    JPEG frames to the client. Useful for dashboards that can display MJPEG streams.
    """
    from pathlib import Path
    server_root = Path(__file__).resolve().parents[2]
    snapshot_dir = os.path.join(server_root, 'static', 'snapshots')
    latest_path = os.path.join(snapshot_dir, f'latest_{camera_id}.jpg')
    boundary = 'frame'

    async def gen():
        while True:
            try:
                if os.path.exists(latest_path):
                    with open(latest_path, 'rb') as f:
                        img = f.read()
                    header = (f"--{boundary}\r\nContent-Type: image/jpeg\r\nContent-Length: {len(img)}\r\n\r\n").encode('utf-8')
                    yield header + img + b'\r\n'
                await asyncio.sleep(0.5)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[stream_latest_snapshot] error: {e}")
                await asyncio.sleep(1)

    return StreamingResponse(gen(), media_type=f'multipart/x-mixed-replace; boundary={boundary}')

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

        # Early check: if global AI is disabled, skip inference and return empty detections
        try:
            gs = await db.globalsetting.find_first()
            ai_enabled = True if not gs else bool(getattr(gs, 'ai_enabled', True))
        except Exception:
            ai_enabled = True

        if not ai_enabled:
            req_ts = request.headers.get('X-Request-Ts') or request.headers.get('X-Request-Timestamp')
            return JSONResponse(content={
                'request_timestamp': int(req_ts) if req_ts and str(req_ts).isdigit() else int(time.time() * 1000),
                'response_timestamp': int(time.time() * 1000),
                'detections': [],
                'ai_enabled': False
            })

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
            # Try lazy loading on first request
            _load_yolo_model()
        
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
        boxes_to_draw = []
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
                            boxes_to_draw.append((int(x1), int(y1), int(x2), int(y2), label, float(conf)))
                        except Exception:
                            continue
        except Exception as e:
            print(f"[detect] Failed to parse results: {e}")

        # Prepare response body
        response_body = {
            'request_timestamp': int(req_ts) if req_ts and str(req_ts).isdigit() else int(time.time() * 1000),
            'response_timestamp': int(time.time() * 1000),
            'detections': detections,
            'inference_ms': infer_ms if 'infer_ms' in locals() else None,
            'ai_enabled': True,
        }

        # Attempt to render overlay and save snapshot to disk (served at /snapshots)
        snapshot_url = None
        try:
            from pathlib import Path
            camera_id = request.headers.get('X-Camera-Id') or request.query_params.get('camera_id') or 'unknown'
            server_root = Path(__file__).resolve().parents[2]
            snapshot_dir = os.path.join(server_root, 'static', 'snapshots')
            os.makedirs(snapshot_dir, exist_ok=True)

            # Prepare overlay image (draw boxes if present)
            img_overlay = img.copy()
            if boxes_to_draw:
                for (x1, y1, x2, y2, label, conf) in boxes_to_draw:
                    try:
                        cv2.rectangle(img_overlay, (x1, y1), (x2, y2), (0, 255, 0), 2)
                        text = f"{label} {conf:.2f}"
                        cv2.putText(img_overlay, text, (x1, max(0, y1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 0), 1)
                    except Exception:
                        continue

            # Always write a latest snapshot file (overwritten) so dashboard can fetch current frame
            try:
                latest_filename = f"latest_{camera_id}.jpg"
                latest_fullpath = os.path.join(snapshot_dir, latest_filename)
                cv2.imwrite(latest_fullpath, img_overlay)
                snapshot_url = f"/snapshots/{latest_filename}"
                response_body['snapshot_url'] = snapshot_url
            except Exception as e:
                print(f"[detect] Failed to write latest snapshot: {e}")

            # Additionally write a timestamped snapshot when detections are present
            if boxes_to_draw:
                try:
                    filename = f"{camera_id}_{int(time.time() * 1000)}_{uuid.uuid4().hex[:8]}.jpg"
                    fullpath = os.path.join(snapshot_dir, filename)
                    cv2.imwrite(fullpath, img_overlay)
                    # prefer timestamped snapshot for event archives
                    event_snapshot_url = f"/snapshots/{filename}"
                    response_body['snapshot_url'] = event_snapshot_url
                    snapshot_url = event_snapshot_url
                except Exception as e:
                    print(f"[detect] Failed to save overlay snapshot: {e}")

            # Publish small JSON event to Redis (per-camera channel). This is fire-and-forget but we log failures.
            event = {
                'camera_id': str(camera_id),
                'frame_id': str(uuid.uuid4()),
                'request_timestamp': response_body['request_timestamp'],
                'server_timestamp': response_body['response_timestamp'],
                'inference_ms': response_body['inference_ms'],
                'detections': detections,
            }
            if snapshot_url:
                event['snapshot_url'] = snapshot_url
            await redis_pool.publish(f"camera:{camera_id}:detections", json.dumps(event))
        except Exception as e:
            print(f"[detect] Failed to publish detections to Redis: {e}")

        return JSONResponse(content=response_body)
    except Exception as e:
        print(f"[detect_endpoint] Error: {e}")
        return JSONResponse(status_code=500, content={'status': 'error', 'message': str(e)})


@router.get('/mediamtx_health')
async def mediamtx_health():
    """Check MediaMTX HTTP (API), WHEP (WebRTC signaling) and RTSP ingest reachability.

    Returns a JSON summary with actionable messages for the UI.
    """
    MEDIAMTX_API = os.getenv('MEDIAMTX_API', 'http://127.0.0.1:8888')
    MEDIAMTX_WHEP = os.getenv('MEDIAMTX_WHEP', 'http://127.0.0.1:8889')
    MEDIAMTX_URL = os.getenv('MEDIAMTX_URL', 'rtsp://127.0.0.1:8888')

    result = {
        'api': {'url': MEDIAMTX_API, 'ok': False, 'status_code': None, 'error': None},
        'whep': {'url': MEDIAMTX_WHEP, 'ok': False, 'status_code': None, 'error': None},
        'rtsp': {'url': MEDIAMTX_URL, 'ok': False, 'error': None},
        'ok': False,
    }

    async def _check_http(url, key):
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                r = await client.get(url)
                result[key]['status_code'] = r.status_code
                result[key]['ok'] = r.status_code < 500
        except Exception as e:
            result[key]['error'] = str(e)

    async def _check_rtsp(rtsp_url):
        try:
            p = urlparse(rtsp_url)
            host = p.hostname or '127.0.0.1'
            port = p.port or 554
            fut = asyncio.open_connection(host, port)
            reader, writer = await asyncio.wait_for(fut, timeout=3)
            writer.close()
            try:
                await writer.wait_closed()
            except Exception:
                pass
            result['rtsp']['ok'] = True
        except Exception as e:
            result['rtsp']['error'] = str(e)

    await asyncio.gather(
        _check_http(MEDIAMTX_API, 'api'),
        _check_http(MEDIAMTX_WHEP, 'whep'),
        _check_rtsp(MEDIAMTX_URL),
    )

    result['ok'] = result['api']['ok'] and result['whep']['ok'] and result['rtsp']['ok']

    # Add friendly messages
    messages = []
    if not result['api']['ok']:
        messages.append('MediaMTX HTTP API unreachable. Check MEDIAMTX_API and that MediaMTX is running.')
    if not result['whep']['ok']:
        messages.append('MediaMTX WebRTC/WHEP unreachable. WebRTC playback will fail; check MEDIAMTX_WHEP and firewall/ports.')
    if not result['rtsp']['ok']:
        messages.append('MediaMTX RTSP ingest unreachable. Backend cannot push RTSP streams to MediaMTX.')

    result['messages'] = messages
    return JSONResponse(content=result)
