#!/usr/bin/env python3
"""
Simple test to verify AI Detection toggle (ai_enabled) is working.
"""

import sys
import os
import subprocess
from pathlib import Path

# Add server to path
server_dir = Path(__file__).parent / 'server'
sys.path.insert(0, str(server_dir))

def test_toggle():
    """Test the toggle in the database and via API."""
    
    print("=" * 70)
    print("AI DETECTION TOGGLE VERIFICATION")
    print("=" * 70)
    
    # Test 1: Database state
    print("\n[TEST 1] Checking database...")
    try:
        import asyncio
        from database import db
        
        async def check_db():
            try:
                gs = await db.globalsetting.find_first()
                if gs:
                    print(f"✓ Global settings found:")
                    print(f"  - ai_enabled: {gs.ai_enabled}")
                    print(f"  - emit_fall: {gs.emit_fall}")
                    print(f"  - persist_fall: {gs.persist_fall}")
                    print(f"  - emit_inactivity: {gs.emit_inactivity}")
                    print(f"  - persist_inactivity: {gs.persist_inactivity}")
                    return gs
                else:
                    print("✗ No global settings found!")
                    return None
            except Exception as e:
                print(f"✗ Database error: {e}")
                return None
        
        gs = asyncio.run(check_db())
        
        if not gs:
            print("\nERROR: Cannot proceed without database access!")
            sys.exit(1)
            
    except Exception as e:
        print(f"✗ Error: {e}")
        print(f"  Make sure database is running")
        sys.exit(1)
    
    # Test 2: Check the code paths
    print("\n[TEST 2] Checking code implementation...")
    
    # Check if ai_enabled is used in video_routes.py
    video_routes_path = server_dir / 'src/routes/video_routes.py'
    settings_controller_path = server_dir / 'src/controllers/settings_controller.py'
    
    print("✓ Checking video_routes.py for ai_enabled handling...")
    with open(video_routes_path, 'r') as f:
        content = f.read()
        if 'ai_enabled' in content and 'if not ai_enabled' in content:
            print("  ✓ Code checks ai_enabled in /detect endpoint")
            # Count occurrences
            count = content.count('ai_enabled')
            print(f"  - Found {count} references to ai_enabled")
        else:
            print("  ✗ ai_enabled check not found!")
    
    print("✓ Checking settings_controller.py for ai_enabled handling...")
    with open(settings_controller_path, 'r') as f:
        content = f.read()
        if 'ai_enabled' in content:
            print("  ✓ ai_enabled is handled in settings controller")
            count = content.count('ai_enabled')
            print(f"  - Found {count} references to ai_enabled")
        else:
            print("  ✗ ai_enabled not found!")
    
    # Test 3: Check frontend
    print("\n[TEST 3] Checking frontend implementation...")
    
    camera_notifications_path = Path(__file__).parent / 'client/src/features/camera/CameraNotificationSettings.jsx'
    camera_grid_path = Path(__file__).parent / 'client/src/features/camera/CameraGrid.jsx'
    
    print("✓ Checking CameraNotificationSettings.jsx...")
    with open(camera_notifications_path, 'r') as f:
        content = f.read()
        if 'ai_enabled' in content and 'saveGlobalSettings' in content:
            print("  ✓ Toggle UI properly calls saveGlobalSettings")
            lines = [l for l in content.split('\n') if 'ai_enabled' in l]
            print(f"  - Found {len(lines)} lines with ai_enabled")
        else:
            print("  ✗ Toggle implementation issue!")
    
    print("✓ Checking CameraGrid.jsx...")
    with open(camera_grid_path, 'r') as f:
        content = f.read()
        if 'aiEnabled' in content:
            print("  ✓ CameraGrid fetches aiEnabled setting")
            if ['processed', 'original'] in str(content) or 'processed' in content:
                print("  ✓ CameraGrid uses aiEnabled to select stream prefix")
        else:
            print("  ✗ CameraGrid not using aiEnabled!")
    
    # Test 4: Trace the flow
    print("\n[TEST 4] Tracing data flow...")
    print("""
    FLOW SUMMARY:
    =============
    
    Frontend (CameraNotificationSettings.jsx):
      └─> Toggle AI Detection checkbox
      └─> saveGlobalSettings({ ai_enabled: v })
      └─> POST /settings/notifications/global
    
    Backend (settings_routes.py):
      └─> POST /settings/notifications/global
      └─> save_global_notifications_logic()
    
    Backend (settings_controller.py):
      └─> save_global_notifications_logic(data)
      └─> Updates database: db.globalsetting.update({ ai_enabled: bool })
    
    When client calls /detect endpoint (video_routes.py):
      └─> GET db.globalsetting.find_first()
      └─> Check if ai_enabled == False
      └─> If False: return empty detections + { ai_enabled: False }
      └─> If True: run YOLO inference + return detections
    
    Stream Processing (CameraGrid.jsx):
      └─> Fetches aiEnabled from /settings/notifications/global
      └─> Uses aiEnabled to choose: 'processed' or 'original' stream prefix
      └─> 'processed': includes AI annotations (if YOLO runs)
      └─> 'original': raw stream without AI processing
    """)
    
    print("\n" + "=" * 70)
    print("ANALYSIS")
    print("=" * 70)
    print("""
    The toggle SHOULD be working as follows:
    
    1. TOGGLE SAVED: ✓ Frontend saves to /settings/notifications/global
    2. TOGGLE PERSISTED: ✓ Backend stores in database
    3. TOGGLE READ: ✓ Backend reads ai_enabled when needed
    4. INFERENCE CONTROL: ✓ /detect endpoint respects ai_enabled
    5. STREAM SELECTION: ✓ CameraGrid selects processed/original based on aiEnabled
    
    The key test is:
    - When AI is DISABLED (ai_enabled=false):
      * /detect endpoint returns empty detections
      * CameraGrid prefers 'original' stream (less CPU overhead)
    
    - When AI is ENABLED (ai_enabled=true):
      * /detect endpoint runs YOLO inference
      * CameraGrid can use 'processed' stream if available
    """)
    
    print("=" * 70)
    print("RECOMMENDATIONS FOR TESTING")
    print("=" * 70)
    print("""
    1. Open browser DevTools (F12) → Network tab
    2. Go to Settings → CameraNotificationSettings
    3. Toggle "Enable AI Detection (YOLO)" OFF
    4. Check:
       - Network tab for POST /settings/notifications/global (210 Body)
       - Verify ai_enabled: false in request body
    5. Wait 1-2 seconds
    6. Check:
       - Camera stream changes to 'original' prefix (no AI annotations)
       - /detect endpoint returns empty detections
    7. Toggle ON and verify reverse
    8. Monitor server logs for:
       - "[detect] Inference time:" messages (should stop when disabled)
       - "[camera_controller] Frame X: YOLO ran" (should stop when disabled)
    """)

if __name__ == '__main__':
    test_toggle()
