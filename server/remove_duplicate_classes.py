import asyncio
from database import db

async def remove_duplicate_classes():
    """Remove duplicate EventClass entries, keeping only one of each"""
    try:
        if not db.is_connected():
            await db.connect()

        # Get all unique class names
        classes = await db.eventclass.find_many(order={'class_name': 'asc'})
        class_names = {}
        
        # Group by name and collect IDs
        for c in classes:
            if c.class_name not in class_names:
                class_names[c.class_name] = []
            class_names[c.class_name].append(c.id)

        print("Removing duplicate EventClass entries...")
        total_removed = 0
        for class_name, ids in class_names.items():
            if len(ids) > 1:
                # Keep the first one, delete the rest
                ids_to_delete = ids[1:]
                for id_to_delete in ids_to_delete:
                    # First move any event logs to the first ID
                    await db.eventlog.update_many(
                        where={'event_class_id': id_to_delete},
                        data={'event_class_id': ids[0]}
                    )
                    # Then delete the duplicate
                    await db.eventclass.delete(where={'id': id_to_delete})
                    total_removed += 1
                print(f"  ✓ Removed {len(ids_to_delete)} duplicate(s) of '{class_name}'")

        print(f"\nTotal duplicates removed: {total_removed}")
        
        # Show final state
        print("\nFinal EventClass records:")
        final_classes = await db.eventclass.find_many(order={'class_name': 'asc'})
        for c in final_classes:
            print(f"  - {c.class_name}")

        await db.disconnect()
        print("\n✓ Duplicate removal complete!")

    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    asyncio.run(remove_duplicate_classes())
