#!/usr/bin/env python3
"""Processing worker: reads RTSP, runs YOLO inference (if available), overlays boxes,
and streams encoded video to ffmpeg stdin which pushes to MediaMTX.

Usage: python processing_worker.py --src <rtsp_url> --target <rtsp_target> --camera_id <id>
"""
import argparse
import subprocess
import shlex
import sys
import time
import signal
import uuid
import asyncio
from datetime import datetime, timezone
from pathlib import Path

# Ensure server/ is on sys.path for imports
server_root = Path(__file__).parent.parent.parent.resolve()
if str(server_root) not in sys.path:
    sys.path.insert(0, str(server_root))

try:
    import cv2
    import numpy as np
except Exception:
    print("processing_worker: missing OpenCV or numpy")
    sys.exit(1)

YOLO = None
try:
    # optional import if ultralytics is installed
    from ultralytics import YOLO as _YOLO
    YOLO = _YOLO
except Exception:
    YOLO = None

# Import shared drawing utility
try:
    from src.utils.drawing import draw_text_outline
    from src.utils.redis_pool import RedisConnectionPool
except Exception:
    # Fallback if import fails
    def draw_text_outline(img, text, pos, text_color=(0, 255, 0), bg_color=(0, 0, 0)):
        """Fallback text drawing function."""
        font = cv2.FONT_HERSHEY_DUPLEX
        font_scale = 0.6
        thickness = 1
        x, y = pos
        cv2.putText(img, text, (x, y), font, font_scale, bg_color, thickness + 2, cv2.LINE_AA)
        cv2.putText(img, text, (x, y), font, font_scale, text_color, thickness, cv2.LINE_AA)


def get_activity_color(activity_label):
    """Get RGB color based on activity type for visual distinction.
    
    Color scheme:
    - Fall activities (HIGH PRIORITY): Red with cyan text
    - Lying Down (ATTENTION): Brown with light blue text
    - Sitting/Eating (NORMAL): Dark green with light green text
    - Standing (NORMAL): Light green
    - Walking (NORMAL): Cyan
    - Default: White
    """
    fall_activities = ["Forward Fall", "Backward Fall", "Sideward Fall"]
    
    if activity_label in fall_activities:
        return (0, 0, 255), (0, 255, 255)  # Red box, Cyan text - URGENT
    elif activity_label == "Lying Down":
        return (139, 69, 19), (100, 200, 255)  # Brown box, Light blue text - ATTENTION
    elif activity_label in ["Sitting", "Eating"]:
        return (0, 165, 0), (100, 255, 100)  # Darker green box, Light green text - SAFE
    elif activity_label == "Standing":
        return (0, 255, 0), (100, 200, 100)  # Green box, Green text - OK
    elif activity_label == "Walking":
        return (255, 0, 0), (100, 150, 255)  # Blue box, Light blue text - MOVING
    else:
        return (255, 255, 255), (200, 200, 200)  # White box, Gray text - DEFAULT


