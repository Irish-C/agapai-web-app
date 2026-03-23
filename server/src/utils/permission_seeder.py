"""
Permission seeding utility - loads default permissions into the database.
Run this on system startup to ensure all roles have permission definitions.
"""

import asyncio
from database import db
from src.utils.permission_constants import DEFAULT_PERMISSIONS, ALL_PERMISSIONS


async def seed_default_permissions():
    """
    Seed default permissions for all roles.
    Only creates entries if they don't already exist.
    """
    await db.connect()
    
    try:
        print("[Permissions] Starting permission seed...")
        
        # Get all roles
        roles = await db.role.find_many()
        
        if not roles:
            print("❌ No roles found. Please seed roles first.")
            return
        
        total_created = 0
        total_skipped = 0
        
        for role in roles:
            role_defaults = DEFAULT_PERMISSIONS.get(role.role_name, {})
            
            if not role_defaults:
                print(f"⚠️  No default permissions defined for role '{role.role_name}'")
                continue
            
            print(f"\n📋 Processing role: {role.role_name}")
            
            for permission_name, is_granted in role_defaults.items():
                # Check if this permission record already exists
                existing = await db.rolepermission.find_first(
                    where={
                        'role_id': role.id,
                        'permission_name': permission_name
                    }
                )
                
                if existing:
                    total_skipped += 1
                else:
                    # Create new permission record
                    await db.rolepermission.create(
                        data={
                            'role_id': role.id,
                            'permission_name': permission_name,
                            'is_granted': is_granted,
                        }
                    )
                    total_created += 1
                    print(f"  ✓ {permission_name}: {is_granted}")
        
        print(f"\n✅ Permission seeding complete!")
        print(f"   Created: {total_created}")
        print(f"   Skipped (already exist): {total_skipped}")
        
    except Exception as e:
        print(f"❌ Error seeding permissions: {e}")
        raise
    finally:
        await db.disconnect()


async def reset_permissions_to_defaults():
    """
    Reset all permissions back to default values.
    WARNING: This deletes all permission overrides!
    """
    await db.connect()
    
    try:
        print("[Permissions] Resetting all permissions to defaults...")
        
        # Delete all existing permission records
        deleted_count = await db.rolepermission.delete_many()
        print(f"✓ Deleted {deleted_count} existing permission records")
        
        # Re-seed from defaults
        await seed_default_permissions()
        
    except Exception as e:
        print(f"❌ Error resetting permissions: {e}")
        raise
    finally:
        await db.disconnect()


if __name__ == "__main__":
    asyncio.run(seed_default_permissions())
