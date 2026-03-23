#!/usr/bin/env python3
"""
Test script to verify all roles can access their permitted features
"""

import asyncio
import sys
from database import db
from src.services.feature_service import initialize_feature_service, get_feature_checker
from src.utils.feature_constants import DEFAULT_FEATURE_VISIBILITY, CATEGORY_FEATURES
from src.utils.feature_initialization import seed_features_if_needed


async def main():
    print("\n" + "="*70)
    print("TESTING ROLE ACCESS CONTROL")
    print("="*70 + "\n")
    
    try:
        # Connect to database
        print("Connecting to database...")
        await db.connect()
        
        # Seed features if needed
        print("Ensuring features are initialized...")
        await seed_features_if_needed()
        
        # Initialize feature service
        print("Initializing feature service...")
        initialize_feature_service()
        
        # Get all roles
        print("\nFetching roles from database...")
        roles = await db.role.find_many()
        print(f"Found {len(roles)} role(s)\n")
        
        if not roles:
            print("ERROR: No roles found in database!")
            return False
        
        # Test each role
        all_pass = True
        for role in roles:
            print(f"\nTesting role: {role.role_name} (ID: {role.id})")
            print("-" * 70)
            
            # Get expected visible features
            expected_visible = DEFAULT_FEATURE_VISIBILITY.get(role.role_name, {})
            visible_count = sum(1 for v in expected_visible.values() if v)
            print(f"  Expected: {visible_count} visible features out of {len(expected_visible)}")
            
            # Test feature checker
            checker = get_feature_checker()
            
            # Get all visible features for this role
            try:
                actual_visible = await checker.get_visible_features(role.id)
                print(f"  Actual:   {len(actual_visible)} visible features")
                
                # Check if they match
                expected_keys = {k for k, v in expected_visible.items() if v}
                actual_keys = actual_visible
                
                if expected_keys == actual_keys:
                    print(f"  ✓ Feature visibility matches expected")
                else:
                    print(f"  ✗ Feature mismatch!")
                    missing = expected_keys - actual_keys
                    extra = actual_keys - expected_keys
                    if missing:
                        print(f"    Missing: {missing}")
                    if extra:
                        print(f"    Extra: {extra}")
                    all_pass = False
                
                # Test sample features
                test_features = [
                    ("view_profile", True),  # All roles should have this
                    ("view_cameras", True),   # Most roles should have this
                    ("archive_user", exclusive_to_superadmin := role.role_name == "superadmin"),
                    ("configure_permissions", role.role_name == "superadmin"),
                ]
                
                print(f"  Sample feature tests:")
                for feature_key, should_have in test_features:
                    has_feature = await checker.has_feature(role.id, feature_key)
                    status = "✓" if has_feature == should_have else "✗"
                    print(f"    {status} {feature_key}: {has_feature} (expected: {should_have})")
                    if has_feature != should_have:
                        all_pass = False
                
            except Exception as e:
                print(f"  ✗ Error checking features for {role.role_name}: {e}")
                import traceback
                traceback.print_exc()
                all_pass = False
        
        # Print summary
        print("\n" + "="*70)
        if all_pass:
            print("✓ ALL TESTS PASSED - All roles have correct access")
        else:
            print("✗ SOME TESTS FAILED - Check output above")
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
    result = asyncio.run(main())
    sys.exit(0 if result else 1)
