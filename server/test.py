# Create a temporary test.py
import asyncio
from database import db

async def main():
    await db.connect()
    print("✅ Successfully connected to the database!")
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())