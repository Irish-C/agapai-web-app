#!/usr/bin/env python3
"""Clear all event logs from the database"""

import asyncio
import sys
import os

# Add server directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def clear_event_logs():
    try:
        from database import db
        
        # Connect to database
        if not db.is_connected():
            await db.connect()
        
        # Delete all event logs
        deleted_count = await db.eventlog.delete_many()
        
        print(f"✓ Successfully deleted {deleted_count} event logs from database")
        
        await db.disconnect()
        return True
        
    except Exception as e:
        print(f"✗ Error clearing logs: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = asyncio.run(clear_event_logs())
    sys.exit(0 if success else 1)
