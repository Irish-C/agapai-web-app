#!/usr/bin/env python3
"""
Utility to reset and prepare database for testing.
Useful for development: deletes test data, keeps core data.
"""

import asyncio
import sys
from pathlib import Path

# Add server to path
server_root = Path(__file__).parent.parent.resolve()
sys.path.insert(0, str(server_root))

from database.db_setup import db

async def cleanup_test_data():
    """Remove test cameras and event logs for a clean slate."""
    try:
        # Don't auto-connect; let user control this
        if not db.is_connected():
            await db.connect()
        
        print("=" * 70)
        print("Database Cleanup - Test Data")
        print("=" * 70)
        
        # Count before
        camera_count = await db.camera.count()
        event_count = await db.event_log.count()
        print(f"\nBefore cleanup:")
        print(f"  Cameras: {camera_count}")
        print(f"  Event logs: {event_count}")
        
        # Delete all event logs (safe - test data)
        if event_count > 0:
            result = await db.event_log.delete_many()
            print(f"\nDeleted {result} event log entries")
        
        # Count after
        camera_count = await db.camera.count()
        event_count = await db.event_log.count()
        print(f"\nAfter cleanup:")
        print(f"  Cameras: {camera_count}")
        print(f"  Event logs: {event_count}")
        
        await db.disconnect()
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(cleanup_test_data())
    sys.exit(0 if success else 1)
