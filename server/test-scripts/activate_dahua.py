import asyncio
from database import db

async def fix():
    await db.connect()
    
    # Find and activate the camera with 192.168.254.211
    cam = await db.camera.find_first(where={'stream_url': {'contains': '192.168.254.211'}})
    
    if cam:
        print(f"Found: {cam.cam_name} (ID {cam.id})")
        print(f"  Current status: {cam.cam_status}")
        
        # Activate it
        updated = await db.camera.update(
            where={'id': cam.id},
            data={'cam_status': True}
        )
        print(f"  ✓ Updated to: {updated.cam_status}")
    else:
        print("Camera not found!")
    
    await db.disconnect()

asyncio.run(fix())
