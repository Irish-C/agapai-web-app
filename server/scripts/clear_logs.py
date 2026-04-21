#!/usr/bin/env python3
"""Clear all event logs from the database"""

import asyncio
import sys
import os

# Add server directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

async def clear_event_logs():
    try:
        from database import db
        
        # Connect to database
        if not db.is_connected():
            await db.connect()
        
        # Get all event logs with their snapshots
        all_events = await db.eventlog.find_many(include={"snapshots": True})
        
        # Delete associated snapshot files
        snapshots_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static', 'snapshots')
        deleted_files = 0
        
        for event in all_events:
            for snapshot in getattr(event, "snapshots", []):
                snapshot_path = os.path.join(snapshots_dir, snapshot.filename)
                try:
                    if os.path.exists(snapshot_path):
                        os.remove(snapshot_path)
                        deleted_files += 1
                except Exception as file_error:
                    print(f"⚠ Warning: Could not delete snapshot file {snapshot['filename']}: {file_error}")
        
        # Delete all event logs
        deleted_count = await db.eventlog.delete_many()
        
        print(f"✓ Successfully deleted {deleted_count} event logs from database")
        print(f"✓ Successfully deleted {deleted_files} snapshot files")
        
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
