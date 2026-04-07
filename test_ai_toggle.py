#!/usr/bin/env python3
"""
Test script to verify that the AI Detection toggle (ai_enabled) is working correctly.

This script:
1. Verifies the database has the ai_enabled setting
2. Tests the toggle by:
   - Disabling AI detection
   - Calling the /detect endpoint
   - Verifying empty detections are returned
   - Enabling AI detection
   - Calling the /detect endpoint with an image
   - Verifying detections are returned (if objects in image)
"""

import asyncio
import aiohttp
import sys
import os
from pathlib import Path

# Add server path to sys.path
server_dir = Path(__file__).parent / 'server'
sys.path.insert(0, str(server_dir))

async def test_ai_toggle():
    """Test the AI toggle functionality."""
    
    print("=" * 70)
    print("AI DETECTION TOGGLE VERIFICATION TEST")
    print("=" * 70)
    
    # 1. Check database state
    print("\n[1] Checking database state...")
    try:
        from database import db
        gs = await db.globalsetting.find_first()
        if gs:
            print(f"    Current ai_enabled: {gs.ai_enabled}")
        else:
            print("    No global settings found in database")
    except Exception as e:
        print(f"    ERROR: {e}")
        return
    
    # 2. Test disabling AI
    print("\n[2] Testing DISABLE AI DETECTION...")
    try:
        await db.globalsetting.update_many(
            data={'ai_enabled': False}
        )
        gs = await db.globalsetting.find_first()
        print(f"    After disable: ai_enabled = {gs.ai_enabled if gs else 'N/A'}")
        if gs and not gs.ai_enabled:
            print("    ✓ Successfully disabled AI detection")
        else:
            print("    ✗ FAILED to disable AI detection")
    except Exception as e:
        print(f"    ERROR setting ai_enabled=False: {e}")
    
    # 3. Fetch settings API to verify toggle is reflected
    print("\n[3] Testing GET /settings/notifications/global endpoint...")
    base_url = "http://localhost:5000"
    try:
        async with aiohttp.ClientSession() as session:
            # Get token from environment or use default
            headers = {'Content-Type': 'application/json'}
            
            async with session.get(f"{base_url}/settings/notifications/global", headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    print(f"    Response: {data}")
                    if 'ai_enabled' in data:
                        print(f"    ✓ API returned ai_enabled: {data['ai_enabled']}")
                    else:
                        print("    ✗ API response missing ai_enabled field")
                elif resp.status == 401:
                    print("    ⚠ Need authentication (401 Unauthorized)")
                elif resp.status == 403:
                    print("    ⚠ Need admin access (403 Forbidden)")
                else:
                    print(f"    ✗ Unexpected status: {resp.status}")
    except Exception as e:
        print(f"    Connection error: {e}")
    
    # 4. Test /detect endpoint with AI disabled
    print("\n[4] Testing /detect endpoint with AI DISABLED...")
    try:
        # Create a test image (small JPEG)
        import cv2
        import numpy as np
        test_image = np.zeros((100, 100, 3), dtype=np.uint8)
        test_image[30:70, 30:70] = [0, 255, 0]  # Green square
        _, jpeg_data = cv2.imencode('.jpg', test_image)
        
        async with aiohttp.ClientSession() as session:
            headers = {'Content-Type': 'image/jpeg'}
            async with session.post(f"{base_url}/detect", data=jpeg_data.tobytes(), headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    detections = data.get('detections', [])
                    ai_enabled = data.get('ai_enabled', None)
                    print(f"    Response: detections={len(detections)}, ai_enabled={ai_enabled}")
                    
                    if ai_enabled == False and len(detections) == 0:
                        print("    ✓ Correctly returned empty detections when AI disabled")
                    elif ai_enabled == False:
                        print(f"    ✗ AI disabled but returned {len(detections)} detections (should be 0)")
                    else:
                        print(f"    ? Unclear: ai_enabled={ai_enabled}, detections={len(detections)}")
                else:
                    print(f"    Status: {resp.status}")
                    text = await resp.text()
                    print(f"    Response: {text[:200]}")
    except Exception as e:
        print(f"    Error: {e}")
    
    # 5. Enable AI again
    print("\n[5] Testing ENABLE AI DETECTION...")
    try:
        await db.globalsetting.update_many(
            data={'ai_enabled': True}
        )
        gs = await db.globalsetting.find_first()
        print(f"    After enable: ai_enabled = {gs.ai_enabled if gs else 'N/A'}")
        if gs and gs.ai_enabled:
            print("    ✓ Successfully enabled AI detection")
        else:
            print("    ✗ FAILED to enable AI detection")
    except Exception as e:
        print(f"    ERROR setting ai_enabled=True: {e}")
    
    # 6. Test /detect endpoint with AI enabled
    print("\n[6] Testing /detect endpoint with AI ENABLED...")
    try:
        import cv2
        import numpy as np
        test_image = np.zeros((100, 100, 3), dtype=np.uint8)
        test_image[30:70, 30:70] = [0, 255, 0]  # Green square
        _, jpeg_data = cv2.imencode('.jpg', test_image)
        
        async with aiohttp.ClientSession() as session:
            headers = {'Content-Type': 'image/jpeg'}
            async with session.post(f"{base_url}/detect", data=jpeg_data.tobytes(), headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    detections = data.get('detections', [])
                    ai_enabled = data.get('ai_enabled', None)
                    print(f"    Response: detections={len(detections)}, ai_enabled={ai_enabled}")
                    
                    if ai_enabled == True:
                        print("    ✓ Correctly returned ai_enabled=True")
                        if len(detections) == 0:
                            print("    ℹ No detections in test image (expected - plain image)")
                        else:
                            print(f"    ℹ Returned {len(detections)} detections")
                    else:
                        print(f"    ✗ ai_enabled={ai_enabled} (expected: True)")
                else:
                    print(f"    Status: {resp.status}")
                    text = await resp.text()
                    print(f"    Response: {text[:200]}")
    except Exception as e:
        print(f"    Error: {e}")
    
    print("\n" + "=" * 70)
    print("TEST COMPLETE")
    print("=" * 70)

if __name__ == '__main__':
    asyncio.run(test_ai_toggle())