def detect_encoder():
    """Detect available video encoders and select best option for iGPU/CPU.
    
    Returns tuple: (encoder_name, encoder_opts, use_downsample)
    - 'h264_qsv': Intel Quick Sync on iGPU (fastest, preferred)
    - 'libx264': CPU fallback (requires resolution downsampling)
    
    Downsampling flag indicates if resolution should be reduced to maintain bitrate.
    """
    try:
        # Check what encoders ffmpeg supports
        result = subprocess.run(
            ['ffmpeg', '-encoders', '-hide_banner'],
            capture_output=True,
            text=True,
            timeout=5
        )
        encoders_output = result.stdout
        
        # Skip h264_qsv for now - use libx264 for stability
        # Try Intel Quick Sync first (best for iGPU - h264_qsv)
        if False and 'h264_qsv' in encoders_output:
            print("[processing_worker] [ENCODER] ✓ Using Intel Quick Sync (h264_qsv) for iGPU encoding")
            print("[processing_worker] [ENCODER]   - Encoding time: 5-10ms/frame")
            print("[processing_worker] [ENCODER]   - Resolution: Full (1920×1080)")
            encoder_opts = "-c:v h264_qsv -preset fast"
            return 'h264_qsv', encoder_opts, False  # No downsampling needed
        
        # Fallback to CPU libx264 with ultrafast preset
        elif 'libx264' in encoders_output:
            print("[processing_worker] [ENCODER] ⚠ Using CPU libx264 (ultrafast preset)")
            print("[processing_worker] [ENCODER]   - Encoding time: 15-20ms/frame")
            print("[processing_worker] [ENCODER]   - Resolution: Downsampling to 1280×720")
            print("[processing_worker] [ENCODER]   - Reason: Reduce bitrate for CPU encoding")
            encoder_opts = "-c:v libx264 -preset ultrafast"
            return 'libx264', encoder_opts, True  # Need downsampling for CPU
        
        else:
            print("[processing_worker] [ENCODER] ⚠ No h264 encoder found, using default libx264")
            return 'libx264', "-c:v libx264 -preset ultrafast", True
            
    except Exception as e:
        print(f"[processing_worker] [ENCODER] ⚠ Encoder detection failed: {e}, using libx264")
        return 'libx264', "-c:v libx264 -preset ultrafast", True


# ============================================
# INACTIVITY TRACKING CONSTANTS
# ============================================
INACTIVITY_LOW_SEC = 300        # 5 minutes
INACTIVITY_MED_SEC = 900        # 15 minutes
INACTIVITY_HIGH_SEC = 1800      # 30 minutes
PATIENCE_SECONDS = 3.0          # How long before losing track of a person
TRACKER_DISTANCE_THRESHOLD = 100  # pixels - if detection within this distance, it's the same person


class PersonTracker:
    """Tracks a single person's activity and inactivity state across frames."""
    def __init__(self, tracker_id):
        self.tracker_id = tracker_id
        self.label = None              # Current activity (Lying Down, Standing, etc.)
        self.start_time = 0            # When inactivity began (Unix timestamp)
        self.last_seen = 0             # Last detection timestamp
        self.box = None                # (x1, y1, x2, y2) bounding box
        self.alert_state = None        # Which tier we've already alerted: "LOW", "MEDIUM", "HIGH"
        
    def update(self, label, current_time, box):
        """Update tracker with new detection."""
        # If activity changed, reset the timer
        if self.label != label:
            self.label = label
            self.start_time = current_time
            self.alert_state = None
        
        self.last_seen = current_time
        self.box = box
    
    def get_elapsed(self, current_time):
        """Get elapsed seconds since inactivity started."""
        if self.start_time == 0:
            return 0
        return int(current_time - self.start_time)
    
    def is_stale(self, current_time):
        """Check if tracker has expired (not seen recently)."""
        return (current_time - self.last_seen) > PATIENCE_SECONDS


