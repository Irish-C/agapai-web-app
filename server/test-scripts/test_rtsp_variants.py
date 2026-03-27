#!/usr/bin/env python3
import cv2
import time
import os

print("Testing different RTSP formats...")
print("=" * 60)

urls = [
    ("Original", "rtsp://admin:agapai143@192.168.254.211:554/cam/realmonitor?channel=1&subtype=1"),
    ("No auth", "rtsp://192.168.254.211:554/cam/realmonitor?channel=1&subtype=1"),
    ("Different user", "rtsp://root:agapai143@192.168.254.211:554/cam/realmonitor?channel=1&subtype=1"),
    ("Just admin", "rtsp://admin@192.168.254.211:554/cam/realmonitor?channel=1&subtype=1"),
]

os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|timeout;5000000"

for name, url in urls:
    print(f"\n[{name}]")
    print(f"  {url}")
    
    cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
    
    timeout = 3
    start = time.time()
    frame_received = False
    
    while time.time() - start < timeout:
        ret, frame = cap.read()
        if ret and frame is not None:
            frame_received = True
            elapsed = time.time() - start
            print(f"  ✓ SUCCESS in {elapsed:.2f}s - Frame: {frame.shape}")
            break
        time.sleep(0.2)
    
    if not frame_received:
        elapsed = time.time() - start
        print(f"  ✗ Failed after {elapsed:.2f}s")
    
    cap.release()

print("\n" + "=" * 60)
print("If none work, check your camera's actual credentials:")
print("  - Check the camera's label or manual")
print("  - Login to camera's web interface to verify")
print("  - Default Dahua is often admin/12345")
