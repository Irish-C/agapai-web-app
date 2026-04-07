"""
Async Producer/Consumer IP Camera Monitor

This script refactors the single-threaded monitor into a low-latency
producer/consumer architecture:

- Capture thread (producer): continuously reads latest frames from the
  camera and writes them into a latest-frame container (only the newest
  frame is kept).
- Async inference worker (consumer): awaits new frames, runs model
  inference via `asyncio.to_thread` (keeps heavy compute off the loop),
  updates trackers, and produces a display frame to be shown by the
  main event loop.

Benefits: avoids backlog of frames, always infers on the most recent
frame, and keeps UI responsive.

Usage: install dependencies (ultralytics, opencv-python), then run:
    python test-scripts/async_monitor.py
"""

import asyncio
import threading
import time
import uuid
import os
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from ultralytics import YOLO

# -----------------------------
# Configuration
# -----------------------------
RTSP_URL = "rtsp://admin:agapai143@192.168.254.211:554/cam/realmonitor?channel=1&subtype=0"
MODEL_PATH = r"/path/to/best_openvino_model"  # update to your model path
MAX_ROIS = 30
CAP_BUFFERSIZE = 2
PATIENCE_SECONDS = 3.0
INACTIVITY_LOW_SEC = 300
INACTIVITY_MED_SEC = 900
INACTIVITY_HIGH_SEC = 1800

# Inference scheduling (tuning knobs)
# - INFER_MAX_FPS: maximum inference rate. Set to None to infer every frame.
# - SKIP_FRAMES: skip N frames between inferences (coarse control). 0 = no skipping.
# Both are applied: a frame is inferred only when it passes both checks.
INFER_MAX_FPS = 5.0
SKIP_FRAMES = 0
# Adaptive scheduling
# - EMA_ALPHA: smoothing factor for inference latency estimation
# - ADAPTIVE_SAFETY: multiply inferred latency to leave headroom
EMA_ALPHA = 0.2
ADAPTIVE_SAFETY = 1.25

# -----------------------------
# Utility: latest-frame container
# -----------------------------

class LatestFrame:
    def __init__(self):
        self.lock = threading.Lock()
        self.frame: Optional[np.ndarray] = None
        self._event = asyncio.Event()

    def set(self, frame: np.ndarray):
        with self.lock:
            # store a copy to avoid concurrent modification
            self.frame = frame.copy()
        # Wake any awaiting consumer
        loop = asyncio.get_event_loop()
        loop.call_soon_threadsafe(self._event.set)

    async def wait_for_frame(self):
        await self._event.wait()

    def get_latest(self) -> Optional[np.ndarray]:
        with self.lock:
            f = None if self.frame is None else self.frame.copy()
            # clear event but keep frame available until overwritten
        self._event.clear()
        return f


# -----------------------------
# Capture thread
# -----------------------------

def capture_loop(rtsp_url: str, latest: LatestFrame, stop_event: threading.Event):
    cap = cv2.VideoCapture(rtsp_url)
    # minimize internal buffering for low latency
    try:
        cap.set(cv2.CAP_PROP_BUFFERSIZE, CAP_BUFFERSIZE)
    except Exception:
        pass

    print(f"[capture] Started capture thread -> {rtsp_url}")
    while not stop_event.is_set():
        try:
            ok, frame = cap.read()
            if not ok or frame is None:
                print('[capture] failed to read frame, retrying in 1s')
                time.sleep(1)
                # attempt to re-open if needed
                try:
                    cap.release()
                except Exception:
                    pass
                cap = cv2.VideoCapture(rtsp_url)
                try:
                    cap.set(cv2.CAP_PROP_BUFFERSIZE, CAP_BUFFERSIZE)
                except Exception:
                    pass
                continue

            latest.set(frame)
            # tiny sleep yields CPU and keeps producer from tight-looping
            time.sleep(0.001)
        except Exception as e:
            print(f"[capture] exception: {e}")
            time.sleep(1)

    try:
        cap.release()
    except Exception:
        pass
    print('[capture] stopped')


# -----------------------------
# Mouse/ROI handling (main thread)
# -----------------------------

rois = []
drawing = False
temp_roi = [(0, 0), (0, 0)]

def draw_text_outline(img, text, pos, text_color=(255, 255, 255)):
    font = cv2.FONT_HERSHEY_DUPLEX
    font_scale = 0.6
    x, y = pos
    cv2.putText(img, text, (x, y), font, font_scale, (255, 255, 255), 3, cv2.LINE_AA)
    cv2.putText(img, text, (x, y), font, font_scale, text_color, 1, cv2.LINE_AA)