async def emit_alert_to_system(
    event_class_name: str,
    camera_id: int,
    camera_name: str,
    snapshot_path: str = None,
    priority: str = "NORMAL"
):
    """
    Centralized alert emission:
    1. Save to database
    2. Emit via Socket.IO
    3. Trigger hardware alarm (if appropriate)
    """
    try:
        # Import database and socketio at runtime to avoid circular imports
        from database import db
        from src.services.hardware import hardware_alert
    except ImportError as e:
        print(f"[processing_worker] [ALERT] ⚠️ Failed to import services: {e}")
        return
    
    alert_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()
    
    # Build alert data
    alert_data = {
        "id": alert_id,
        "type": event_class_name,
        "location": camera_name,
        "timestamp": timestamp,
        "snapshot_url": snapshot_path or f"/static/snapshots/alert_{alert_id}.jpg",
        "priority": priority,
        "status": "unacknowledged"
    }
    
    # Print to server logs
    icon_map = {
        "Forward Fall": "🚨",
        "Backward Fall": "🚨",
        "Sideward Fall": "🚨",
        "Inactivity (Low)": "⚠️",
        "Inactivity (Medium)": "⚠️",
        "Inactivity (High)": "🔴"
    }
    icon = icon_map.get(event_class_name, "📢")
    print(f"\n{'='*60}")
    print(f"{icon} ALERT: {event_class_name} detected in {camera_name}")
    print(f"   Time: {timestamp} | Priority: {priority}")
    print(f"{'='*60}\n")
    
    # Save to eventlog table
    try:
        event_class = await db.eventclass.find_first(
            where={"class_name": event_class_name}
        )
        
        if event_class:
            log_entry = await db.eventlog.create(
                data={
                    "cam_id": camera_id,
                    "event_class_id": event_class.id,
                    "file_path": alert_data["snapshot_url"],
                    "timestamp": datetime.fromisoformat(timestamp),
                    "event_status": "unacknowledged"
                }
            )
            print(f"[processing_worker] [ALERT] ✅ Saved alert to database: log_id={log_entry.id}")
        else:
            print(f"[processing_worker] [ALERT] ⚠️ Event class '{event_class_name}' not found in database")
    except Exception as e:
        print(f"[processing_worker] [ALERT] ❌ Failed to save alert to DB: {e}")
    
    # Emit via Socket.IO to all connected clients
    try:
        # Try to import socketio instance - may not be available in worker process
        from src.routes import socket_registry
        if socket_registry.socketio:
            socket_registry.socketio.emit("new_alert", alert_data, broadcast=True)
            print(f"[processing_worker] [ALERT] ✅ Emitted alert via Socket.IO")
    except Exception as e:
        print(f"[processing_worker] [ALERT] ⚠️ Socket.IO emit failed (may be expected in worker process): {e}")
    
    # Trigger hardware alarm
    if "Fall" in event_class_name or priority == "CRITICAL":
        try:
            hardware_alert.trigger_alert(location=camera_name)
            print(f"[processing_worker] [ALERT] 🔴 Hardware alarm triggered (FALL/CRITICAL)")
        except Exception as e:
            print(f"[processing_worker] [ALERT] ⚠️ Hardware alarm failed: {e}")
    elif priority == "HIGH":
        try:
            hardware_alert.trigger_alert(location=camera_name)
            print(f"[processing_worker] [ALERT] 🟠 Hardware alarm triggered (HIGH INACTIVITY)")
        except Exception as e:
            print(f"[processing_worker] [ALERT] ⚠️ Hardware alarm failed: {e}")


def system_beep():
    """Play system alert sound."""
    try:
        print('\a')  # ASCII bell character
    except Exception:
        pass


