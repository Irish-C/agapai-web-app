#!/usr/bin/env python3
"""
Batch password rehashing script.
Converts all plain-text passwords in the database to bcrypt hashes.
"""

import asyncio
import sys
import bcrypt
from database import db

async def rehash_passwords():
    """Find all users with plain-text passwords and rehash them."""
    try:
        print("[INFO] Connecting to database...")
        sys.stdout.flush()
        await db.connect()
        print("[INFO] Connected to database")
        sys.stdout.flush()
        
        # Fetch all users
        print("[INFO] Fetching users...")
        sys.stdout.flush()
        users = await db.user.find_many()
        print(f"[INFO] Found {len(users)} total users")
        sys.stdout.flush()
        
        plain_text_count = 0
        already_hashed_count = 0
        rehashed_count = 0
        
        for user in users:
            password_hash = user.password
            
            # Check if already hashed (bcrypt hashes start with $2a or $2b)
            if password_hash.startswith('$2a') or password_hash.startswith('$2b'):
                already_hashed_count += 1
                continue
            
            plain_text_count += 1
            print(f"[REHASHING] User '{user.username}' (ID: {user.id}) - Plain text detected (length: {len(password_hash)})")
            sys.stdout.flush()
            
            # Hash the plain-text password using bcrypt directly
            # Limit to 72 bytes as per bcrypt specification
            password_bytes = password_hash[:72].encode('utf-8')
            new_hash = bcrypt.hashpw(password_bytes, bcrypt.gensalt(rounds=12))
            new_hash_str = new_hash.decode('utf-8')
            
            # Update the database
            await db.user.update(
                where={'id': user.id},
                data={'password': new_hash_str}
            )
            rehashed_count += 1
            print(f"  ✓ Rehashed successfully")
            sys.stdout.flush()
        
        print("\n[SUMMARY]")
        print(f"  Already hashed: {already_hashed_count}")
        print(f"  Plain text found: {plain_text_count}")
        print(f"  Rehashed: {rehashed_count}")
        print("[SUCCESS] Password rehashing complete")
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
    asyncio.run(rehash_passwords())
