import asyncio
from database import db

async def fix():
    await db.connect()
    
    print("=" * 70)
    print("CLEANING DATABASE AND ACTIVATING REAL CAMERA")
    print("=" * 70)
    
    # Find ALL cameras
    all_cameras = await db.camera.find_many()
    print(f"\nFound {len(all_cameras)} cameras total\n")
    
    # Delete all .local and localhost cameras
    for cam in all_cameras:
        if '.local' in cam.stream_url or 'localhost' in cam.stream_url.lower():
            print(f"DELETE: {cam.cam_name} (URL: {cam.stream_url})")
            await db.camera.delete(where={'id': cam.id})
    
    # Now find and activate the real camera
    print("\nSearching for real camera...")
    real_cam = await db.camera.find_first(
        where={'stream_url': {'contains': '192.168.254.211'}}
    )
    
    if real_cam:
        print(f"Found: {real_cam.cam_name} (ID {real_cam.id})")
        print(f"  URL: {real_cam.stream_url}")
        print(f"  Current status: {real_cam.cam_status}")
        
        # Activate it
        updated = await db.camera.update(
            where={'id': real_cam.id},
            data={'cam_status': True}
        )
        print(f"  ✓ Set to ACTIVE")
    else:
        print("❌ No camera with 192.168.254.211 found!")
        print("   Create it first in the Management tab")
    
    # Show final state
    remaining = await db.camera.find_many()
    print(f"\n✓ Final state: {len(remaining)} active camera(s)")
    for cam in remaining:
        print(f"  - {cam.cam_name}: {cam.stream_url} (Active: {cam.cam_status})")
    
    await db.disconnect()

asyncio.run(fix())
