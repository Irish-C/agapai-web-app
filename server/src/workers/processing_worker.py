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
            model = YOLO(model_path)
            print("processing_worker: YOLO model loaded")
        except Exception as e:
            print(f"processing_worker: failed to load YOLO model: {e}")
            model = None

    running = True

    def _sigterm(signum, frame):
        nonlocal running
        running = False

    signal.signal(signal.SIGTERM, _sigterm)
    signal.signal(signal.SIGINT, _sigterm)

    try:
        while running:
            ret, frame = cap.read()
            if not ret:
                time.sleep(0.1)
                continue

            if model is not None:
                try:
                    # run inference on resized copy to keep speed
                    small = cv2.resize(frame, (640, int(640 * height / width)))
                    results = model.predict(source=small, conf=0.35, imgsz=640, verbose=False)
                    if results and len(results) > 0:
                        r = results[0]
                        boxes = getattr(r, 'boxes', None)
                        if boxes is not None:
                            for box in boxes:
                                try:
                                    xy = box.xyxy[0]
                                    x1, y1, x2, y2 = [int(v) for v in xy]
                                    # scale coords back to original frame size
                                    sx = frame.shape[1] / small.shape[1]
                                    sy = frame.shape[0] / small.shape[0]
                                    x1 = int(x1 * sx); x2 = int(x2 * sx)
                                    y1 = int(y1 * sy); y2 = int(y2 * sy)
                                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0,255,0), 2)
                                except Exception:
                                    continue
                except Exception:
                    pass

            try:
                ff.stdin.write(frame.tobytes())
            except Exception:
                break

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
