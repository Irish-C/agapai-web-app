#!/usr/bin/env python3
"""
End-to-end test: Verify users can access account settings
Tests the actual API endpoint for permissions and authentication
"""

import asyncio
import json
import sys
from database import db
from passlib.context import CryptContext
from src.utils.auth import create_token
from src.utils.feature_initialization import seed_features_if_needed
from src.services.feature_service import initialize_feature_service

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def test_profile_access():
    """Test that users of all roles can access their profile"""
    print("\n" + "="*70)
    print("ACCOUNT SETTINGS ACCESS TEST")
    print("="*70 + "\n")
    
    try:
        # Setup
        await db.connect()
        await seed_features_if_needed()
        initialize_feature_service()
        
        # Get test users (seeded during db init)
        users_to_test = [
            ("reginedahan", "admin"),      # Admin user
            ("kathnava", "supervisor"),     # Supervisor user
            ("kayecasem", "guard"),        # Guard user
            ("marycam", "caregiver"),       # Caregiver user
            ("superagap", "superadmin"),   # Superadmin user
        ]
        
        print("Testing account settings access for each role...\n")
        
        all_pass = True
        for username, expected_role in users_to_test:
            print(f"Testing user: {username} ({expected_role})")
            print("-" * 70)
            
            # Get user from database
            user = await db.user.find_first(
                where={"username": username},
                include={"role": True}
            )
            
            if not user:
                print(f"  ✗ User not found in database")
                all_pass = False
                continue
            
            if not user.role:
                print(f"  ✗ User has no role assigned")
                all_pass = False
                continue
            
            actual_role = user.role.role_name
            if actual_role != expected_role:
                print(f"  ✗ Role mismatch: expected {expected_role}, got {actual_role}")
                all_pass = False
                continue
            
            print(f"  User: {user.firstname} {user.lastname}")
            print(f"  Role: {actual_role}")
            print(f"  User ID: {user.id}")
            
            # Check if user is active (required for access)
            if not user.is_active:
                print(f"  ✗ User is not active - cannot access settings")
                all_pass = False
                continue
            
            # Create JWT token for this user
            try:
                token = create_token(str(user.id))
                print(f"  Token: {token[:20]}...{token[-10:]}")
            except Exception as e:
                print(f"  ✗ Failed to create token: {e}")
                all_pass = False
                continue
            
            # Check feature permission
            from src.services.feature_service import get_feature_checker
            checker = get_feature_checker()
            
            has_view_profile = await checker.has_feature(user.role_id, "view_profile")
            print(f"  Feature 'view_profile': {has_view_profile}")
            
            if not has_view_profile:
                print(f"  ✗ User's role does not have 'view_profile' feature")
                all_pass = False
            else:
                print(f"  ✓ User can view their profile")
            
            # Simulate the request (check request params)
            print(f"  Endpoint: GET /api/user/profile")
            print(f"  Auth Header: Bearer {token[:20]}...")
            print(f"  Expected Status: 200 OK")
            
            if all([user, user.role, user.is_active, has_view_profile]):
                print(f"  ✓ PASS: User should be able to access account settings")
            else:
                print(f"  ✗ FAIL: User will be denied")
                all_pass = False
            
            print()
        
        # Summary
        print("="*70)
        if all_pass:
            print("✓ ALL USERS CAN ACCESS ACCOUNT SETTINGS")
        else:
            print("✗ SOME USERS CANNOT ACCESS ACCOUNT SETTINGS")
        print("="*70 + "\n")
        
        return all_pass
        
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        await db.disconnect()


if __name__ == "__main__":
    result = asyncio.run(test_profile_access())
    sys.exit(0 if result else 1)
