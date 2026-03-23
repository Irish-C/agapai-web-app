#!/usr/bin/env python3
"""
Permission API Endpoint Test Script
Tests all permission management endpoints to verify Prisma ORM integration.
"""

import requests
import json
from typing import Dict, Optional

BASE_URL = "http://localhost:5000"

class PermissionTester:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.token = None
        self.headers = {}
    
    def test_connection(self) -> bool:
        """Test if server is running"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            print(f"✅ Server is running ({response.status_code})")
            return response.status_code == 200
        except Exception as e:
            print(f"❌ Server not running: {e}")
            return False
    
    def get_superadmin_token(self, username: str = "superadmin", password: str = "superadmin123") -> bool:
        """Login as superadmin and get token"""
        try:
            response = requests.post(
                f"{self.base_url}/api/login",
                json={"username": username, "password": password},
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"❌ Login failed ({response.status_code}): {response.text}")
                return False
            
            data = response.json()
            self.token = data.get("token")
            
            if not self.token:
                print(f"❌ No token in response: {data}")
                return False
            
            self.headers = {"Authorization": f"Bearer {self.token}"}
            print(f"✅ Logged in as {username}, got token")
            return True
            
        except Exception as e:
            print(f"❌ Login error: {e}")
            return False
    
    def test_get_all_roles_permissions(self) -> bool:
        """Test: GET /api/admin/permissions/roles"""
        try:
            response = requests.get(
                f"{self.base_url}/api/admin/permissions/roles",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"❌ GET all roles failed ({response.status_code}): {response.text}")
                return False
            
            data = response.json()
            if not isinstance(data, list) or len(data) == 0:
                print(f"❌ GET all roles: expected non-empty list, got {type(data)}")
                return False
            
            print(f"✅ GET /api/admin/permissions/roles - Found {len(data)} roles")
            for role in data[:3]:  # Print first 3
                print(f"   - {role['role_name']}: {len(role['permissions'])} permissions")
            
            return True
            
        except Exception as e:
            print(f"❌ GET all roles error: {e}")
            return False
    
    def test_get_specific_role_permissions(self, role_id: int = 1) -> bool:
        """Test: GET /api/admin/permissions/roles/{role_id}"""
        try:
            response = requests.get(
                f"{self.base_url}/api/admin/permissions/roles/{role_id}",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"❌ GET role {role_id} failed ({response.status_code}): {response.text}")
                return False
            
            data = response.json()
            perms = data.get('permissions', {})
            
            print(f"✅ GET /api/admin/permissions/roles/{role_id}")
            print(f"   Role: {data['role_name']}, Permissions: {len(perms)}")
            
            # Show first 3 permissions
            for perm_name, is_granted in list(perms.items())[:3]:
                status = "✓" if is_granted else "✗"
                print(f"   - [{status}] {perm_name}")
            
            return True
            
        except Exception as e:
            print(f"❌ GET role {role_id} error: {e}")
            return False
    
    def test_update_single_permission(self, role_id: int = 4, permission_name: str = "Delete Data") -> bool:
        """Test: PUT /api/admin/permissions/roles/{role_id}/permissions/{permission_name}"""
        try:
            # First check current state
            get_resp = requests.get(
                f"{self.base_url}/api/admin/permissions/roles/{role_id}",
                headers=self.headers,
                timeout=10
            )
            
            if get_resp.status_code != 200:
                print(f"❌ Could not fetch role {role_id} to check current state")
                return False
            
            current_perms = get_resp.json().get('permissions', {})
            current_value = current_perms.get(permission_name, False)
            new_value = not current_value  # Toggle it
            
            # Update permission
            response = requests.put(
                f"{self.base_url}/api/admin/permissions/roles/{role_id}/permissions/{permission_name}",
                json={"is_granted": new_value, "reason": "Test via test script"},
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"❌ PUT permission failed ({response.status_code}): {response.text}")
                return False
            
            data = response.json()
            print(f"✅ PUT /api/admin/permissions/roles/{role_id}/permissions/{permission_name}")
            print(f"   {permission_name}: {current_value} → {new_value}")
            
            # Reset it back
            response_reset = requests.put(
                f"{self.base_url}/api/admin/permissions/roles/{role_id}/permissions/{permission_name}",
                json={"is_granted": current_value, "reason": "Reset after test"},
                headers=self.headers,
                timeout=10
            )
            
            if response_reset.status_code == 200:
                print(f"   (Reset back to original value)")
            
            return True
            
        except Exception as e:
            print(f"❌ PUT permission error: {e}")
            return False
    
    def test_bulk_update_permissions(self, role_id: int = 2) -> bool:
        """Test: PUT /api/admin/permissions/roles/{role_id}/permissions"""
        try:
            # Update 2 permissions at once
            update_data = {
                "permissions": {
                    "Create Users": True,
                    "Edit Users": True,
                },
                "reason": "Bulk test via test script"
            }
            
            response = requests.put(
                f"{self.base_url}/api/admin/permissions/roles/{role_id}/permissions",
                json=update_data,
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"❌ Bulk PUT failed ({response.status_code}): {response.text}")
                return False
            
            data = response.json()
            print(f"✅ PUT /api/admin/permissions/roles/{role_id}/permissions (bulk)")
            print(f"   Updated {data.get('message', '?')}")
            
            return True
            
        except Exception as e:
            print(f"❌ Bulk PUT error: {e}")
            return False
    
    def test_get_audit_log(self, limit: int = 10) -> bool:
        """Test: GET /api/admin/permissions/audit-log"""
        try:
            response = requests.get(
                f"{self.base_url}/api/admin/permissions/audit-log?limit={limit}",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"❌ GET audit log failed ({response.status_code}): {response.text}")
                return False
            
            data = response.json()
            if not isinstance(data, list):
                print(f"❌ Expected list, got {type(data)}")
                return False
            
            print(f"✅ GET /api/admin/permissions/audit-log")
            print(f"   Found {len(data)} audit entries (limit={limit})")
            
            if len(data) > 0:
                # Show first 2
                for entry in data[:2]:
                    print(f"   - {entry['role_name']}.{entry['permission_name']}: {entry['old_value']} → {entry['new_value']}")
                    print(f"     by {entry['changed_by_username']} at {entry['changed_at']}")
            
            return True
            
        except Exception as e:
            print(f"❌ GET audit log error: {e}")
            return False
    
    def test_reset_single_permission(self, role_id: int = 4, permission_name: str = "Manage Cameras") -> bool:
        """Test: DELETE /api/admin/permissions/roles/{role_id}/permissions/{permission_name}"""
        try:
            response = requests.delete(
                f"{self.base_url}/api/admin/permissions/roles/{role_id}/permissions/{permission_name}",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"❌ DELETE permission failed ({response.status_code}): {response.text}")
                return False
            
            data = response.json()
            print(f"✅ DELETE /api/admin/permissions/roles/{role_id}/permissions/{permission_name}")
            print(f"   Reset to default value: {data.get('default_value', '?')}")
            
            return True
            
        except Exception as e:
            print(f"❌ DELETE permission error: {e}")
            return False
    
    def test_reset_all_permissions(self, role_id: int = 5) -> bool:
        """Test: DELETE /api/admin/permissions/roles/{role_id}/permissions"""
        try:
            response = requests.delete(
                f"{self.base_url}/api/admin/permissions/roles/{role_id}/permissions",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"❌ DELETE all permissions failed ({response.status_code}): {response.text}")
                return False
            
            data = response.json()
            print(f"✅ DELETE /api/admin/permissions/roles/{role_id}/permissions (bulk reset)")
            print(f"   {data.get('message', '?')}")
            
            return True
            
        except Exception as e:
            print(f"❌ DELETE all permissions error: {e}")
            return False
    
    def run_all_tests(self):
        """Run all tests"""
        print("=" * 70)
        print("PERMISSION API ENDPOINT TEST SUITE")
        print("=" * 70)
        print()
        
        # Check server
        if not self.test_connection():
            print("\n⚠️  Cannot connect to server. Make sure uvicorn is running:")
            print("   cd server && ./venv/bin/python -m uvicorn app:app --reload")
            return
        
        print()
        
        # Login
        if not self.get_superadmin_token():
            print("\n⚠️  Could not login. Check that superadmin user exists with default password.")
            return
        
        print()
        print("-" * 70)
        print("TESTING ENDPOINTS")
        print("-" * 70)
        print()
        
        results = []
        
        # Test each endpoint
        results.append(("GET /roles (all)", self.test_get_all_roles_permissions()))
        print()
        
        results.append(("GET /roles/{role_id}", self.test_get_specific_role_permissions(role_id=1)))
        print()
        
        results.append(("PUT /roles/{id}/permissions/{name}", self.test_update_single_permission(role_id=4, permission_name="Delete Data")))
        print()
        
        results.append(("PUT /roles/{id}/permissions (bulk)", self.test_bulk_update_permissions(role_id=2)))
        print()
        
        results.append(("GET /audit-log", self.test_get_audit_log(limit=10)))
        print()
        
        results.append(("DELETE /roles/{id}/permissions/{name}", self.test_reset_single_permission(role_id=4, permission_name="Manage Cameras")))
        print()
        
        results.append(("DELETE /roles/{id}/permissions (bulk reset)", self.test_reset_all_permissions(role_id=5)))
        print()
        
        # Summary
        print("-" * 70)
        print("TEST SUMMARY")
        print("-" * 70)
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for endpoint, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {endpoint}")
        
        print()
        print(f"Result: {passed}/{total} tests passed")
        
        if passed == total:
            print("\n🎉 All tests passed! Permission system is working correctly.")
        else:
            print(f"\n⚠️  {total - passed} test(s) failed. Check output above for details.")

if __name__ == "__main__":
    tester = PermissionTester()
    tester.run_all_tests()
