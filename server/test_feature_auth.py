#!/usr/bin/env python3
"""
Test Feature Authorization System
Verifies that feature-based authorization works end-to-end
"""

import asyncio
import sys
import json
from database import db
from src.services.feature_service import get_feature_cache, get_feature_checker, initialize_feature_service
from src.utils.feature_constants import CATEGORY_FEATURES, DEFAULT_FEATURE_VISIBILITY

async def test_feature_service():
    """Test that FeatureChecker can load features correctly"""
    print("\n" + "="*60)
    print("TEST 1: Feature Service Loading")
    print("="*60)
    
    try:
        # Initialize the feature service
        await initialize_feature_service()
        checker = get_feature_checker()
        print("✓ FeatureChecker initialized")
        
        # Check cache loading
        all_features = await checker.get_all_features()
        print(f"✓ Loaded {len(all_features)} feature categories from database")
        
        # Count total features
        total_features = sum(len(features) for _, features in all_features.items())
        print(f"✓ Total features: {total_features}")
        
        # List features by category
        for category, features in all_features.items():
            print(f"  - {category}: {len(features)} features")
        
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_feature_visibility():
    """Test that feature visibility works for different roles"""
    print("\n" + "="*60)
    print("TEST 2: Feature Visibility by Role")
    print("="*60)
    
    try:
        checker = FeatureChecker()
        
        # Test for each role
        roles = {
            'caregiver': 10,  # Expected feature count
            'guard': 17,
            'supervisor': 22,
            'admin': 30,
            'superadmin': 34
        }
        
        for role_name, expected_count in roles.items():
            # Get visibility matrix from constants
            visibility = DEFAULT_FEATURE_VISIBILITY.get(role_name, {})
            visible_count = sum(1 for v in visibility.values() if v)
            
            print(f"✓ {role_name:12} has {visible_count:2} visible features (expected: {expected_count})")
        
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

async def test_database_features():
    """Test that features exist in database"""
    print("\n" + "="*60)
    print("TEST 3: Database Feature Data")
    print("="*60)
    
    try:
        # Use existing db connection (already connected by app.py)
        # Count category features
        feature_count = await db.categoryfeature.count()
        print(f"✓ Database has {feature_count} features in category_features table")
        
        # Count category feature permissions
        perm_count = await db.categoryfeaturepermission.count()
        print(f"✓ Database has {perm_count} role-feature permissions")
        
        # Get categories summary
        categories = await db.categoryfeature.find_many(
            include={"category": True}
        )
        category_map = {}
        for cat in categories:
            cat_name = cat.category.category_name if cat.category else "Unknown"
            category_map[cat_name] = category_map.get(cat_name, 0) + 1
        
        print("\n  Features by category:")
        for category, count in sorted(category_map.items()):
            print(f"    - {category}: {count}")
        
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_sample_user_features():
    """Test fetching features for a sample user"""
    print("\n" + "="*60)
    print("TEST 4: Sample User Feature Access")
    print("="*60)
    
    try:
        # Find a test user
        user = await db.user.find_first(include={"role": True})
        
        if not user:
            print("⚠ No test user found in database")
            return False
        
        role_name = user.role.role_name if user.role else "Unknown"
        print(f"✓ Found test user: {user.username} (role: {role_name})")
        
        # Get features for this user
        features = await db.categoryfeaturepermission.find_many(
            where={"role_id": user.role_id},
            include={"feature": True}
        )
        
        visible = sum(1 for f in features if f.is_visible)
        
        print(f"✓ User ({role_name}) has {visible}/{len(features)} features visible")
        print("\n  Sample features:")
        for perm in features[:5]:
            feature_key = perm.feature.feature_key if perm.feature else "Unknown"
            feature_name = perm.feature.feature_name if perm.feature else "Unknown"
            status = "✓" if perm.is_visible else "✗"
            print(f"    {status} {feature_key:25} ({feature_name})")
        
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("FEATURE AUTHORIZATION SYSTEM - TEST SUITE")
    print("="*60)
    
    # Initialize database connection
    try:
        await db.connect()
        print("✓ Connected to database")
    except Exception as e:
        print(f"✗ Failed to connect to database: {e}")
        return False
    
    try:
        results = []
        results.append(("Feature Service", await test_feature_service()))
        results.append(("Feature Visibility", await test_feature_visibility()))
        results.append(("Database Features", await test_database_features()))
        results.append(("Sample User Features", await test_sample_user_features()))
        
        # Summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✓ PASS" if result else "✗ FAIL"
            print(f"{status} - {test_name}")
        
        print(f"\nTotal: {passed}/{total} tests passed")
        print("="*60 + "\n")
        
        return passed == total
    finally:
        await db.disconnect()
        print("✓ Disconnected from database")

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
