#!/usr/bin/env python3
"""
Complete diagnostic for camera streaming issues
"""
import asyncio
import cv2
import redis
import time
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from database import db

async def test_database():
    """Check camera configuration in database"""
    print("\n" + "="*70)
    print("1. DATABASE CHECK")
    print("="*70)
    await db.connect()
    cameras = await db.camera.find_many()
    
    if not cameras:
        print("❌ NO CAMERAS FOUND in database")
        await db.disconnect()
        return None
    
    for cam in cameras:
        print(f"\n  Camera ID {cam.id}: {cam.cam_name}")
        print(f"    URL: {cam.stream_url}")
        print(f"    Status: {'✓ ACTIVE' if cam.cam_status else '❌ INACTIVE'}")
        if not cam.cam_status:
            print(f"    → ISSUE: Camera not active! Streaming loop won't start.")
    
    await db.disconnect()
    return cameras[0] if cameras else None

def test_rtsp_connection(camera):
    """Test direct OpenCV connection to camera"""
    print("\n" + "="*70)
    print("2. RTSP CONNECTION TEST (OpenCV)")
    print("="*70)
    
    print(f"  Testing: {camera.stream_url}")
    
    os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|timeout;5000000"
    cap = cv2.VideoCapture(camera.stream_url, cv2.CAP_FFMPEG)
    
    start_time = time.time()
    ret = False
    for i in range(10):
        ret, frame = cap.read()
        if ret:
            break
        time.sleep(0.5)
    
    elapsed = time.time() - start_time
    
    if ret and frame is not None:
        print(f"  ✓ SUCCESS: Connected in {elapsed:.2f}s")
        print(f"  ✓ Frame size: {frame.shape}")
        return True
    else:
        print(f"  ❌ FAILED: No frames after {elapsed:.2f}s")
        return False
    
    cap.release()

def test_redis():
    """Check Redis connection and stored frames"""
    print("\n" + "="*70)
    print("3. REDIS CHECK")
    print("="*70)
    
    try:
        r = redis.Redis(host='redis', port=6379, db=0, decode_responses=False)
        r.ping()
        print("  ✓ Redis is running")
        
        # Check for stored frames
        frame_keys = r.keys('latest_frame*')
        print(f"  Stored frames: {len(frame_keys)} keys")
        for key in frame_keys:
            frame_data = r.get(key)
            if frame_data:
                print(f"    ✓ {key.decode()}: {len(frame_data)} bytes")
            else:
                print(f"    ❌ {key.decode()}: empty")
        
        if not frame_keys:
            print("  ⚠ No frames in Redis - streaming loop may not be running")
        
        return len(frame_keys) > 0
    except Exception as e:
        print(f"  ❌ Redis error: {e}")
        return False

def test_mjpeg_endpoint():
    """Test if MJPEG endpoint returns frames"""
    print("\n" + "="*70)
    print("4. MJPEG ENDPOINT TEST")
    print("="*70)
    
    import urllib.request
    import urllib.error
    
    try:
        url = "http://127.0.0.1:5000/video_feed?camera_id=20"
        print(f"  Testing: {url}")
        
        req = urllib.request.Request(url, headers={'Connection': 'close'})
        response = urllib.request.urlopen(req, timeout=3)
        
        # Read first frame
        data = b''
        for i in range(5):  # Read 5 chunks
            chunk = response.read(1024)
            if not chunk:
                break
            data += chunk
        
        response.close()
        
        if b'--frame' in data and b'jpg' in data:
            print(f"  ✓ MJPEG endpoint working ({len(data)} bytes)")
            return True
        else:
            print(f"  ❌ No MJPEG frames received ({len(data)} bytes, no markers)")
            return False
    except Exception as e:
        print(f"  ❌ Endpoint error: {e}")
        return False

async def main():
    print("\n" + "="*70)
    print("CAMERA STREAMING DIAGNOSTIC")
    print("="*70)
    
    # Test 1: Database
    camera = await test_database()
    if not camera:
        print("\n❌ CRITICAL: No camera in database!")
        return
    
    # Test 2: RTSP Connection
    rtsp_ok = test_rtsp_connection(camera)
    
    # Test 3: Redis
    redis_ok = test_redis()
    
    # Test 4: MJPEG
    mjpeg_ok = test_mjpeg_endpoint()
    
    # Summary
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    
    if rtsp_ok and redis_ok and mjpeg_ok:
        print("✓ Everything working! Camera should be streaming.")
    else:
        print("\nProblems found:")
        if not rtsp_ok:
            print("  ❌ OpenCV can't connect to camera - check RTSP URL and camera availability")
        if not redis_ok:
            print("  ❌ No frames in Redis - streaming loop may not have started")
        if not mjpeg_ok:
            print("  ❌ MJPEG endpoint not returning frames - check /video_feed endpoint")

if __name__ == '__main__':
    asyncio.run(main())
