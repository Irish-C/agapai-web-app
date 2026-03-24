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
    # ...existing code...
