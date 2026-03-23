"""
Initialize Settings Categories and Default Permissions
This script should be run once during application startup.

Usage:
    python initialize_categories.py
"""

import asyncio
from database import db
from src.services.category_permission_service import CategoryPermissionService


async def main():
    """
    Initialize default settings categories and role permissions.
    """
    print("\n" + "="*60)
    print("INITIALIZING SETTINGS CATEGORIES")
    print("="*60 + "\n")

    try:
        # Connect to database
        await db.connect()
        
        # Step 1: Create default categories
        print("Step 1: Creating default settings categories...")
        created_categories = await CategoryPermissionService.initialize_default_categories()
        print(f"✓ Created {len(created_categories)} new categories")
        
        if created_categories:
            print("\nNew categories:")
            for cat in created_categories:
                print(f"  - {cat.category_name} ({cat.category_key})")
        else:
            print("  All categories already exist")

        # Step 2: Initialize categories for existing roles
        print("\n\nStep 2: Initializing category permissions for existing roles...")
        roles = await db.role.find_many()
        print(f"Found {len(roles)} role(s)")

        if not roles:
            print("  ! No roles found. Please create roles first.")
            return

        for role in roles:
            print(f"\n  Processing role: {role.role_name} (ID: {role.id})")
            
            # Check if permissions already exist
            existing = await db.categorypermission.find_first(
                where={"role_id": role.id}
            )
            
            if existing:
                count = await db.categorypermission.count(where={"role_id": role.id})
                print(f"    → Already initialized with {count} permissions")
            else:
                # Initialize default permissions for this role
                created_perms = await CategoryPermissionService.initialize_role_categories(
                    role_id=role.id,
                    created_by=1  # System user ID
                )
                print(f"    ✓ Initialized {len(created_perms)} category permissions")
                
                # Show summary
                visible = sum(1 for p in created_perms if p.is_visible)
                print(f"      {visible} categories visible, {len(created_perms) - visible} hidden")

        print("\n\n" + "="*60)
        print("✓ INITIALIZATION COMPLETE")
        print("="*60 + "\n")

        # Print summary
        print("Summary:")
        print("-" * 60)
        
        all_categories = await db.settingscategory.find_many()
        print(f"Total categories: {len(all_categories)}")
        
        all_perms = await db.categorypermission.find_many()
        print(f"Total role-category permissions: {len(all_perms)}")
        
        for role in roles:
            role_perms = await db.categorypermission.count(where={"role_id": role.id})
            visible = await db.categorypermission.count(
                where={"role_id": role.id, "is_visible": True}
            )
            print(f"\n{role.role_name}:")
            print(f"  Total permissions: {role_perms}")
            print(f"  Visible categories: {visible}")
            print(f"  Hidden categories: {role_perms - visible}")

        print("\n" + "-" * 60)
        print("\nNext steps:")
        print("1. Visit Settings → Settings Categories (superadmin only)")
        print("2. Configure visibility and functions for each role")
        print("3. Test that users see only their authorized categories")
        print("\nFor more information, see CATEGORY_PERMISSIONS_GUIDE.md")

    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        # Disconnect from database
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
