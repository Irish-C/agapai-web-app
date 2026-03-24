import asyncio
from database import db

async def update_camera_url():
    await db.connect()
    # ...existing code...
    await db.disconnect()

asyncio.run(update_camera_url())
