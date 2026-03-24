import asyncio
from database import db

async def check():
    await db.connect()
    # ...existing code...
    await db.disconnect()

asyncio.run(check())
