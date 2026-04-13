import asyncio
from database import db

async def clear_event_logs():
    try:
        if not db.is_connected():
            await db.connect()

        # Delete all event logs
        result = await db.eventlog.delete_many(where={})
        print(f"✓ Deleted {result} event logs from database")
        
    except Exception as e:
        print(f"✗ Error: {e}")
    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(clear_event_logs())
