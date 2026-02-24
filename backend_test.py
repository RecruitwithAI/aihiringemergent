#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

class BestplAPITester:
    def __init__(self, base_url="https://ai-tools-hub-69.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.session_token = None
        self.test_user = None
        self.tests_run = 0
        self.tests_passed = 0
        print(f"🔧 Testing Bestpl.ai API at: {self.api_url}")

    def run_test(self, name, method, endpoint, expected_status=200, data=None, use_auth=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if use_auth and self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    resp_data = response.json()
                    if isinstance(resp_data, dict) and len(resp_data) <= 5:
                        print(f"   Response: {resp_data}")
                    elif isinstance(resp_data, list) and len(resp_data) <= 3:
                        print(f"   Response: {len(resp_data)} items")
                    else:
                        print(f"   Response: Large data object ({type(resp_data).__name__})")
                except:
                    print(f"   Response: Non-JSON response")
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text[:200]}...")

            return success, response

        except Exception as e:
            print(f"❌ FAILED - Exception: {str(e)}")
            return False, None

    def test_health_check(self):
        """Basic connectivity test"""
        print("\n" + "="*50)
        print("🏥 HEALTH CHECK")
        print("="*50)
        
        # Test root endpoint
        try:
            response = requests.get(self.base_url, timeout=10)
            if response.status_code in [200, 404]:  # 404 is ok for API-only backend
                print("✅ Server is reachable")
                return True
            else:
                print(f"❌ Server responded with {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Server unreachable: {e}")
            return False

    def test_auth_flow(self):
        """Test authentication endpoints"""
        print("\n" + "="*50)
        print("🔐 AUTHENTICATION TESTS")
        print("="*50)
        
        # Test register with unique user
        timestamp = datetime.now().strftime("%H%M%S")
        test_email = f"test_user_{timestamp}@bestpl.ai"
        test_password = "TestPass123!"
        
        success, response = self.run_test(
            "User Registration", 
            "POST", 
            "auth/register",
            200,
            {
                "name": f"Test User {timestamp}",
                "email": test_email,
                "password": test_password
            }
        )
        
        if success:
            self.test_user = {
                "email": test_email,
                "password": test_password,
                "user_data": response.json()
            }
            print(f"   Created user: {test_email}")
        
        # Test login with existing test user
        success, response = self.run_test(
            "User Login (test user)",
            "POST",
            "auth/login", 
            200,
            {
                "email": "testphase4@bestpl.ai",
                "password": "TestPass123"
            }
        )
        
        if success:
            # Store session cookies for future authenticated requests
            print(f"   Login successful for testphase4@bestpl.ai")
            
        # Test invalid login
        success, response = self.run_test(
            "Invalid Login",
            "POST", 
            "auth/login",
            401,
            {
                "email": "invalid@test.com",
                "password": "wrongpass"
            }
        )
        
        # Test /auth/me endpoint
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        if success:
            user_data = response.json()
            print(f"   Current user: {user_data.get('name', 'Unknown')} ({user_data.get('email', 'No email')})")
            print(f"   Points: {user_data.get('points', 0)}, Badge: {user_data.get('badge', 'None')}")
        
        return success

    def test_dashboard_endpoints(self):
        """Test dashboard-related endpoints"""
        print("\n" + "="*50)
        print("📊 DASHBOARD TESTS")
        print("="*50)
        
        # Test dashboard stats
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200,
            use_auth=True
        )
        
        if success:
            stats = response.json()
            print(f"   Members: {stats.get('total_members', 0)}")
            print(f"   Challenges: {stats.get('total_challenges', 0)}")
            print(f"   User Rank: {stats.get('user_rank', 'N/A')}")
        
        # Test leaderboard
        success, response = self.run_test(
            "Leaderboard",
            "GET", 
            "leaderboard",
            200,
            use_auth=True
        )
        
        if success:
            leaderboard = response.json()
            print(f"   Leaderboard entries: {len(leaderboard)}")
        
        # Test profile stats
        success, response = self.run_test(
            "Profile Stats",
            "GET",
            "profile/stats", 
            200,
            use_auth=True
        )
        
        return success

    def test_challenges_flow(self):
        """Test challenges functionality"""
        print("\n" + "="*50)
        print("💬 CHALLENGES TESTS")
        print("="*50)
        
        # Get existing challenges
        success, response = self.run_test(
            "Get Challenges",
            "GET",
            "challenges",
            200,
            use_auth=True
        )
        
        if success:
            challenges = response.json()
            print(f"   Existing challenges: {len(challenges)}")
        
        # Create a new challenge
        test_challenge = {
            "title": f"Test Challenge {datetime.now().strftime('%H:%M:%S')}",
            "description": "This is a test challenge to verify the API is working correctly.",
            "tags": ["test", "api"]
        }
        
        success, response = self.run_test(
            "Create Challenge",
            "POST",
            "challenges",
            200,
            test_challenge,
            use_auth=True
        )
        
        challenge_id = None
        if success:
            created_challenge = response.json()
            challenge_id = created_challenge.get('challenge_id')
            print(f"   Created challenge ID: {challenge_id}")
        
        # Get challenge details
        if challenge_id:
            success, response = self.run_test(
                "Get Challenge Detail",
                "GET", 
                f"challenges/{challenge_id}",
                200,
                use_auth=True
            )
            
            # Test upvoting challenge
            success, response = self.run_test(
                "Upvote Challenge",
                "POST",
                f"challenges/{challenge_id}/upvote",
                200,
                use_auth=True
            )
            
            # Create an answer
            test_answer = {
                "content": "This is a test answer to the challenge."
            }
            
            success, response = self.run_test(
                "Create Answer",
                "POST",
                f"challenges/{challenge_id}/answers",
                200,
                test_answer,
                use_auth=True
            )
            
            answer_id = None
            if success:
                created_answer = response.json()
                answer_id = created_answer.get('answer_id')
                print(f"   Created answer ID: {answer_id}")
            
            # Test upvoting answer
            if answer_id:
                success, response = self.run_test(
                    "Upvote Answer",
                    "POST",
                    f"answers/{answer_id}/upvote",
                    200,
                    use_auth=True
                )
        
        return success

    def test_ai_tools(self):
        """Test AI tools functionality"""
        print("\n" + "="*50)
        print("🤖 AI TOOLS TESTS")
        print("="*50)
        
        # Test AI generation - JD Builder
        test_request = {
            "tool_type": "jd-builder",
            "prompt": "Create a job description for a Senior Software Engineer position at a tech startup.",
            "context": "Remote-first company, competitive salary, equity options"
        }
        
        success, response = self.run_test(
            "AI Generate (JD Builder)",
            "POST",
            "ai/generate", 
            200,
            test_request,
            use_auth=True
        )
        
        if success:
            ai_response = response.json()
            print(f"   AI response length: {len(ai_response.get('response', ''))}")
            print(f"   Tool type: {ai_response.get('tool_type', 'Unknown')}")
        
        # Test AI history
        success, response = self.run_test(
            "AI History",
            "GET",
            "ai/history",
            200,
            use_auth=True
        )
        
        if success:
            history = response.json()
            print(f"   AI history entries: {len(history)}")
        
        return success

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Bestpl.ai API Testing")
        print("="*70)
        
        # Health check first
        if not self.test_health_check():
            print("\n❌ Health check failed - cannot continue testing")
            return False
        
        # Authentication tests
        auth_success = self.test_auth_flow()
        if not auth_success:
            print("\n❌ Authentication failed - skipping authenticated tests")
        
        # Dashboard tests (require auth)
        if auth_success:
            self.test_dashboard_endpoints()
        
        # Challenges tests (require auth)
        if auth_success:
            self.test_challenges_flow()
        
        # AI tools tests (require auth)  
        if auth_success:
            self.test_ai_tools()
        
        # Logout test
        if auth_success:
            success, response = self.run_test(
                "User Logout",
                "POST",
                "auth/logout",
                200,
                use_auth=True
            )
        
        # Final summary
        print("\n" + "="*70)
        print("📊 TEST SUMMARY")
        print("="*70)
        print(f"✅ Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"📈 Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All tests passed!")
            return True
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} test(s) failed")
            return False

def main():
    tester = BestplAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())