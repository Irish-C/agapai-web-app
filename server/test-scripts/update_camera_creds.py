import asyncio
from database import db

async def update_camera_url():
    await db.connect()
    
    # Find the camera with 192.168.254.211
    cam = await db.camera.find_first(
        where={'stream_url': {'contains': '192.168.254.211'}}
    )
    
    if cam:
        old_url = cam.stream_url
        new_url = "rtsp://postgres:agapai321@192.168.254.211:554/cam/realmonitor?channel=1&subtype=1"
        
        print(f"Updating camera: {cam.cam_name}")
        print(f"  Old: {old_url}")
        print(f"  New: {new_url}")
        
        updated = await db.camera.update(
            where={'id': cam.id},
            data={'stream_url': new_url, 'cam_status': True}
        )
        
        print(f"  ✓ Updated successfully!")
    else:
        print("Camera not found!")
    
    await db.disconnect()

asyncio.run(update_camera_url())
