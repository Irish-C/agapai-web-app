import asyncio
from database import db

async def fix_event_class_names():
    """Fix EventClass names to match Flask extraction logic"""
    try:
        if not db.is_connected():
            await db.connect()

        # Define the correct mappings (old_name -> new_name)
        corrections = {
            "Side Fall": "Sideward Fall",
            "Inactivity_High": "Inactivity (High)",
            "Inactivity_Medium": "Inactivity (Medium)",
            "Inactivity_Low": "Inactivity (Low)",
            "Inactive (critical)": "Inactivity (High)",  # Consolidate duplicates
            "Inactive (high)": "Inactivity (High)",
            "Inactive (medium)": "Inactivity (Medium)",
            "Inactive (low)": "Inactivity (Low)",
        }

        # Classes to remove (duplicates/unused)
        to_remove = [
            "Activity_Detected",
            "Fall_Detected",
        ]

        print("Fixing EventClass names...")
        for old_name, new_name in corrections.items():
            existing = await db.eventclass.find_first(where={'class_name': old_name})
            if existing:
                await db.eventclass.update(
                    where={'id': existing.id},
                    data={'class_name': new_name}
                )
                print(f"  ✓ Renamed '{old_name}' → '{new_name}'")

        print("\nRemoving unused classes...")
        for class_name in to_remove:
            existing = await db.eventclass.find_first(where={'class_name': class_name})
            if existing:
                await db.eventlog.delete_many(where={'event_class_id': existing.id})
                await db.eventclass.delete(where={'id': existing.id})
                print(f"  ✓ Removed '{class_name}'")

        # Verify final state
        print("\nFinal EventClass records:")
        classes = await db.eventclass.find_many(order={'class_name': 'asc'})
        for c in classes:
            print(f"  - {c.class_name}")

        await db.disconnect()
        print("\n✓ EventClass standardization complete!")

    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    asyncio.run(fix_event_class_names())
