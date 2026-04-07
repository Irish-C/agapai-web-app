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


def start_ffmpeg_push(width, height, fps, target):
    cmd = (
        f"ffmpeg -f rawvideo -pixel_format bgr24 -video_size {width}x{height} -framerate {fps} -i - "
        f"-c:v libx264 -preset veryfast -tune zerolatency -pix_fmt yuv420p -f rtsp {shlex.quote(target)}"
    )
    return subprocess.Popen(shlex.split(cmd), stdin=subprocess.PIPE)


def run_worker(src, target, camera_id, model_path=None):
    cap = cv2.VideoCapture(src)
    if not cap.isOpened():
        print(f"processing_worker: failed to open source: {src}")
        return 1

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 640)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 360)
    fps = int(cap.get(cv2.CAP_PROP_FPS) or 15)

    ff = start_ffmpeg_push(width, height, fps, target)
    model = None
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
                    # run inference on resized copy to keep speed
                    small = cv2.resize(frame, (640, int(640 * height / width)))
                    results = model.predict(source=small, conf=0.35, imgsz=640, verbose=False)
                    
                    # Debug: Log raw results
                    if results and len(results) > 0:
                        r = results[0]
                        raw_boxes = getattr(r, 'boxes', None)
                        if raw_boxes is not None:
                            if len(raw_boxes) > 0:
                                print(f"[processing_worker] [DEBUG] 🎯 Activity detection: {len(raw_boxes)} person activity(ies) detected")
                                for i, box in enumerate(raw_boxes):
                                    conf = float(box.conf[0]) if hasattr(box, 'conf') else 0.0
                                    cls_id = int(box.cls[0]) if hasattr(box, 'cls') else 0
                                    label = model.names.get(cls_id, f"Class {cls_id}") if hasattr(model, 'names') else f"Class {cls_id}"
                                    icon = "🚨" if label in ["Forward Fall", "Backward Fall", "Sideward Fall"] else "👁️"
                                    print(f"  {icon} Activity {i}: {label} (confidence={conf:.2%})")
                    else:
                        if frame_counter % 100 == 0:
                            print(f"[processing_worker] [DEBUG] No activities detected in this frame")
                    
                    if results and len(results) > 0:
                        r = results[0]
                        boxes = getattr(r, 'boxes', None)
                        if boxes is not None:
                            for box in boxes:
                                detection_count += 1
                                try:
                                    xy = box.xyxy[0]
                                    x1, y1, x2, y2 = [int(v) for v in xy]
                                    conf = float(box.conf[0]) if hasattr(box, 'conf') else 0.0
                                    cls_id = int(box.cls[0]) if hasattr(box, 'cls') else 0
                                    
                                    # scale coords back to original frame size
                                    sx = frame.shape[1] / small.shape[1]
                                    sy = frame.shape[0] / small.shape[0]
                                    x1 = int(x1 * sx); x2 = int(x2 * sx)
                                    y1 = int(y1 * sy); y2 = int(y2 * sy)
                                    
                                    # Get class label and activity-specific color
                                    label = model.names.get(cls_id, f"Class {cls_id}") if hasattr(model, 'names') else f"Class {cls_id}"
                                    box_color, text_color = get_activity_color(label)
                                    
                                    # Draw bounding box with activity-specific color
                                    cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 3)  # Thicker lines for visibility
                                    
                                    # Draw label with confidence and activity type
                                    label_text = f"{label} {conf:.0%}"
                                    draw_text_outline(frame, label_text, (x1, y1 - 10), text_color, box_color)
                                except Exception as e:
                                    print(f"[processing_worker] [ERROR] Failed to draw box: {e}")
                                    continue
                except Exception as e:
                    print(f"[processing_worker] [ERROR] YOLO inference error: {e}")
                
                # Debug: Report detection counts every 100 frames
                if frame_counter % 100 == 0:
                    if detection_count > 0:
                        print(f"[processing_worker] [DATA] Camera {camera_id} Frame {frame_counter}: {detection_count} activity(ies) detected")
                    else:
                        print(f"[processing_worker] [DATA] Camera {camera_id} Frame {frame_counter}: No activities detected")
            else:
                # No model - relay mode (pass-through)
                if frame_counter % 100 == 0:
                    print(f"[processing_worker] [OFF] Camera {camera_id} Frame {frame_counter}: Relay mode (pass-through, no AI)")

            # Send the drawn frame to ffmpeg for streaming
            try:
                raw_data = frame.tobytes()
                ff.stdin.write(raw_data)
            except BrokenPipeError:
                print(f"[processing_worker] [ERROR] ffmpeg pipe broken for camera {camera_id}")
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
        except Exception:
            pass
        cap.release()

    return 0


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--src', required=True)
    p.add_argument('--target', required=True)
    p.add_argument('--camera_id', required=True)
    p.add_argument('--model', required=False)
    args = p.parse_args()
    sys.exit(run_worker(args.src, args.target, args.camera_id, args.model))


if __name__ == '__main__':
    main()
