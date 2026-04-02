import asyncio
from database import db

async def check():
    await db.connect()
    cams = await db.camera.find_many()
    print(f"Cameras: {len(cams)}")
    for c in cams:
        print(f"  ID {c.id}: {c.cam_name} | URL: {c.stream_url} | Active: {c.cam_status}")
    await db.disconnect()

asyncio.run(check())
