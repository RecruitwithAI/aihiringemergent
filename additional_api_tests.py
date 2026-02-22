#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

class AdditionalAPITests:
    def __init__(self, base_url="https://search-strategy.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        print(f"🔧 Running Additional API Key Management Tests at: {self.api_url}")

    def run_test(self, name, method, endpoint, expected_status=200, data=None, cookies=None, headers=None):
        """Run a single API test with fresh session"""
        session = requests.Session()  # Fresh session each time
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Test {self.tests_run}: {name}")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = session.get(url, headers=test_headers, cookies=cookies)
            elif method == 'POST':
                response = session.post(url, json=data, headers=test_headers, cookies=cookies)
            elif method == 'DELETE':
                response = session.delete(url, headers=test_headers, cookies=cookies)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    resp_data = response.json()
                    if 'detail' in resp_data:
                        print(f"   Detail: {resp_data['detail']}")
                    elif 'daily_usage' in resp_data:
                        print(f"   Response shows auth required (unexpected): {resp_data}")
                except:
                    pass
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text[:200]}")

            return success, response

        except Exception as e:
            print(f"❌ FAILED - Exception: {str(e)}")
            return False, None

    def test_auth_requirements(self):
        """Test authentication requirements for API endpoints"""
        print("\n" + "="*60)
        print("🔐 AUTHENTICATION REQUIREMENT TESTS")
        print("="*60)
        
        # Test unauthenticated access to protected endpoints
        protected_endpoints = [
            ("ai/usage", "GET"),
            ("ai/save-api-key", "POST"),
            ("ai/delete-api-key", "DELETE"),
            ("ai/generate", "POST"),
            ("auth/me", "GET")
        ]
        
        for endpoint, method in protected_endpoints:
            test_data = {"api_key": "test"} if "save-api-key" in endpoint else {"tool_type": "jd-builder", "prompt": "test"} if "generate" in endpoint else None
            
            success, response = self.run_test(
                f"Unauthenticated {method} {endpoint}",
                method,
                endpoint,
                401,  # Should return 401 for all protected endpoints
                data=test_data,
                cookies=None  # No cookies
            )

    def test_api_key_edge_cases(self):
        """Test edge cases for API key functionality"""
        print("\n" + "="*60)
        print("🔍 API KEY EDGE CASES")
        print("="*60)
        
        # First login to get auth
        print("\n--- Login for edge case tests ---")
        session = requests.Session()
        login_response = session.post(
            f"{self.api_url}/auth/login",
            json={"email": "saba@bestpl.ai", "password": "Bestpl2026!"},
            headers={'Content-Type': 'application/json'}
        )
        
        if login_response.status_code == 200:
            auth_cookies = login_response.cookies
            print("✅ Logged in for edge case tests")
            
            # Test empty API key
            success, response = self.run_test(
                "Save empty API key",
                "POST",
                "ai/save-api-key",
                400,
                {"api_key": ""},
                cookies=auth_cookies
            )
            
            # Test very short API key
            success, response = self.run_test(
                "Save short API key",
                "POST",
                "ai/save-api-key",
                400,
                {"api_key": "sk-123"},
                cookies=auth_cookies
            )
            
            # Test delete when no key exists
            success, response = self.run_test(
                "Delete non-existent API key",
                "DELETE",
                "ai/delete-api-key",
                200,  # Should succeed even if no key exists
                cookies=auth_cookies
            )
            
        else:
            print("❌ Failed to login for edge case tests")

    def test_user_data_admin_check(self):
        """Check if admin user has any special properties"""
        print("\n" + "="*60)
        print("👑 ADMIN USER DATA CHECK")
        print("="*60)
        
        # Login as admin user
        session = requests.Session()
        admin_response = session.post(
            f"{self.api_url}/auth/login",
            json={"email": "noorussaba.alam@gmail.com", "password": "#VibeCon2026"},
            headers={'Content-Type': 'application/json'}
        )
        
        if admin_response.status_code == 200:
            admin_data = admin_response.json()
            auth_cookies = admin_response.cookies
            print(f"✅ Admin login successful")
            print(f"   Admin user data: {json.dumps(admin_data, indent=2)}")
            
            # Check /auth/me endpoint for admin
            success, response = self.run_test(
                "Admin user /auth/me",
                "GET",
                "auth/me",
                200,
                cookies=auth_cookies
            )
            
            if success:
                me_data = response.json()
                print(f"   /auth/me data: {json.dumps(me_data, indent=2)}")
                
                # Look for admin indicators
                if 'role' in me_data or 'admin' in str(me_data).lower() or 'superadmin' in str(me_data).lower():
                    print("✅ Admin role indicators found")
                else:
                    print("ℹ️  No explicit admin role indicators in user data")
        else:
            print("❌ Admin login failed")

    def run_additional_tests(self):
        """Run all additional tests"""
        print("🚀 Starting Additional API Key Management Tests")
        print("="*70)
        
        self.test_auth_requirements()
        self.test_api_key_edge_cases()
        self.test_user_data_admin_check()
        
        # Final summary
        print("\n" + "="*70)
        print("📊 ADDITIONAL TEST SUMMARY")
        print("="*70)
        print(f"✅ Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"📈 Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = AdditionalAPITests()
    success = tester.run_additional_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())