def start_ffmpeg_push(width, height, fps, target):
    """Start FFmpeg process with intelligent encoder selection.
    
    Detects available encoders (h264_qsv preferred for iGPU, libx264 fallback for CPU).
    Automatically reduces resolution for CPU encoding to maintain manageable bitrate.
    
    Args:
        width, height: Video dimensions (may be downsampled for CPU path)
        fps: Frame rate (may be reduced for CPU path)
        target: RTSP target URL for MediaMTX ingest
        
    Returns:
        Process object with stdin pipe for raw BGR24 frames
    """
    encoder_name, encoder_opts, use_downsample = detect_encoder()
    
    # Store original dimensions for logging
    orig_width, orig_height, orig_fps = width, height, fps
    
    # If CPU encoding, reduce resolution to manageable bitrate
    # 1920×1080 @ 20fps = 14.4 MB/s raw data
    # 1280×720 @ 15fps = 3.6 MB/s raw data (manageable on CPU)
    if use_downsample and width > 1280:
        scale_factor = 1280 / width
        width = 1280
        height = int(height * scale_factor)
        fps = max(10, int(fps * scale_factor))  # Reduce fps slightly too
        print(f"[processing_worker] [RESOLUTION] Reduced: {orig_width}×{orig_height}@{orig_fps}fps → {width}×{height}@{fps}fps")
    
    # Build FFmpeg command with detected encoder
    cmd = (
        f"ffmpeg -f rawvideo -pixel_format bgr24 -video_size {width}x{height} "
        f"-framerate {fps} -i - {encoder_opts} "
        f"-pix_fmt yuv420p -bufsize 2M -f rtsp {shlex.quote(target)}"
    )
    
    print(f"[processing_worker] [FFMPEG] Spawning encoder: {encoder_name}")
    print(f"[processing_worker] [FFMPEG] Video params: {width}×{height}@{fps}fps")
    print(f"[processing_worker] [FFMPEG] Target: {target}")
    print(f"[processing_worker] [FFMPEG] Command: {cmd}")
    
    try:
        proc = subprocess.Popen(
            shlex.split(cmd), 
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print(f"[processing_worker] [FFMPEG] Process started (PID: {proc.pid})")
        return proc
    except Exception as e:
        print(f"[processing_worker] [ERROR] Failed to spawn FFmpeg: {e}")
        raise


def run_worker(src, target, camera_id, model_path=None, camera_name="Unknown"):
    cap = cv2.VideoCapture(src)
    if not cap.isOpened():
        print(f"processing_worker: failed to open source: {src}")
        return 1

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 640)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 360)
    fps = int(cap.get(cv2.CAP_PROP_FPS) or 15)

    ff = start_ffmpeg_push(width, height, fps, target)
    model = None
    
    # Wait briefly for RTSP connection to stabilize
    print(f"[processing_worker] [INIT] Waiting for RTSP connection to stabilize...")
    time.sleep(1)
    
    # Initialize person trackers
    active_trackers = {}
    next_tracker_id = 0
    
    if YOLO and model_path:
        try:
            # Detect if it's an OpenVINO model and use appropriate device
            import os
            is_ov_model = os.path.isdir(model_path) and any(
                p.endswith('.xml') or p.endswith('.bin')
                for p in os.listdir(model_path)
            )
            # For OpenVINO models, pass 'cpu' to avoid CUDA errors,
            # OPENVINO_DEVICE env var controls actual device (CPU/GPU/HETERO:GPU,CPU)
            device = 'cpu' if is_ov_model else 'cpu'
            model = YOLO(model_path, task='detect')
            ov_device = os.environ.get('OPENVINO_DEVICE') or os.environ.get('DEVICE') or 'HETERO:GPU,CPU'
            try:
                has_cuda = model.device.type != 'cpu' if hasattr(model, 'device') else False
                actual_device = 'GPU' if has_cuda else 'CPU'
            except:
                actual_device = 'UNKNOWN'
            print(f"[processing_worker] [AI] Activity detection model loaded (OpenVINO={is_ov_model}, configured={ov_device}, actual={actual_device}) for camera {camera_id}")
            print(f"[processing_worker] 🟢 ACTIVITY DETECTION ENABLED for camera {camera_id} using {actual_device}")
            if hasattr(model, 'names'):
                activities = list(model.names.values())
                print(f"[processing_worker] [DEBUG] Detectable activities: {', '.join(activities)}")
                print(f"[processing_worker] [DEBUG] ⚠️ Fall Detection: RED | Lying Down: BROWN | Sitting/Eating: GREEN | Standing: GREEN | Walking: BLUE")
        except Exception as e:
            print(f"[processing_worker] ❌ failed to load activity detection model: {e}")
            model = None
    else:
        print(f"[processing_worker] 🔴 ACTIVITY DETECTION DISABLED for camera {camera_id} (relay mode, pass-through)")

    running = True

    def _sigterm(signum, frame):
        nonlocal running
        running = False

    signal.signal(signal.SIGTERM, _sigterm)
    signal.signal(signal.SIGINT, _sigterm)

    frame_counter = 0  # Counter for frame caching

    try:
        while running:
            ret, frame = cap.read()
            if not ret:
                time.sleep(0.1)
                continue
            
            frame_counter += 1
            detection_count = 0

            if model is not None:
                try:
                    current_time = time.time()
                    
                    # run inference on resized copy to keep speed
                    small = cv2.resize(frame, (640, int(640 * height / width)))
                    results = model.predict(source=small, conf=0.35, imgsz=640, verbose=False)
                    
                    # Track detections for this frame
                    detected_person_ids = set()
                    floor_detections = []  # People outside ROIs (for logging only)
                    
                    if results and len(results) > 0:
                        r = results[0]
                        raw_boxes = getattr(r, 'boxes', None)
                        if raw_boxes is not None and len(raw_boxes) > 0:
                            print(f"[processing_worker] [DEBUG] 🎯 Activity detection: {len(raw_boxes)} person activity(ies) detected")
                            
                            for i, box in enumerate(raw_boxes):
                                try:
                                    conf = float(box.conf[0]) if hasattr(box, 'conf') else 0.0
                                    cls_id = int(box.cls[0]) if hasattr(box, 'cls') else 0
                                    label = model.names.get(cls_id, f"Class {cls_id}") if hasattr(model, 'names') else f"Class {cls_id}"
                                    
                                    # Get bounding box
                                    xy = box.xyxy[0]
                                    x1_small, y1_small, x2_small, y2_small = [int(v) for v in xy]
                                    
                                    # Scale coords back to original frame size
                                    sx = frame.shape[1] / small.shape[1]
                                    sy = frame.shape[0] / small.shape[0]
                                    x1 = int(x1_small * sx)
                                    x2 = int(x2_small * sx)
                                    y1 = int(y1_small * sy)
                                    y2 = int(y2_small * sy)
                                    
                                    # Get center for distance-based tracking
                                    center_x = int((x1 + x2) / 2)
                                    center_y = int((y1 + y2) / 2)
                                    
                                    # Find closest tracker within threshold distance
                                    closest_tracker_id = None
                                    closest_distance = TRACKER_DISTANCE_THRESHOLD
                                    
                                    for tid, tracker in active_trackers.items():
                                        if tracker.box:
                                            prev_center_x = int((tracker.box[0] + tracker.box[2]) / 2)
                                            prev_center_y = int((tracker.box[1] + tracker.box[3]) / 2)
                                            distance = ((center_x - prev_center_x)**2 + (center_y - prev_center_y)**2)**0.5
                                            
                                            if distance < closest_distance:
                                                closest_distance = distance
                                                closest_tracker_id = tid
                                    
                                    # Create new tracker if no close match
                                    if closest_tracker_id is None:
                                        closest_tracker_id = next_tracker_id
                                        active_trackers[closest_tracker_id] = PersonTracker(closest_tracker_id)
                                        next_tracker_id += 1
                                    
                                    tracker = active_trackers[closest_tracker_id]
                                    detected_person_ids.add(closest_tracker_id)
                                    
                                    # ===== FALL DETECTION (INSTANT ALERT) =====
                                    if label in ["Forward Fall", "Backward Fall", "Sideward Fall"]:
                                        icon = "🚨"
                                        print(f"  {icon} Activity {i}: {label} (confidence={conf:.2%})")
                                        
                                        # Emit alert immediately
                                        asyncio.run(emit_alert_to_system(
                                            event_class_name=label,
                                            camera_id=camera_id,
                                            camera_name=camera_name,
                                            priority="CRITICAL"
                                        ))
                                        system_beep()
                                        
                                        # Update tracker for drawing
                                        tracker.update(label, current_time, (x1, y1, x2, y2))
                                        floor_detections.append((x1, y1, x2, y2, label))
                                    
                                    # ===== INACTIVITY ACTIVITIES (TIERED ALERTS) =====
                                    elif label in ["Lying Down", "Sitting", "Eating"]:
                                        print(f"  {label} Activity {i}: {label} (confidence={conf:.2%})")
                                        
                                        tracker.update(label, current_time, (x1, y1, x2, y2))
                                        
                                        # Check inactivity thresholds
                                        elapsed = tracker.get_elapsed(current_time)
                                        
                                        if elapsed >= INACTIVITY_HIGH_SEC and tracker.alert_state != "HIGH":
                                            asyncio.run(emit_alert_to_system(
                                                event_class_name="Inactivity (High)",
                                                camera_id=camera_id,
                                                camera_name=camera_name,
                                                priority="HIGH"
                                            ))
                                            tracker.alert_state = "HIGH"
                                            system_beep()
                                        
                                        elif elapsed >= INACTIVITY_MED_SEC and tracker.alert_state != "MEDIUM":
                                            asyncio.run(emit_alert_to_system(
                                                event_class_name="Inactivity (Medium)",
                                                camera_id=camera_id,
                                                camera_name=camera_name,
                                                priority="MEDIUM"
                                            ))
                                            tracker.alert_state = "MEDIUM"
                                            system_beep()
                                        
                                        elif elapsed >= INACTIVITY_LOW_SEC and tracker.alert_state != "LOW":
                                            asyncio.run(emit_alert_to_system(
                                                event_class_name="Inactivity (Low)",
                                                camera_id=camera_id,
                                                camera_name=camera_name,
                                                priority="LOW"
                                            ))
                                            tracker.alert_state = "LOW"
                                            system_beep()
                                    
                                    # ===== MOVEMENT ACTIVITIES (RESET TIMER) =====
                                    elif label in ["Standing", "Walking"]:
                                        icon = "🚶" if label == "Walking" else "✅"
                                        print(f"  {icon} Activity {i}: {label} (confidence={conf:.2%})")
                                        
                                        # Movement detected - clear inactivity state
                                        if tracker.alert_state is not None:
                                            print(f"[processing_worker] Tracker {closest_tracker_id}: Activity resumed ({label})")
                                        
                                        tracker.update(label, current_time, (x1, y1, x2, y2))
                                    
                                    else:
                                        print(f"  ❓ Activity {i}: {label} (confidence={conf:.2%})")
                                        tracker.update(label, current_time, (x1, y1, x2, y2))
                                    
                                    detection_count += 1
                                
                                except Exception as e:
                                    print(f"[processing_worker] [ERROR] Failed to process detection {i}: {e}")
                                    continue
                        else:
                            if frame_counter % 100 == 0:
                                print(f"[processing_worker] [DEBUG] No activities detected in this frame")
                    
                    # Remove stale trackers
                    stale_ids = [tid for tid in active_trackers if active_trackers[tid].is_stale(current_time)]
                    for tid in stale_ids:
                        print(f"[processing_worker] Lost track of person {tid}")
                        del active_trackers[tid]
                    
                    # Draw all active trackers on frame
                    for tid, tracker in active_trackers.items():
                        if tracker.box and not tracker.is_stale(current_time):
                            x1, y1, x2, y2 = tracker.box
                            elapsed = tracker.get_elapsed(current_time)
                            mins, secs = divmod(elapsed, 60)
                            time_str = f"{mins:02d}:{secs:02d}"
                            
                            # Determine color and status text based on alert state
                            if tracker.alert_state == "HIGH":
                                box_color = (0, 0, 255)  # Red
                                status_text = f"HIGH INACT [{time_str}]"
                            elif tracker.alert_state == "MEDIUM":
                                box_color = (0, 165, 255)  # Orange
                                status_text = f"MED INACT [{time_str}]"
                            elif tracker.alert_state == "LOW":
                                box_color = (0, 255, 255)  # Yellow
                                status_text = f"LOW INACT [{time_str}]"
                            elif "Fall" in (tracker.label or ""):
                                box_color = (0, 0, 255)  # Red
                                status_text = f"{tracker.label}"
                            else:
                                box_color, _ = get_activity_color(tracker.label or "Unknown")
                                status_text = f"{tracker.label or 'Tracking'} [{time_str}]"
                            
                            cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 3)
                            draw_text_outline(frame, status_text, (x1, y1 - 10), text_color=box_color)
                    
                    # Debug: Report detection counts every 100 frames
                    if frame_counter % 100 == 0:
                        if detection_count > 0:
                            print(f"[processing_worker] [DATA] Camera {camera_id} Frame {frame_counter}: {detection_count} activity(ies) detected")
                        else:
                            print(f"[processing_worker] [DATA] Camera {camera_id} Frame {frame_counter}: No activities detected")
                
                except Exception as e:
                    print(f"[processing_worker] [ERROR] YOLO inference error: {e}")
            else:
                # No model - relay mode (pass-through)
                if frame_counter % 100 == 0:
                    print(f"[processing_worker] [OFF] Camera {camera_id} Frame {frame_counter}: Relay mode (pass-through, no AI)")

            # Send the drawn frame to ffmpeg for streaming
            try:
                raw_data = frame.tobytes()
                ff.stdin.write(raw_data)
                ff.stdin.flush()  # Critical: Force data to ffmpeg immediately (prevents buffer overflow)
                
                # Monitor ffmpeg process health every 100 frames
                if frame_counter % 100 == 0:
                    poll_result = ff.poll()
                    if poll_result is not None:
                        print(f"[processing_worker] [ERROR] FFmpeg process died unexpectedly (exit code: {poll_result})")
                        # Try to read error output
                        try:
                            err_output = ff.stderr.read(500).decode('utf-8', errors='ignore')
                            if err_output:
                                print(f"[processing_worker] [ERROR] FFmpeg stderr: {err_output}")
                        except:
                            pass
                        break
                        
            except BrokenPipeError:
                print(f"[processing_worker] [ERROR] ffmpeg pipe broken for camera {camera_id}")
                # Try to capture FFmpeg error output
                try:
                    err_output = ff.stderr.read().decode('utf-8', errors='ignore')
                    if err_output:
                        print(f"[processing_worker] [ERROR] FFmpeg error output:\n{err_output[:500]}")
                except:
                    pass
                break
            except Exception as e:
                print(f"[processing_worker] [ERROR] failed to write frame to ffmpeg: {e}")

            # Cache the processed frame every 10 frames to Redis for quick retrieval
            try:
                if frame_counter % 10 == 0:
                    _, frame_jpeg = cv2.imencode('.jpg', frame)
                    RedisConnectionPool.cache_annotated_frame(camera_id, frame_jpeg.tobytes(), ttl=5)
            except Exception as e:
                print(f"processing_worker: failed to cache frame for camera {camera_id}: {e}")

        # clean shutdown
    finally:
        try:
            ff.stdin.close()
        except Exception:
            pass
        try:
            ff.terminate()
            # Wait for process to exit (max 5 seconds)
            ff.wait(timeout=5)
            print(f"[processing_worker] [CLEANUP] FFmpeg process terminated gracefully")
        except subprocess.TimeoutExpired:
            print(f"[processing_worker] [CLEANUP] FFmpeg did not exit in time, forcing kill")
            try:
                ff.kill()
                ff.wait(timeout=2)  # Wait for kill to be processed
            except Exception as e:
                print(f"[processing_worker] [CLEANUP] Error force-killing FFmpeg: {e}")
        except Exception:
            pass
        cap.release()

    return 0


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--src', required=True)
    p.add_argument('--target', required=True)
    p.add_argument('--camera_id', required=True)
    p.add_argument('--camera_name', required=False, default="Unknown")
    p.add_argument('--model', required=False)
    args = p.parse_args()
    sys.exit(run_worker(args.src, args.target, args.camera_id, args.model, args.camera_name))


if __name__ == '__main__':
    main()
