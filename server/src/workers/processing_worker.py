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
        
        # Try Intel Quick Sync first (best for iGPU - h264_qsv)
        if 'h264_qsv' in encoders_output:
            print("[processing_worker] [ENCODER] ✓ Using Intel Quick Sync (h264_qsv) for iGPU encoding")
            print("[processing_worker] [ENCODER]   - Encoding time: 5-10ms/frame")
            print("[processing_worker] [ENCODER]   - Resolution: Full (1920×1080)")
            encoder_opts = "-c:v h264_qsv -preset fast -load_plugin hevc_hw"
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
                print(f"[processing_worker] [ERROR] ffmpeg pipe broken for camera {camera_id} - stdin buffer exhausted")
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
