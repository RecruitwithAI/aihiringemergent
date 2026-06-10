#!/usr/bin/env python3
"""
Regression test for Phase 1 DB Optimization:
- Startup index creation (19 indexes across 6 collections)
- Session expires_at stored as BSON datetime (not ISO string) for TTL
"""

import requests
import json
import sys
from datetime import datetime
from pymongo import MongoClient
import os

class Phase1RegressionTester:
    def __init__(self, base_url="https://ai-recruitment-flow.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.session_token = None
        self.test_user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # MongoDB connection for index verification
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.getenv("DB_NAME", "test_database")
        self.mongo_client = MongoClient(mongo_url)
        self.db = self.mongo_client[db_name]
        
        print(f"🔧 Phase 1 DB Optimization Regression Test")
        print(f"   API: {self.api_url}")
        print(f"   MongoDB: {mongo_url}/{db_name}")
        print("="*70)

    def run_test(self, name, method, endpoint, expected_status=200, data=None, use_auth=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if use_auth and self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'

        self.tests_run += 1
        print(f"\n🔍 Test {self.tests_run}: {name}")
        
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
                print(f"   ✅ PASSED - Status: {response.status_code}")
                self.test_results.append({"name": name, "status": "PASSED"})
                try:
                    resp_data = response.json()
                    if isinstance(resp_data, dict) and len(str(resp_data)) < 200:
                        print(f"   Response: {resp_data}")
                except:
                    pass
            else:
                print(f"   ❌ FAILED - Expected {expected_status}, got {response.status_code}")
                self.test_results.append({"name": name, "status": "FAILED", "expected": expected_status, "got": response.status_code})
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text[:200]}")

            return success, response

        except Exception as e:
            print(f"   ❌ FAILED - Exception: {str(e)}")
            self.test_results.append({"name": name, "status": "EXCEPTION", "error": str(e)})
            return False, None

    def test_1_auth_register(self):
        """Test 1: User Registration (creates session with datetime expires_at)"""
        print("\n" + "="*70)
        print("🔐 TEST SUITE 1: AUTH FLOW (Session Storage Changed)")
        print("="*70)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        test_email = f"regression_test_{timestamp}@bestpl.ai"
        test_password = "SecurePass2026!"
        
        success, response = self.run_test(
            "POST /api/auth/register",
            "POST",
            "auth/register",
            200,
            {
                "name": f"Regression Test User {timestamp}",
                "email": test_email,
                "password": test_password,
                "linkedin_url": "https://linkedin.com/in/regressiontest"
            }
        )
        
        if success:
            user_data = response.json()
            self.test_user = {
                "email": test_email,
                "password": test_password,
                "user_id": user_data.get("user_id"),
                "name": user_data.get("name")
            }
            # Extract session token from cookies
            if 'session_token' in self.session.cookies:
                self.session_token = self.session.cookies['session_token']
                print(f"   ✓ Session token obtained from cookie")
            print(f"   ✓ User created: {test_email}")
            print(f"   ✓ User ID: {self.test_user['user_id']}")
        
        return success

    def test_2_verify_session_datetime(self):
        """Test 2: Verify session expires_at is stored as BSON datetime in MongoDB"""
        print(f"\n🔍 Test {self.tests_run + 1}: Verify session expires_at is BSON datetime")
        self.tests_run += 1
        
        try:
            if not self.session_token:
                print("   ❌ FAILED - No session token available")
                self.test_results.append({"name": "Verify session expires_at BSON datetime", "status": "FAILED", "error": "No session token"})
                return False
            
            # Query MongoDB directly
            session_doc = self.db.user_sessions.find_one({"session_token": self.session_token})
            
            if not session_doc:
                print("   ❌ FAILED - Session not found in database")
                self.test_results.append({"name": "Verify session expires_at BSON datetime", "status": "FAILED", "error": "Session not found"})
                return False
            
            expires_at = session_doc.get("expires_at")
            
            # Check if expires_at is a datetime object (BSON Date)
            if isinstance(expires_at, datetime):
                self.tests_passed += 1
                print(f"   ✅ PASSED - expires_at is BSON datetime")
                print(f"   ✓ Type: {type(expires_at).__name__}")
                print(f"   ✓ Value: {expires_at}")
                self.test_results.append({"name": "Verify session expires_at BSON datetime", "status": "PASSED"})
                return True
            else:
                print(f"   ❌ FAILED - expires_at is {type(expires_at).__name__}, not datetime")
                print(f"   ✗ Value: {expires_at}")
                self.test_results.append({"name": "Verify session expires_at BSON datetime", "status": "FAILED", "type": type(expires_at).__name__})
                return False
                
        except Exception as e:
            print(f"   ❌ FAILED - Exception: {str(e)}")
            self.test_results.append({"name": "Verify session expires_at BSON datetime", "status": "EXCEPTION", "error": str(e)})
            return False

    def test_3_auth_me(self):
        """Test 3: GET /api/auth/me with session token"""
        success, response = self.run_test(
            "GET /api/auth/me (with session token)",
            "GET",
            "auth/me",
            200,
            use_auth=True
        )
        
        if success:
            user_data = response.json()
            print(f"   ✓ Current user: {user_data.get('name')} ({user_data.get('email')})")
            print(f"   ✓ Points: {user_data.get('points', 0)}, Badge: {user_data.get('badge', 'None')}")
        
        return success

    def test_4_auth_login(self):
        """Test 4: POST /api/auth/login (creates new session)"""
        if not self.test_user:
            print(f"\n⚠️  Skipping login test - no test user available")
            return False
        
        success, response = self.run_test(
            "POST /api/auth/login (same credentials)",
            "POST",
            "auth/login",
            200,
            {
                "email": self.test_user["email"],
                "password": self.test_user["password"]
            }
        )
        
        if success:
            # Update session token from new login
            if 'session_token' in self.session.cookies:
                self.session_token = self.session.cookies['session_token']
                print(f"   ✓ New session token obtained")
            
            # Verify new session also has datetime expires_at
            print(f"\n🔍 Test {self.tests_run + 1}: Verify new login session expires_at is BSON datetime")
            self.tests_run += 1
            
            try:
                session_doc = self.db.user_sessions.find_one({"session_token": self.session_token})
                if session_doc and isinstance(session_doc.get("expires_at"), datetime):
                    self.tests_passed += 1
                    print(f"   ✅ PASSED - New session expires_at is BSON datetime")
                    self.test_results.append({"name": "Verify login session expires_at BSON datetime", "status": "PASSED"})
                else:
                    print(f"   ❌ FAILED - New session expires_at is not datetime")
                    self.test_results.append({"name": "Verify login session expires_at BSON datetime", "status": "FAILED"})
            except Exception as e:
                print(f"   ❌ FAILED - Exception: {str(e)}")
                self.test_results.append({"name": "Verify login session expires_at BSON datetime", "status": "EXCEPTION", "error": str(e)})
        
        return success

    def test_5_auth_me_again(self):
        """Test 5: GET /api/auth/me with new session token"""
        success, response = self.run_test(
            "GET /api/auth/me (with new session)",
            "GET",
            "auth/me",
            200,
            use_auth=True
        )
        return success

    def test_6_auth_logout(self):
        """Test 6: POST /api/auth/logout"""
        success, response = self.run_test(
            "POST /api/auth/logout",
            "POST",
            "auth/logout",
            200,
            use_auth=True
        )
        
        if success:
            print(f"   ✓ Logged out successfully")
        
        return success

    def test_7_auth_me_after_logout(self):
        """Test 7: GET /api/auth/me after logout (should fail with 401)"""
        success, response = self.run_test(
            "GET /api/auth/me (after logout - expect 401)",
            "GET",
            "auth/me",
            401,
            use_auth=True
        )
        
        if success:
            print(f"   ✓ Correctly returns 401 after logout")
        
        return success

    def test_8_unique_index_enforcement(self):
        """Test 8: Unique index enforcement - duplicate email registration"""
        print("\n" + "="*70)
        print("🔒 TEST SUITE 2: UNIQUE INDEX ENFORCEMENT")
        print("="*70)
        
        if not self.test_user:
            print(f"\n⚠️  Skipping unique index test - no test user available")
            return False
        
        # Try to register with the same email again
        success, response = self.run_test(
            "POST /api/auth/register (duplicate email - expect 4xx)",
            "POST",
            "auth/register",
            400,  # Expect 400 Bad Request, not 500
            {
                "name": "Duplicate User",
                "email": self.test_user["email"],
                "password": "AnotherPass123!",
                "linkedin_url": "https://linkedin.com/in/duplicate"
            }
        )
        
        if success:
            print(f"   ✓ Duplicate email correctly rejected with 400")
        else:
            # Check if it's 500 (which would be bad)
            if response and response.status_code == 500:
                print(f"   ⚠️  WARNING: Got 500 instead of 400 - unique index may not be working")
        
        return success

    def test_9_core_endpoints_smoke(self):
        """Test 9-14: Core endpoints smoke test (authenticated)"""
        print("\n" + "="*70)
        print("🚀 TEST SUITE 3: CORE ENDPOINTS SMOKE TEST")
        print("="*70)
        
        # Re-login to get a valid session
        if self.test_user:
            print(f"\n🔑 Re-authenticating for smoke tests...")
            login_response = self.session.post(
                f"{self.api_url}/auth/login",
                json={
                    "email": self.test_user["email"],
                    "password": self.test_user["password"]
                }
            )
            if login_response.status_code == 200:
                if 'session_token' in self.session.cookies:
                    self.session_token = self.session.cookies['session_token']
                    print(f"   ✓ Re-authenticated successfully")
            else:
                print(f"   ❌ Re-authentication failed")
                return False
        
        # Test 9: Create challenge
        timestamp = datetime.now().strftime("%H:%M:%S")
        challenge_data = {
            "title": f"Regression Test Challenge {timestamp}",
            "description": "Testing Phase 1 DB optimization with indexes on challenges collection",
            "tags": ["regression", "testing", "phase1"]
        }
        
        success, response = self.run_test(
            "POST /api/challenges (create)",
            "POST",
            "challenges",
            200,
            challenge_data,
            use_auth=True
        )
        
        challenge_id = None
        if success:
            created = response.json()
            challenge_id = created.get("challenge_id")
            print(f"   ✓ Challenge created: {challenge_id}")
        
        # Test 10: Get challenges list
        success, response = self.run_test(
            "GET /api/challenges (list)",
            "GET",
            "challenges",
            200,
            use_auth=True
        )
        
        if success:
            challenges = response.json()
            print(f"   ✓ Retrieved {len(challenges)} challenges")
        
        # Test 11: Get challenges with search
        success, response = self.run_test(
            "GET /api/challenges?search=regression (search)",
            "GET",
            "challenges?search=regression",
            200,
            use_auth=True
        )
        
        if success:
            challenges = response.json()
            print(f"   ✓ Search returned {len(challenges)} challenges")
        
        # Test 12: Get challenges with tags
        success, response = self.run_test(
            "GET /api/challenges?tags=testing (tag filter)",
            "GET",
            "challenges?tags=testing",
            200,
            use_auth=True
        )
        
        if success:
            challenges = response.json()
            print(f"   ✓ Tag filter returned {len(challenges)} challenges")
        
        # Test 13: Get challenge detail
        if challenge_id:
            success, response = self.run_test(
                f"GET /api/challenges/{challenge_id} (detail)",
                "GET",
                f"challenges/{challenge_id}",
                200,
                use_auth=True
            )
        
        # Test 14: Create answer
        if challenge_id:
            answer_data = {
                "content": "This is a regression test answer for Phase 1 DB optimization."
            }
            success, response = self.run_test(
                f"POST /api/challenges/{challenge_id}/answers (create answer)",
                "POST",
                f"challenges/{challenge_id}/answers",
                200,
                answer_data,
                use_auth=True
            )
            
            if success:
                answer = response.json()
                print(f"   ✓ Answer created: {answer.get('answer_id')}")
        
        # Test 15: Upvote challenge
        if challenge_id:
            success, response = self.run_test(
                f"POST /api/challenges/{challenge_id}/upvote",
                "POST",
                f"challenges/{challenge_id}/upvote",
                200,
                use_auth=True
            )
        
        # Test 16: Dashboard stats
        success, response = self.run_test(
            "GET /api/dashboard/stats",
            "GET",
            "dashboard/stats",
            200,
            use_auth=True
        )
        
        if success:
            stats = response.json()
            print(f"   ✓ Stats: {stats.get('total_members')} members, {stats.get('total_challenges')} challenges")
        
        # Test 17: Leaderboard
        success, response = self.run_test(
            "GET /api/leaderboard",
            "GET",
            "leaderboard",
            200,
            use_auth=True
        )
        
        if success:
            leaderboard = response.json()
            print(f"   ✓ Leaderboard: {len(leaderboard)} entries")
        
        # Test 18: Profile stats
        success, response = self.run_test(
            "GET /api/profile/stats",
            "GET",
            "profile/stats",
            200,
            use_auth=True
        )
        
        return success

    def test_10_verify_ttl_index(self):
        """Test 19: Verify TTL index exists on user_sessions.expires_at"""
        print("\n" + "="*70)
        print("🗄️  TEST SUITE 4: INDEX VERIFICATION")
        print("="*70)
        
        print(f"\n🔍 Test {self.tests_run + 1}: Verify TTL index on user_sessions.expires_at")
        self.tests_run += 1
        
        try:
            indexes = list(self.db.user_sessions.list_indexes())
            
            ttl_index_found = False
            for index in indexes:
                if index.get("name") == "ttl_expires_at":
                    ttl_index_found = True
                    expire_after = index.get("expireAfterSeconds")
                    print(f"   ✅ PASSED - TTL index found")
                    print(f"   ✓ Index name: {index.get('name')}")
                    print(f"   ✓ Keys: {index.get('key')}")
                    print(f"   ✓ expireAfterSeconds: {expire_after}")
                    self.tests_passed += 1
                    self.test_results.append({"name": "Verify TTL index", "status": "PASSED"})
                    break
            
            if not ttl_index_found:
                print(f"   ❌ FAILED - TTL index 'ttl_expires_at' not found")
                print(f"   Available indexes: {[idx.get('name') for idx in indexes]}")
                self.test_results.append({"name": "Verify TTL index", "status": "FAILED", "error": "Index not found"})
                return False
            
            return True
            
        except Exception as e:
            print(f"   ❌ FAILED - Exception: {str(e)}")
            self.test_results.append({"name": "Verify TTL index", "status": "EXCEPTION", "error": str(e)})
            return False

    def test_11_verify_all_indexes(self):
        """Test 20: Verify all 19 indexes from INDEX_REGISTRY"""
        print(f"\n🔍 Test {self.tests_run + 1}: Verify all 19 indexes from INDEX_REGISTRY")
        self.tests_run += 1
        
        expected_indexes = {
            "users": ["uniq_user_id", "uniq_email", "ix_role", "ix_status", "ix_points_desc", "ix_created_desc"],
            "user_sessions": ["uniq_session_token", "ix_user_id", "ttl_expires_at"],
            "challenges": ["uniq_challenge_id", "ix_created_desc", "ix_author_created", "ix_tags", "txt_title_description"],
            "answers": ["uniq_answer_id", "ix_challenge_upvotes", "ix_author_created", "ix_created_desc"],
            "ai_history": ["ix_user_created"],
            "api_usage": ["uniq_user_date"]
        }
        
        try:
            all_found = True
            total_expected = sum(len(indexes) for indexes in expected_indexes.values())
            total_found = 0
            
            for collection_name, expected_names in expected_indexes.items():
                collection = self.db[collection_name]
                indexes = list(collection.list_indexes())
                index_names = [idx.get("name") for idx in indexes]
                
                for expected_name in expected_names:
                    if expected_name in index_names:
                        total_found += 1
                    else:
                        print(f"   ⚠️  Missing index: {collection_name}.{expected_name}")
                        all_found = False
            
            if all_found:
                self.tests_passed += 1
                print(f"   ✅ PASSED - All {total_expected} indexes found")
                self.test_results.append({"name": "Verify all 19 indexes", "status": "PASSED"})
                return True
            else:
                print(f"   ❌ FAILED - Found {total_found}/{total_expected} indexes")
                self.test_results.append({"name": "Verify all 19 indexes", "status": "FAILED", "found": total_found, "expected": total_expected})
                return False
                
        except Exception as e:
            print(f"   ❌ FAILED - Exception: {str(e)}")
            self.test_results.append({"name": "Verify all 19 indexes", "status": "EXCEPTION", "error": str(e)})
            return False

    def run_all_tests(self):
        """Run all regression tests"""
        print("\n🚀 Starting Phase 1 DB Optimization Regression Tests")
        print("="*70)
        
        # Test Suite 1: Auth Flow (session storage changed)
        self.test_1_auth_register()
        self.test_2_verify_session_datetime()
        self.test_3_auth_me()
        self.test_4_auth_login()
        self.test_5_auth_me_again()
        self.test_6_auth_logout()
        self.test_7_auth_me_after_logout()
        
        # Test Suite 2: Unique Index Enforcement
        self.test_8_unique_index_enforcement()
        
        # Test Suite 3: Core Endpoints Smoke
        self.test_9_core_endpoints_smoke()
        
        # Test Suite 4: Index Verification
        self.test_10_verify_ttl_index()
        self.test_11_verify_all_indexes()
        
        # Final summary
        print("\n" + "="*70)
        print("📊 REGRESSION TEST SUMMARY")
        print("="*70)
        print(f"✅ Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"📈 Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Show failed tests
        failed_tests = [t for t in self.test_results if t["status"] != "PASSED"]
        if failed_tests:
            print(f"\n❌ Failed tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   - {test['name']}: {test['status']}")
        
        # Test credentials for main agent
        if self.test_user:
            print(f"\n📝 Test Credentials Created:")
            print(f"   Email: {self.test_user['email']}")
            print(f"   Password: {self.test_user['password']}")
            print(f"   User ID: {self.test_user['user_id']}")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All regression tests passed!")
            return True
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} test(s) failed")
            return False

    def cleanup(self):
        """Close MongoDB connection"""
        if self.mongo_client:
            self.mongo_client.close()

def main():
    tester = Phase1RegressionTester()
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    finally:
        tester.cleanup()

if __name__ == "__main__":
    sys.exit(main())
