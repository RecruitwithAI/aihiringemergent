#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

class APIKeyManagementTester:
    def __init__(self, base_url="https://search-strategy.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.auth_cookies = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        print(f"🔧 Testing API Key Management at: {self.api_url}")

    def run_test(self, name, method, endpoint, expected_status=200, data=None, cookies=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        headers = {'Content-Type': 'application/json'}
        
        # Use stored auth cookies if available
        test_cookies = cookies or self.auth_cookies

        self.tests_run += 1
        print(f"\n🔍 Test {self.tests_run}: {name}")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers, cookies=test_cookies)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers, cookies=test_cookies)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers, cookies=test_cookies)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers, cookies=test_cookies)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    resp_data = response.json()
                    # Only show relevant parts for key tests
                    if 'daily_usage' in str(resp_data):
                        print(f"   Usage: {resp_data.get('daily_usage', {})}")
                    elif 'success' in str(resp_data):
                        print(f"   Result: {resp_data.get('message', 'Success')}")
                    else:
                        print(f"   Response keys: {list(resp_data.keys()) if isinstance(resp_data, dict) else type(resp_data).__name__}")
                except:
                    print(f"   Response: Non-JSON or empty")
            else:
                self.failed_tests.append(f"{name} - Expected {expected_status}, got {response.status_code}")
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text[:200]}...")

            return success, response

        except Exception as e:
            self.failed_tests.append(f"{name} - Exception: {str(e)}")
            print(f"❌ FAILED - Exception: {str(e)}")
            return False, None

    def test_backend_api_scenarios(self):
        """Test all backend API scenarios as specified in the review request"""
        print("\n" + "="*60)
        print("🔐 BACKEND API KEY MANAGEMENT TESTS")
        print("="*60)
        
        # Test 1.1: Login as regular user
        print("\n--- Test 1.1: Login as regular user ---")
        success, response = self.run_test(
            "Login as regular user (saba@bestpl.ai)",
            "POST",
            "auth/login",
            200,
            {
                "email": "saba@bestpl.ai",
                "password": "Bestpl2026!"
            }
        )
        
        if success:
            # Store cookies for subsequent requests
            self.auth_cookies = response.cookies
            user_data = response.json()
            print(f"   Logged in user: {user_data.get('name')} ({user_data.get('email')})")
        else:
            print("❌ Cannot continue without authentication")
            return False
        
        # Test 1.2: Get initial usage stats
        print("\n--- Test 1.2: Get initial usage stats ---")
        success, response = self.run_test(
            "Get initial usage stats",
            "GET",
            "ai/usage",
            200,
            cookies=self.auth_cookies
        )
        
        initial_usage = None
        if success:
            usage_data = response.json()
            initial_usage = usage_data
            print(f"   Daily usage: {usage_data.get('daily_usage', {})}")
            print(f"   Has own API key: {usage_data.get('has_own_api_key', False)}")
            
            # Verify expected initial state
            if usage_data.get('daily_usage', {}).get('remaining', 0) <= 3 and not usage_data.get('has_own_api_key', True):
                print(f"✅ Initial state correct: {usage_data.get('daily_usage', {}).get('remaining', 0)} remaining, no API key")
            else:
                print(f"⚠️  Unexpected initial state")
        
        # Test 1.3: Save a personal API key
        print("\n--- Test 1.3: Save a personal API key ---")
        test_api_key = "sk-test-my-personal-key-1234567890"
        success, response = self.run_test(
            "Save personal API key",
            "POST",
            "ai/save-api-key",
            200,
            {"api_key": test_api_key},
            cookies=self.auth_cookies
        )
        
        if success:
            save_response = response.json()
            print(f"   API key saved: {save_response.get('message', 'Success')}")
        
        # Test 1.4: Verify API key was saved
        print("\n--- Test 1.4: Verify API key was saved ---")
        success, response = self.run_test(
            "Verify API key saved",
            "GET",
            "ai/usage",
            200,
            cookies=self.auth_cookies
        )
        
        if success:
            usage_data = response.json()
            has_key = usage_data.get('has_own_api_key', False)
            print(f"   Has own API key: {has_key}")
            if has_key:
                print("✅ API key successfully saved and detected")
            else:
                print("❌ API key not detected after saving")
        
        # Test 1.5: Delete the API key
        print("\n--- Test 1.5: Delete the API key ---")
        success, response = self.run_test(
            "Delete API key",
            "DELETE",
            "ai/delete-api-key",
            200,
            cookies=self.auth_cookies
        )
        
        if success:
            delete_response = response.json()
            print(f"   API key deleted: {delete_response.get('message', 'Success')}")
        
        # Test 1.6: Verify API key was deleted
        print("\n--- Test 1.6: Verify API key was deleted ---")
        success, response = self.run_test(
            "Verify API key deleted",
            "GET",
            "ai/usage",
            200,
            cookies=self.auth_cookies
        )
        
        if success:
            usage_data = response.json()
            has_key = usage_data.get('has_own_api_key', False)
            print(f"   Has own API key: {has_key}")
            if not has_key:
                print("✅ API key successfully deleted")
            else:
                print("❌ API key still detected after deletion")
        
        return True

    def test_integration_ai_tool(self):
        """Test AI tool integration without personal key"""
        print("\n" + "="*60)
        print("🤖 INTEGRATION TEST: AI Tool with Master Key")
        print("="*60)
        
        # Test 3.1: Use AI tool without personal key
        print("\n--- Test 3.1: Use AI tool without personal key ---")
        success, response = self.run_test(
            "AI Generate (JD Builder without personal key)",
            "POST",
            "ai/generate",
            200,
            {
                "tool_type": "jd-builder",
                "prompt": "Create a JD for Senior Software Engineer",
                "context": "Tech startup, remote-first"
            },
            cookies=self.auth_cookies
        )
        
        if success:
            ai_response = response.json()
            print(f"   AI response length: {len(ai_response.get('response', ''))}")
            print(f"   Tool type: {ai_response.get('tool_type', 'Unknown')}")
        
        # Test 3.2: Check usage after generation
        print("\n--- Test 3.2: Check usage after generation ---")
        success, response = self.run_test(
            "Check usage after AI generation",
            "GET",
            "ai/usage",
            200,
            cookies=self.auth_cookies
        )
        
        if success:
            usage_data = response.json()
            used_count = usage_data.get('daily_usage', {}).get('used', 0)
            remaining = usage_data.get('daily_usage', {}).get('remaining', 0)
            print(f"   Usage after generation - Used: {used_count}, Remaining: {remaining}")
            
            # Verify usage was recorded
            if used_count >= 1:
                print("✅ Usage correctly tracked after AI generation")
            else:
                print("❌ Usage not properly tracked")

    def test_admin_scenarios(self):
        """Test admin user scenarios"""
        print("\n" + "="*60)
        print("👑 ADMIN TESTS")
        print("="*60)
        
        # Test 4.1: Login as SuperAdmin
        print("\n--- Test 4.1: Login as SuperAdmin ---")
        success, response = self.run_test(
            "Login as SuperAdmin",
            "POST",
            "auth/login",
            200,
            {
                "email": "noorussaba.alam@gmail.com",
                "password": "#VibeCon2026"
            }
        )
        
        if success:
            admin_data = response.json()
            print(f"   Admin user: {admin_data.get('name')} ({admin_data.get('email')})")
            print(f"   User data keys: {list(admin_data.keys())}")
            
            # Check for admin role indicators
            if 'role' in admin_data:
                print(f"   Role: {admin_data.get('role')}")
            else:
                print("   No explicit role field found")
        else:
            print("❌ Admin login failed")
            return False
        
        return True

    def test_error_scenarios(self):
        """Test various error scenarios"""
        print("\n" + "="*60)
        print("⚠️  ERROR SCENARIO TESTS")
        print("="*60)
        
        # Test invalid API key
        print("\n--- Test: Invalid API key ---")
        success, response = self.run_test(
            "Save invalid API key",
            "POST",
            "ai/save-api-key",
            400,
            {"api_key": "invalid"},
            cookies=self.auth_cookies
        )
        
        # Test unauthenticated access
        print("\n--- Test: Unauthenticated access ---")
        success, response = self.run_test(
            "Unauthenticated usage stats",
            "GET",
            "ai/usage",
            401,  # Should return 401 for unauthorized
            cookies=None
        )

    def run_all_tests(self):
        """Run all API Key Management tests"""
        print("🚀 Starting API Key Management Testing")
        print("="*70)
        
        # Backend API Tests
        backend_success = self.test_backend_api_scenarios()
        
        # Integration Tests
        if backend_success:
            self.test_integration_ai_tool()
        
        # Admin Tests
        self.test_admin_scenarios()
        
        # Error Scenarios
        if backend_success:
            self.test_error_scenarios()
        
        # Final summary
        print("\n" + "="*70)
        print("📊 TEST SUMMARY")
        print("="*70)
        print(f"✅ Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"📈 Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests ({len(self.failed_tests)}):")
            for failed in self.failed_tests:
                print(f"   - {failed}")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All API Key Management tests passed!")
            return True
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} test(s) failed")
            return False

def main():
    tester = APIKeyManagementTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())