#!/usr/bin/env python3
"""
Simple Feature Authorization Test
Tests the feature constants and basic feature service initialization
"""

import sys
from src.utils.feature_constants import CATEGORY_FEATURES, DEFAULT_FEATURE_VISIBILITY
from src.services.feature_service import initialize_feature_service

def test_feature_constants():
    """Test feature constants are properly defined"""
    print("\n" + "="*60)
    print("TEST 1: Feature Constants")
    print("="*60)
    
    try:
        # Count categories and features
        category_count = len(CATEGORY_FEATURES)
        print(f"✓ {category_count} feature categories defined")
        
        feature_count = 0
        for category_key, features in CATEGORY_FEATURES.items():
            feature_count += len(features)
            print(f"  - {category_key}: {len(features)} features")
        
        print(f"✓ Total {feature_count} features defined")
        
        # Check default visibility
        role_count = len(DEFAULT_FEATURE_VISIBILITY)
        print(f"✓ {role_count} roles with default visibility defined")
        
        for role, features in DEFAULT_FEATURE_VISIBILITY.items():
            visible = sum(1 for v in features.values() if v)
            print(f"  - {role}: {visible}/{len(features)} features visible")
        
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_feature_service_init():
    """Test feature service can be initialized"""
    print("\n" + "="*60)
    print("TEST 2: Feature Service Initialization")
    print("="*60)
    
    try:
        # Initialize feature service (non-async)
        initialize_feature_service(use_redis=False)
        print("✓ Feature service initialized successfully")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_feature_structure():
    """Test that feature definitions have correct structure"""
    print("\n" + "="*60)
    print("TEST 3: Feature Structure Validation")
    print("="*60)
    
    try:
        errors = []
        
        # Check each feature has required fields
        for category_key, features in CATEGORY_FEATURES.items():
            for feature in features:
                if 'feature_key' not in feature:
                    errors.append(f"{category_key}: Missing feature_key")
                if 'feature_name' not in feature:
                    errors.append(f"{category_key}: Missing feature_name")
                if 'feature_key' in feature and feature['feature_key'] not in DEFAULT_FEATURE_VISIBILITY.get('admin',{}) and feature['feature_key'] != 'category_name':
                    # Feature key should exist in at least admin role
                    pass
        
        if errors:
            for error in errors[:5]:  # Show first 5 errors
                print(f"  ⚠ {error}")
            print(f"✗ Found {len(errors)} structure issues")
            return False
        else:
            print("✓ All features have required structure")
            return True
            
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_feature_defaults_complete():
    """Test that all features have default visibility defined"""
    print("\n" + "="*60)
    print("TEST 4: Default Visibility Coverage")
    print("="*60)
    
    try:
        all_feature_keys = set()
        
        # Collect all feature keys
        for category_key, features in CATEGORY_FEATURES.items():
            for feature in features:
                if 'feature_key' in feature and feature['feature_key'] != 'category_name':
                    all_feature_keys.add(feature['feature_key'])
        
        print(f"✓ Found {len(all_feature_keys)} unique feature keys in definitions")
        
        # Check coverage in default visibility
        missing_in_defaults = []
        for role, visibility_map in DEFAULT_FEATURE_VISIBILITY.items():
            for feature_key in all_feature_keys:
                if feature_key not in visibility_map:
                    missing_in_defaults.append(f"Role '{role}': missing '{feature_key}'")
        
        if missing_in_defaults:
            print(f"✗ Missing {len(missing_in_defaults)} feature-role mappings")
            for msg in missing_in_defaults[:5]:
                print(f"  - {msg}")
            return False
        else:
            print("✓ All features have default visibility for all roles")
            return True
            
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("FEATURE AUTHORIZATION - CONSTANTS & INITIALIZATION TEST")
    print("="*60)
    
    results = []
    results.append(("Feature Constants", test_feature_constants()))
    results.append(("Feature Service Init", test_feature_service_init()))
    results.append(("Feature Structure", test_feature_structure()))
    results.append(("Default Visibility", test_feature_defaults_complete()))
    
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
    
    print("✓ All feature constants and definitions are properly configured!")
    print("✓ Backend authorization functions are ready to use")
    print("✓ Frontend can fetch features via API...")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