def update_roi(event, x, y, flags, param):
    global rois, drawing, temp_roi
    if event == cv2.EVENT_LBUTTONDOWN:
        if len(rois) < MAX_ROIS:
            drawing = True
            temp_roi = [(x, y), (x, y)]
    elif event == cv2.EVENT_MOUSEMOVE:
        if drawing:
            temp_roi[1] = (x, y)
    elif event == cv2.EVENT_LBUTTONUP:
        if drawing:
            drawing = False
            temp_roi[1] = (x, y)
            x1, x2 = min(temp_roi[0][0], temp_roi[1][0]), max(temp_roi[0][0], temp_roi[1][0])
            y1, y2 = min(temp_roi[0][1], temp_roi[1][1]), max(temp_roi[0][1], temp_roi[1][1])
            rois.append(((x1, y1), (x2, y2)))


# -----------------------------
# Inference / processing worker
# -----------------------------

async def inference_worker(latest: LatestFrame, display_holder: dict):
    # Load model once in worker thread context
    print('[infer] loading model...')
    model = YOLO(MODEL_PATH, task='detect')
    print('[infer] model loaded')

    # trackers keyed by roi index
    bed_trackers = {}

    frame_counter = 0
    last_infer_time = 0.0
    infer_interval = 1.0 / INFER_MAX_FPS if INFER_MAX_FPS and INFER_MAX_FPS > 0 else 0.0
    ema_infer_ms = 0.0

    while True:
        # Wait for a frame to be available
        await latest.wait_for_frame()
        frame = latest.get_latest()
        if frame is None:
            await asyncio.sleep(0.001)
            continue

        t0 = time.time()

        # --- Inference scheduling ---
        should_infer = True

        # Coarse skip-frames control
        if SKIP_FRAMES and SKIP_FRAMES > 0:
            if (frame_counter % (SKIP_FRAMES + 1)) != 0:
                should_infer = False

        # Adaptive interval based on EMA of inference latency
        base_interval = 1.0 / INFER_MAX_FPS if INFER_MAX_FPS and INFER_MAX_FPS > 0 else 0.0
        adaptive_interval = base_interval
        if ema_infer_ms and ema_infer_ms > 0:
            adaptive_interval = max(base_interval, (ema_infer_ms / 1000.0) * ADAPTIVE_SAFETY)

        # Rate limit by adaptive time interval
        if adaptive_interval > 0 and (t0 - last_infer_time) < adaptive_interval:
            should_infer = False

        results = None
        if should_infer:
            # Run inference in thread to not block event loop
            try:
                infer_start = time.time()
                results = await asyncio.to_thread(lambda: model.predict(frame, conf=0.5, imgsz=640, verbose=False))
                infer_end = time.time()
                infer_ms = (infer_end - infer_start) * 1000.0
                # update EMA
                if ema_infer_ms <= 0.0:
                    ema_infer_ms = infer_ms
                else:
                    ema_infer_ms = EMA_ALPHA * infer_ms + (1.0 - EMA_ALPHA) * ema_infer_ms
                last_infer_time = time.time()
            except Exception as e:
                print(f"[infer] model error: {e}")
                await asyncio.sleep(0.005)
                frame_counter += 1
                continue
        else:
            # Skip inference: reuse previous overlay if present; otherwise optionally draw a lightweight indicator
            # For skipped frames we still want to show the most recent overlay, so `display_holder['frame']` remains unchanged.
            # We increment frame counter and continue to next loop iteration after drawing a minimal FPS/indicator.
            frame_counter += 1
            # Optionally, we can still update the FPS text on a copy of the current frame
            last_overlay = display_holder.get('frame')
            if last_overlay is None:
                # show raw frame when no previous overlay exists
                display_holder['frame'] = frame
            else:
                # do nothing (keep last overlay)
                pass
            await asyncio.sleep(0)
            continue

        # Prepare mutable overlay frame
        overlay = frame.copy()
        current_time = time.time()

        # Sync trackers with rois
        keys_to_remove = [k for k in bed_trackers.keys() if k >= len(rois)]
        for k in keys_to_remove:
            del bed_trackers[k]
        for i in range(len(rois)):
            if i not in bed_trackers:
                bed_trackers[i] = {"label": None, "start_time": 0, "last_seen": 0, "box": None}

        floor_detections = []

        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                class_id = int(box.cls[0])
                label = model.names[class_id]
                center_x = int((x1 + x2) / 2)
                center_y = int((y1 + y2) / 2)

                roi_idx = -1
                for i, (tl, br) in enumerate(rois):
                    if tl[0] < center_x < br[0] and tl[1] < center_y < br[1]:
                        roi_idx = i
                        break

                if roi_idx != -1:
                    if label in ["Standing", "Walking"]:
                        continue
                    # coerce some fall labels to lying down
                    if label in ("Forward Fall", "Backward Fall", "Sideward Fall"):
                        label = "Lying Down"
                    # only accept safe bed classes
                    if label not in ("Lying Down", "Sitting", "Eating"):
                        continue

                    tracker = bed_trackers[roi_idx]
                    if tracker["label"] != label:
                        tracker["label"] = label
                        tracker["start_time"] = current_time
                    tracker["last_seen"] = current_time
                    tracker["box"] = (x1, y1, x2, y2)
                else:
                    floor_detections.append((x1, y1, x2, y2, label))

        # Draw UI: empty beds, tracked people, floor detections
        occupied_rois = set()
        for i, tracker in bed_trackers.items():
            if tracker["label"] is not None and (current_time - tracker["last_seen"] <= PATIENCE_SECONDS):
                occupied_rois.add(i)

        for i, (tl, br) in enumerate(rois):
            if i not in occupied_rois:
                cv2.rectangle(overlay, tl, br, (200, 200, 200), 1)

        # drawing in-progress ROI
        if drawing:
            cv2.rectangle(overlay, temp_roi[0], temp_roi[1], (0, 165, 255), 2)

        for i, tracker in bed_trackers.items():
            if tracker["label"] is not None:
                if current_time - tracker["last_seen"] > PATIENCE_SECONDS:
                    tracker["label"] = None
                    tracker["box"] = None
                else:
                    elapsed = int(current_time - tracker["start_time"])
                    mins, secs = divmod(elapsed, 60)
                    time_str = f"{mins:02d}:{secs:02d}"
                    x1, y1, x2, y2 = tracker["box"]
                    if elapsed >= INACTIVITY_HIGH_SEC:
                        box_color = (0, 0, 255)
                        status_text = f"HIGH INACT [{time_str}]"
                    elif elapsed >= INACTIVITY_MED_SEC:
                        box_color = (0, 165, 255)
                        status_text = f"MED INACT [{time_str}]"
                    elif elapsed >= INACTIVITY_LOW_SEC:
                        box_color = (0, 255, 255)
                        status_text = f"LOW INACT [{time_str}]"
                    else:
                        if tracker["label"] == "Lying Down":
                            box_color = (139, 69, 19)
                        else:
                            box_color = (72, 107, 18)
                        status_text = f"{tracker['label']} [{time_str}]"

                    cv2.rectangle(overlay, (x1, y1), (x2, y2), box_color, 2)
                    draw_text_outline(overlay, status_text, (x1, y1 - 8), box_color)

        for (bx1, by1, bx2, by2, label) in floor_detections:
            if label == "Lying Down":
                continue
            if label in ("Forward Fall", "Backward Fall", "Sideward Fall"):
                box_color = (0, 0, 255)
            elif label in ("Sitting", "Walking", "Standing", "Eating"):
                box_color = (72, 107, 18)
            else:
                box_color = (150, 150, 150)
            cv2.rectangle(overlay, (bx1, by1), (bx2, by2), box_color, 2)
            draw_text_outline(overlay, label, (bx1, by1 - 8), box_color)

        fps = 1.0 / max(1e-6, (time.time() - t0))
        draw_text_outline(overlay, f"FPS: {fps:.2f}", (20, overlay.shape[0] - 20), (0, 0, 0))

        # put overlay into shared holder for display by main loop
        display_holder['frame'] = overlay
        # increment frame counter and yield
        frame_counter += 1
        # very small sleep to let loop breathe
        await asyncio.sleep(0)


# -----------------------------
# Main: wiring capture thread, inference worker, and display loop
# -----------------------------

async def main():
    latest = LatestFrame()
    display_holder = {'frame': None}

    stop_event = threading.Event()
    cap_thread = threading.Thread(target=capture_loop, args=(RTSP_URL, latest, stop_event), daemon=True)
    cap_thread.start()

    # create window and mouse callback in main thread
    window_name = "Agapai Async Monitor"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, 1280, 720)
    cv2.setMouseCallback(window_name, update_roi)

    infer_task = asyncio.create_task(inference_worker(latest, display_holder))

    try:
        while True:
            frame = display_holder.get('frame')
            if frame is not None:
                cv2.imshow(window_name, frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('c'):
                if len(rois) > 0:
                    rois.pop()
                    print('Last zone removed.')
            elif key == ord('x'):
                rois.clear()
                print('ALL zones cleared!')

            await asyncio.sleep(0.01)

    finally:
        print('[main] shutting down')
        stop_event.set()
        try:
            await asyncio.wait_for(infer_task, timeout=1.0)
        except Exception:
            infer_task.cancel()
        cv2.destroyAllWindows()


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print('exiting')
