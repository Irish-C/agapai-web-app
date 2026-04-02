import asyncio
from database import db

async def fix():
    await db.connect()
    # ...existing code...
    await db.disconnect()

asyncio.run(fix())
