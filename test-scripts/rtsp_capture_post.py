#!/usr/bin/env python3
"""
Capture RTSP frames with OpenCV and POST JPEGs to the server `/detect` endpoint.

Usage:
  pip install opencv-python requests
  RTSP_URL="rtsp://user:pass@192.168.254.211:554/..." DETECT_URL="http://localhost:8000/detect" CAMERA_ID=cam1 python test-scripts/rtsp_capture_post.py

Environment variables:
  RTSP_URL   - rtsp input URL (required)
  DETECT_URL - full URL to detect endpoint (default: http://localhost:8000/detect)
  CAMERA_ID  - camera id to send as X-Camera-Id header (default: cam1)
  FPS        - target frames per second to POST (default: 1)
  QUALITY    - JPEG quality 1-100 (default: 80)
  AUTH_TOKEN - optional bearer token for Authorization header

This script is intentionally simple and robust for deployment on the server.
"""
import os
import sys
import time
import traceback

import cv2
import requests


def env(key, default=None):
    return os.environ.get(key, default)


def main():
    rtsp_url = env('RTSP_URL')
    if not rtsp_url:
        print('RTSP_URL environment variable is required', file=sys.stderr)
        sys.exit(2)

    detect_url = env('DETECT_URL', 'http://localhost:8000/detect')
    cam_id = env('CAMERA_ID', 'cam1')
    fps = float(env('FPS', '1'))
    quality = int(env('QUALITY', '80'))
    token = env('AUTH_TOKEN')

    interval = 1.0 / max(0.1, fps)

    print(f'[rtsp_post] RTSP={rtsp_url} -> {detect_url} (cam={cam_id}) fps={fps} q={quality}')

    cap = cv2.VideoCapture(rtsp_url)
    if not cap.isOpened():
        print('[rtsp_post] Failed to open RTSP stream', file=sys.stderr)
        sys.exit(3)

    try:
        while True:
            t0 = time.time()
            ok, frame = cap.read()
            if not ok or frame is None:
                print('[rtsp_post] read failed, reconnecting in 1s')
                time.sleep(1.0)
                try:
                    cap.release()
                except Exception:
                    pass
                cap = cv2.VideoCapture(rtsp_url)
                time.sleep(0.5)
                continue

            # encode to JPEG
            try:
                ret, buf = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
                if not ret:
                    print('[rtsp_post] failed to encode jpeg')
                    time.sleep(0.1)
                    continue
                data = buf.tobytes()
            except Exception:
                print('[rtsp_post] exception encoding frame')
                traceback.print_exc()
                time.sleep(0.5)
                continue

            headers = {
                'Content-Type': 'image/jpeg',
                'X-Camera-Id': cam_id,
                'X-Request-Ts': str(int(time.time() * 1000)),
            }
            if token:
                headers['Authorization'] = f'Bearer {token}'

            try:
                resp = requests.post(detect_url, data=data, headers=headers, timeout=10)
                if resp.status_code == 200:
                    print(f'[rtsp_post] posted frame OK ({len(data)} bytes)')
                else:
                    print(f'[rtsp_post] detect responded {resp.status_code}: {resp.text[:200]}')
            except Exception as e:
                print(f'[rtsp_post] POST error: {e}')

            # wait to maintain target FPS
            elapsed = time.time() - t0
            to_sleep = interval - elapsed
            if to_sleep > 0:
                time.sleep(to_sleep)

    finally:
        try:
            cap.release()
        except Exception:
            pass


if __name__ == '__main__':
    main()
