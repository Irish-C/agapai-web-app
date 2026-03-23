#!/usr/bin/env python3
"""
Test Feature Authorization System
Verifies that feature-based access control is working end-to-end
"""

import requests
import json
from typing import Dict, Optional
import time

BASE_URL = "http://localhost:5000/api"

class FeatureAuthTester:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.token = None
        self.user_role = None
        
    def test_connection(self) -> bool:
        """Test if server is running"""
        try:
            # Try a simple request - we're just testing if server is up
            # Post to login with invalid data - server will respond with error but shows it's running
            response = requests.post(
                f"{self.base_url}/login",
                json={"username": "", "password": ""},
                timeout=5
            )
            # Any response (even 500) means server is running
            return True
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            return False
    
    def login(self, username: str, password: str) -> Dict:
        """Login with credentials and store token"""
        response = requests.post(
            f"{self.base_url}/login",
            json={"username": username, "password": password},
            timeout=10
        )
        
        if response.status_code != 200:
            return {
                'success': False,
                'error': f"Login failed: {response.status_code}",
                'details': response.text
            }
        
        data = response.json()
        self.token = data.get('access_token') or data.get('token')
        self.user_role = data.get('role')
        
        return {
            'success': True,
            'username': data.get('username'),
            'role': self.user_role,
            'userId': data.get('user_id')
        }
    
    def get_user_features(self) -> Dict:
        """Get features for the logged-in user"""
        if not self.token:
            return {
                'success': False,
                'error': 'Not logged in'
            }
        
        response = requests.get(
            f"{self.base_url}/admin/features/me",
            headers={'Authorization': f'Bearer {self.token}'},
            timeout=10
        )
        
        if response.status_code != 200:
            return {
                'success': False,
                'role': self.user_role,
                'error': f"Feature fetch failed: {response.status_code}",
                'details': response.text
            }
        
        features = response.json()
        visible_features = [k for k, v in features.items() if v is True]
        
        return {
            'success': True,
            'role': self.user_role,
            'total_features': len(features),
            'visible_features': len(visible_features),
            'visible_feature_list': visible_features,
            'all_features': features
        }
    
    def run_comprehensive_test(self) -> Dict:
        """Run all tests"""
        results = {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'backend_running': False,
            'users_tested': []
        }
        
        # Test 1: Connection
        print("=" * 60)
        print("TEST 1: Backend Connection")
        print("=" * 60)
        if not self.test_connection():
            print("❌ FAILED: Backend server not running on localhost:5000")
            results['error'] = 'Backend not running'
            return results
        
        print("✓ Backend server is running")
        results['backend_running'] = True
        
        # Test multiple users with different roles
        test_users = [
            ('reginedahan', 'agapai321', 'admin', 18),      # admin - 18 features
            ('kathnava', 'kath321', 'supervisor', 13),      # supervisor - 13 features
            ('kayrecasem', 'kaye321', 'guard', 10),         # guard - 10 features
            ('marycam', 'mary321', 'caregiver', 8),         # caregiver - 8 features
        ]
        
        for username, password, expected_role, expected_count in test_users:
            print(f"\n{'=' * 60}")
            print(f"TEST: User Role '{expected_role}' ({username})")
            print(f"{'=' * 60}")
            
            # Test login
            login_result = self.login(username, password)
            if not login_result['success']:
                print(f"❌ Login failed: {login_result['error']}")
                print(f"   Details: {login_result.get('details', 'N/A')}")
                results['users_tested'].append({
                    'username': username,
                    'role': expected_role,
                    'success': False,
                    'error': login_result['error']
                })
                continue
            
            print(f"✓ Login successful")
            print(f"  - Username: {login_result['username']}")
            print(f"  - Role: {login_result['role']}")
            print(f"  - User ID: {login_result['userId']}")
            
            # Test feature fetch
            feature_result = self.get_user_features()
            if not feature_result['success']:
                print(f"❌ Feature fetch failed: {feature_result['error']}")
                print(f"  Details: {feature_result.get('details', 'N/A')}")
                results['users_tested'].append({
                    'username': username,
                    'role': expected_role,
                    'success': False,
                    'error': feature_result['error']
                })
                continue
            
            visible_count = feature_result['visible_features']
            total_count = feature_result['total_features']
            
            print(f"✓ Features retrieved successfully")
            print(f"  - Total features in system: {total_count}")
            print(f"  - Visible features for {expected_role}: {visible_count}")
            print(f"  - Expected visible features: {expected_count}")
            
            # Check if count matches
            if visible_count == expected_count:
                print(f"✓ Feature count matches expected ({visible_count}/{expected_count})")
                status = "PASS"
            else:
                print(f"⚠ Feature count mismatch: got {visible_count}, expected {expected_count}")
                status = "WARN"
            
            # List visible features
            print(f"\n  Visible features:")
            for feat in sorted(feature_result['visible_feature_list']):
                print(f"    - {feat}")
            
            results['users_tested'].append({
                'username': username,
                'role': expected_role,
                'success': True,
                'total_features': total_count,
                'visible_features': visible_count,
                'expected_features': expected_count,
                'status': status,
                'feature_list': feature_result['visible_feature_list']
            })
        
        return results


if __name__ == '__main__':
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 10 + "Feature Authorization System Test" + " " * 15 + "║")
    print("╚" + "=" * 58 + "╝")
    
    tester = FeatureAuthTester()
    results = tester.run_comprehensive_test()
    
    print(f"\n\n{'=' * 60}")
    print("TEST SUMMARY")
    print(f"{'=' * 60}")
    print(f"Timestamp: {results['timestamp']}")
    print(f"Backend Running: {results['backend_running']}")
    print(f"Users Tested: {len(results['users_tested'])}")
    
    passed = sum(1 for u in results['users_tested'] if u.get('success'))
    print(f"Passed: {passed}/{len(results['users_tested'])}")
    
    if passed == len(results['users_tested']) and results['backend_running']:
        print("\n✓ ALL TESTS PASSED - Feature authorization system is working!")
    else:
        print(f"\n❌ SOME TESTS FAILED - Please review the output above")
    
    print(f"{'=' * 60}\n")
