#!/usr/bin/env python3
import cv2
import time
import os

print("Testing RTSP connection to camera...")
print("=" * 60)

url = "rtsp://admin:agapai143@192.168.254.211:554/cam/realmonitor?channel=1&subtype=1"
print(f"URL: {url}")

os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|timeout;5000000"

print("\nAttempting connection...")
cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)

timeout = 10
start = time.time()
frame_received = False

while time.time() - start < timeout:
    ret, frame = cap.read()
    if ret and frame is not None:
        frame_received = True
        elapsed = time.time() - start
        print(f"✓ SUCCESS in {elapsed:.2f}s")
        print(f"  Frame size: {frame.shape}")
        break
    time.sleep(0.5)

if not frame_received:
    elapsed = time.time() - start
    print(f"✗ FAILED after {elapsed:.2f}s - No frames received")
    print("\nPossible issues:")
    print("  1. Camera IP 192.168.254.211 is offline or unreachable")
    print("  2. RTSP URL is incorrect (check admin:agapai143 credentials)")
    print("  3. Camera requires different authentication")
    print("  4. Network connectivity issue")

cap.release()
