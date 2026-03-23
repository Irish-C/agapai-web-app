#!/usr/bin/env python3
"""
Reset specific user passwords to known values.
"""

import asyncio
import sys
import bcrypt
from database import db

# Password mappings: username -> new_password
PASSWORD_MAPPINGS = {
    'reginedahan': 'regine321!',
    'marycam': 'marycam123',
    'kayecasem': 'kayecasem123',
    'kathnava': 'kathnava123',
    'superadmin': 'superadmin123',
}

async def reset_passwords():
    """Reset passwords for specific users."""
    try:
        print("[INFO] Connecting to database...")
        sys.stdout.flush()
        await db.connect()
        print("[INFO] Connected to database")
        sys.stdout.flush()
        
        updated_count = 0
        
        for username, new_password in PASSWORD_MAPPINGS.items():
            print(f"[UPDATING] User '{username}'...")
            sys.stdout.flush()
            
            # Find user
            user = await db.user.find_unique(where={'username': username})
            if not user:
                print(f"  ✗ User not found")
                sys.stdout.flush()
                continue
            
            # Hash the new password
            password_bytes = new_password.encode('utf-8')
            new_hash = bcrypt.hashpw(password_bytes, bcrypt.gensalt(rounds=12))
            new_hash_str = new_hash.decode('utf-8')
            
            # Update the database
            await db.user.update(
                where={'id': user.id},
                data={'password': new_hash_str}
            )
            updated_count += 1
            print(f"  ✓ Password reset successfully")
            sys.stdout.flush()
        
        print(f"\n[SUCCESS] {updated_count} passwords reset")
        sys.stdout.flush()
        
    except Exception as e:
        print(f"[ERROR] {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        print("[INFO] Disconnecting from database...")
        sys.stdout.flush()
        await db.disconnect()
        print("[INFO] Disconnected from database")

if __name__ == "__main__":
    asyncio.run(reset_passwords())
