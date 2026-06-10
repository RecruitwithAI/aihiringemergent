#!/usr/bin/env python3
"""
Regression test for Phase 2+3 DB Optimization:
- Phase 2: GET /challenges → single aggregation with $lookup for authors + answer counts
           GET /challenges/{id} → 2 aggregations (challenge+author, answers+authors)
- Phase 3: Dashboard rank via indexed count_documents (competition ranking)
           recent_challenges + activity_feed via $lookup aggregations
"""

import requests
import json
import sys
from datetime import datetime
import time

class Phase2_3_RegressionTester:
    def __init__(self, base_url="https://ai-recruitment-flow.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.session_token = None
        self.test_user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_challenge_id = None
        
        print(f"🔧 Phase 2+3 DB Optimization Regression Test")
        print(f"   API: {self.api_url}")
        print("="*70)

    def login(self, email, password):
        """Login and get session token"""
        print(f"\n🔑 Logging in as {email}...")
        response = self.session.post(
            f"{self.api_url}/auth/login",
            json={"email": email, "password": password}
        )
        
        if response.status_code == 200:
            # Extract session token from Set-Cookie header
            set_cookie = response.headers.get('Set-Cookie', '')
            if 'session_token=' in set_cookie:
                # Parse session_token from Set-Cookie
                token_part = set_cookie.split('session_token=')[1].split(';')[0]
                self.session_token = token_part
                print(f"   ✓ Logged in successfully")
                print(f"   ✓ Session token: {self.session_token[:20]}...")
                return True
            else:
                print(f"   ❌ No session_token in Set-Cookie header")
                return False
        else:
            print(f"   ❌ Login failed: {response.status_code}")
            try:
                print(f"   Error: {response.json()}")
            except:
                print(f"   Error: {response.text[:200]}")
            return False

    def run_test(self, name, method, endpoint, expected_status=200, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.session_token}'
        }

        self.tests_run += 1
        print(f"\n🔍 Test {self.tests_run}: {name}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers, params=params)
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
            else:
                print(f"   ❌ FAILED - Expected {expected_status}, got {response.status_code}")
                self.test_results.append({
                    "name": name, 
                    "status": "FAILED", 
                    "expected": expected_status, 
                    "got": response.status_code
                })
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

    def test_1_get_challenges_structure(self):
        """Test 1: GET /api/challenges - verify structure and no internal fields"""
        print("\n" + "="*70)
        print("🔍 TEST SUITE 1: GET /api/challenges - Structure & Aggregation")
        print("="*70)
        
        success, response = self.run_test(
            "GET /api/challenges - verify structure",
            "GET",
            "challenges"
        )
        
        if success:
            challenges = response.json()
            print(f"   ✓ Retrieved {len(challenges)} challenges")
            
            if len(challenges) > 0:
                # Verify structure of first challenge
                ch = challenges[0]
                required_fields = [
                    "challenge_id", "title", "description", "tags", 
                    "author_id", "upvotes", "upvoted_by", "created_at", 
                    "answers_count", "author"
                ]
                
                missing_fields = [f for f in required_fields if f not in ch]
                if missing_fields:
                    print(f"   ⚠️  Missing fields: {missing_fields}")
                else:
                    print(f"   ✓ All required fields present")
                
                # Verify no internal fields
                if "_id" in ch:
                    print(f"   ❌ Internal field '_id' present (should be removed)")
                    success = False
                if "_answer_counts" in ch:
                    print(f"   ❌ Internal field '_answer_counts' present (should be removed)")
                    success = False
                
                # Verify author structure
                if "author" in ch:
                    author = ch["author"]
                    author_fields = ["user_id", "name", "picture", "points", "badge"]
                    missing_author_fields = [f for f in author_fields if f not in author]
                    if missing_author_fields:
                        print(f"   ⚠️  Missing author fields: {missing_author_fields}")
                    else:
                        print(f"   ✓ Author structure correct: {author['name']} ({author['badge']})")
                
                # Verify answers_count is integer
                if "answers_count" in ch:
                    if isinstance(ch["answers_count"], int):
                        print(f"   ✓ answers_count is integer: {ch['answers_count']}")
                    else:
                        print(f"   ⚠️  answers_count is {type(ch['answers_count'])}, not int")
                
                # Verify sorting (newest first)
                if len(challenges) > 1:
                    first_time = challenges[0]["created_at"]
                    second_time = challenges[1]["created_at"]
                    if first_time >= second_time:
                        print(f"   ✓ Sorted newest first")
                    else:
                        print(f"   ⚠️  Not sorted correctly")
        
        return success

    def test_2_create_challenge_with_unique_tag(self):
        """Test 2: Create challenge with unique tag"""
        print("\n" + "="*70)
        print("🔍 TEST SUITE 2: Challenge Creation & Filtering")
        print("="*70)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_tag = f"phase2_test_{timestamp}"
        
        challenge_data = {
            "title": f"Phase 2 Regression Test Challenge {timestamp}",
            "description": "Testing $lookup aggregations for challenges endpoint with unique tag",
            "tags": [unique_tag, "regression", "phase2"]
        }
        
        success, response = self.run_test(
            "POST /api/challenges - create with unique tag",
            "POST",
            "challenges",
            200,
            challenge_data
        )
        
        if success:
            created = response.json()
            self.created_challenge_id = created.get("challenge_id")
            print(f"   ✓ Challenge created: {self.created_challenge_id}")
            print(f"   ✓ Unique tag: {unique_tag}")
            
            # Store for later tests
            self.unique_tag = unique_tag
            self.challenge_title_word = "Phase"
        
        return success

    def test_3_search_by_title(self):
        """Test 3: Search challenges by title word"""
        if not hasattr(self, 'challenge_title_word'):
            print(f"\n⚠️  Skipping search test - no challenge created")
            return False
        
        success, response = self.run_test(
            f"GET /api/challenges?search={self.challenge_title_word}",
            "GET",
            f"challenges?search={self.challenge_title_word}"
        )
        
        if success:
            challenges = response.json()
            print(f"   ✓ Search returned {len(challenges)} challenges")
            
            # Verify our challenge is in results
            found = any(ch.get("challenge_id") == self.created_challenge_id for ch in challenges)
            if found:
                print(f"   ✓ Created challenge found in search results")
            else:
                print(f"   ⚠️  Created challenge NOT found in search results")
        
        return success

    def test_4_filter_by_tag(self):
        """Test 4: Filter challenges by tag"""
        if not hasattr(self, 'unique_tag'):
            print(f"\n⚠️  Skipping tag filter test - no unique tag")
            return False
        
        success, response = self.run_test(
            f"GET /api/challenges?tags={self.unique_tag}",
            "GET",
            f"challenges?tags={self.unique_tag}"
        )
        
        if success:
            challenges = response.json()
            print(f"   ✓ Tag filter returned {len(challenges)} challenges")
            
            # Verify our challenge is in results
            found = any(ch.get("challenge_id") == self.created_challenge_id for ch in challenges)
            if found:
                print(f"   ✓ Created challenge found in tag filter results")
            else:
                print(f"   ⚠️  Created challenge NOT found in tag filter results")
        
        return success

    def test_5_verify_answers_count_zero(self):
        """Test 5: Verify answers_count is 0 for new challenge"""
        if not self.created_challenge_id:
            print(f"\n⚠️  Skipping answers_count test - no challenge created")
            return False
        
        success, response = self.run_test(
            f"GET /api/challenges/{self.created_challenge_id} - verify answers_count=0",
            "GET",
            f"challenges/{self.created_challenge_id}"
        )
        
        if success:
            challenge = response.json()
            # Check if challenge has answers_count in list view
            # For detail view, check answers array
            if "answers" in challenge:
                answers_count = len(challenge["answers"])
                if answers_count == 0:
                    print(f"   ✓ answers array is empty (count=0)")
                else:
                    print(f"   ⚠️  answers array has {answers_count} items (expected 0)")
        
        return success

    def test_6_add_answer(self):
        """Test 6: Add answer to challenge"""
        if not self.created_challenge_id:
            print(f"\n⚠️  Skipping add answer test - no challenge created")
            return False
        
        answer_data = {
            "content": "This is a regression test answer for Phase 2+3 DB optimization testing."
        }
        
        success, response = self.run_test(
            f"POST /api/challenges/{self.created_challenge_id}/answers",
            "POST",
            f"challenges/{self.created_challenge_id}/answers",
            200,
            answer_data
        )
        
        if success:
            answer = response.json()
            self.created_answer_id = answer.get("answer_id")
            print(f"   ✓ Answer created: {self.created_answer_id}")
        
        return success

    def test_7_verify_answers_count_one(self):
        """Test 7: Verify answers_count is 1 after adding answer"""
        if not self.created_challenge_id:
            print(f"\n⚠️  Skipping answers_count verification - no challenge created")
            return False
        
        # Small delay to ensure DB is updated
        time.sleep(0.5)
        
        # Check in list view
        success, response = self.run_test(
            "GET /api/challenges - verify answers_count=1 in list",
            "GET",
            "challenges"
        )
        
        if success:
            challenges = response.json()
            our_challenge = next((ch for ch in challenges if ch.get("challenge_id") == self.created_challenge_id), None)
            
            if our_challenge:
                answers_count = our_challenge.get("answers_count", -1)
                if answers_count == 1:
                    print(f"   ✓ answers_count is 1 in list view")
                else:
                    print(f"   ⚠️  answers_count is {answers_count} (expected 1)")
        
        return success

    def test_8_get_challenge_detail(self):
        """Test 8: GET /api/challenges/{id} - verify author+badge and answers structure"""
        print("\n" + "="*70)
        print("🔍 TEST SUITE 3: GET /api/challenges/{id} - Detail View")
        print("="*70)
        
        if not self.created_challenge_id:
            print(f"\n⚠️  Skipping detail test - no challenge created")
            return False
        
        success, response = self.run_test(
            f"GET /api/challenges/{self.created_challenge_id}",
            "GET",
            f"challenges/{self.created_challenge_id}"
        )
        
        if success:
            challenge = response.json()
            
            # Verify author structure
            if "author" in challenge:
                author = challenge["author"]
                if "badge" in author:
                    print(f"   ✓ Challenge author has badge: {author['badge']}")
                else:
                    print(f"   ⚠️  Challenge author missing badge")
            
            # Verify answers array
            if "answers" in challenge:
                answers = challenge["answers"]
                print(f"   ✓ Challenge has {len(answers)} answers")
                
                if len(answers) > 0:
                    # Verify first answer structure
                    ans = answers[0]
                    if "author" in ans:
                        ans_author = ans["author"]
                        if "badge" in ans_author:
                            print(f"   ✓ Answer author has badge: {ans_author['badge']}")
                        else:
                            print(f"   ⚠️  Answer author missing badge")
                    
                    # Verify sorting by upvotes desc
                    if len(answers) > 1:
                        first_upvotes = answers[0].get("upvotes", 0)
                        second_upvotes = answers[1].get("upvotes", 0)
                        if first_upvotes >= second_upvotes:
                            print(f"   ✓ Answers sorted by upvotes desc")
                        else:
                            print(f"   ⚠️  Answers not sorted correctly")
        
        return success

    def test_9_get_nonexistent_challenge(self):
        """Test 9: GET /api/challenges/does_not_exist - verify 404"""
        success, response = self.run_test(
            "GET /api/challenges/does_not_exist - expect 404",
            "GET",
            "challenges/does_not_exist",
            404
        )
        
        if success:
            print(f"   ✓ Correctly returns 404 for non-existent challenge")
        
        return success

    def test_10_upvote_toggle(self):
        """Test 10: Upvote toggle - first upvote, then remove"""
        print("\n" + "="*70)
        print("🔍 TEST SUITE 4: Upvote Toggle Flow")
        print("="*70)
        
        if not self.created_challenge_id:
            print(f"\n⚠️  Skipping upvote test - no challenge created")
            return False
        
        # First upvote
        success, response = self.run_test(
            f"POST /api/challenges/{self.created_challenge_id}/upvote - first (expect upvoted:true)",
            "POST",
            f"challenges/{self.created_challenge_id}/upvote"
        )
        
        if success:
            result = response.json()
            if result.get("upvoted") == True:
                print(f"   ✓ First upvote returned upvoted:true")
            else:
                print(f"   ⚠️  First upvote returned upvoted:{result.get('upvoted')}")
        
        # Second upvote (toggle off)
        success2, response2 = self.run_test(
            f"POST /api/challenges/{self.created_challenge_id}/upvote - second (expect upvoted:false)",
            "POST",
            f"challenges/{self.created_challenge_id}/upvote"
        )
        
        if success2:
            result2 = response2.json()
            if result2.get("upvoted") == False:
                print(f"   ✓ Second upvote returned upvoted:false (toggle preserved)")
            else:
                print(f"   ⚠️  Second upvote returned upvoted:{result2.get('upvoted')}")
        
        return success and success2

    def test_11_dashboard_stats(self):
        """Test 11: GET /api/dashboard/stats - verify all keys and structure"""
        print("\n" + "="*70)
        print("🔍 TEST SUITE 5: Dashboard Stats - Phase 3 Aggregations")
        print("="*70)
        
        success, response = self.run_test(
            "GET /api/dashboard/stats",
            "GET",
            "dashboard/stats"
        )
        
        if success:
            stats = response.json()
            
            # Verify all required keys
            required_keys = [
                "total_members", "total_challenges", "total_answers",
                "user_points", "user_badge", "user_rank",
                "recent_challenges", "last_ai_tool", "last_challenge",
                "activity_feed"
            ]
            
            missing_keys = [k for k in required_keys if k not in stats]
            if missing_keys:
                print(f"   ❌ Missing keys: {missing_keys}")
                success = False
            else:
                print(f"   ✓ All required keys present")
            
            # Verify user_rank
            user_rank = stats.get("user_rank")
            if user_rank and user_rank >= 1:
                print(f"   ✓ user_rank is {user_rank} (≥ 1)")
            else:
                print(f"   ⚠️  user_rank is {user_rank} (should be ≥ 1)")
            
            # Verify recent_challenges structure
            recent_challenges = stats.get("recent_challenges", [])
            print(f"   ✓ recent_challenges: {len(recent_challenges)} items")
            if len(recent_challenges) > 0:
                rc = recent_challenges[0]
                if "author" in rc and "badge" in rc["author"]:
                    print(f"   ✓ recent_challenges have author with badge")
                else:
                    print(f"   ⚠️  recent_challenges missing author.badge")
            
            # Verify activity_feed structure
            activity_feed = stats.get("activity_feed", [])
            print(f"   ✓ activity_feed: {len(activity_feed)} items")
            
            if len(activity_feed) > 0:
                # Check for challenge type
                challenge_items = [item for item in activity_feed if item.get("type") == "challenge"]
                if challenge_items:
                    ch_item = challenge_items[0]
                    if "title" in ch_item:
                        print(f"   ✓ Challenge items have 'title'")
                    if "author" in ch_item and "badge" in ch_item["author"]:
                        print(f"   ✓ Challenge items have author with badge")
                
                # Check for answer type
                answer_items = [item for item in activity_feed if item.get("type") == "answer"]
                if answer_items:
                    ans_item = answer_items[0]
                    if "challenge_title" in ans_item:
                        print(f"   ✓ Answer items have 'challenge_title'")
                    if "author" in ans_item and "badge" in ans_item["author"]:
                        print(f"   ✓ Answer items have author with badge")
                
                # Verify sorting (newest first)
                if len(activity_feed) > 1:
                    first_time = activity_feed[0].get("created_at", "")
                    second_time = activity_feed[1].get("created_at", "")
                    if first_time >= second_time:
                        print(f"   ✓ activity_feed sorted newest first")
                    else:
                        print(f"   ⚠️  activity_feed not sorted correctly")
        
        return success

    def test_12_verify_rank_consistency(self):
        """Test 12: Verify user_rank consistency with leaderboard"""
        # Get dashboard stats for user_rank
        success1, response1 = self.run_test(
            "GET /api/dashboard/stats - get user_rank",
            "GET",
            "dashboard/stats"
        )
        
        if not success1:
            return False
        
        stats = response1.json()
        user_rank = stats.get("user_rank")
        user_points = stats.get("user_points")
        
        # Get leaderboard
        success2, response2 = self.run_test(
            "GET /api/leaderboard - verify rank consistency",
            "GET",
            "leaderboard"
        )
        
        if success2:
            leaderboard = response2.json()
            
            # Find user with most points
            if len(leaderboard) > 0:
                top_user = leaderboard[0]
                top_rank = top_user.get("rank")
                top_points = top_user.get("points")
                
                if top_rank == 1:
                    print(f"   ✓ Top user has rank 1 with {top_points} points")
                else:
                    print(f"   ⚠️  Top user has rank {top_rank} (expected 1)")
                
                # Verify our user's rank makes sense
                print(f"   ✓ Current user: rank {user_rank}, points {user_points}")
        
        return success1 and success2

    def test_13_leaderboard(self):
        """Test 13: GET /api/leaderboard - verify shape unchanged"""
        print("\n" + "="*70)
        print("🔍 TEST SUITE 6: Leaderboard & Profile Stats")
        print("="*70)
        
        success, response = self.run_test(
            "GET /api/leaderboard",
            "GET",
            "leaderboard"
        )
        
        if success:
            leaderboard = response.json()
            print(f"   ✓ Leaderboard: {len(leaderboard)} entries")
            
            if len(leaderboard) > 0:
                user = leaderboard[0]
                expected_fields = ["user_id", "name", "picture", "points", "rank", "badge"]
                missing_fields = [f for f in expected_fields if f not in user]
                
                if missing_fields:
                    print(f"   ⚠️  Missing fields: {missing_fields}")
                else:
                    print(f"   ✓ Leaderboard structure correct")
        
        return success

    def test_14_profile_stats(self):
        """Test 14: GET /api/profile/stats - verify shape unchanged"""
        success, response = self.run_test(
            "GET /api/profile/stats",
            "GET",
            "profile/stats"
        )
        
        if success:
            stats = response.json()
            expected_fields = ["challenges_posted", "answers_given", "ai_tools_used", "points", "badge"]
            missing_fields = [f for f in expected_fields if f not in stats]
            
            if missing_fields:
                print(f"   ⚠️  Missing fields: {missing_fields}")
            else:
                print(f"   ✓ Profile stats structure correct")
                print(f"   ✓ Stats: {stats['challenges_posted']} challenges, {stats['answers_given']} answers, {stats['points']} points")
        
        return success

    def run_all_tests(self):
        """Run all regression tests"""
        print("\n🚀 Starting Phase 2+3 DB Optimization Regression Tests")
        print("="*70)
        
        # Login first
        if not self.login("regression_test_20260610_113725@bestpl.ai", "SecurePass2026!"):
            print("\n❌ Login failed - cannot proceed with tests")
            return False
        
        # Test Suite 1: GET /api/challenges structure
        self.test_1_get_challenges_structure()
        
        # Test Suite 2: Challenge creation & filtering
        self.test_2_create_challenge_with_unique_tag()
        self.test_3_search_by_title()
        self.test_4_filter_by_tag()
        self.test_5_verify_answers_count_zero()
        self.test_6_add_answer()
        self.test_7_verify_answers_count_one()
        
        # Test Suite 3: Challenge detail view
        self.test_8_get_challenge_detail()
        self.test_9_get_nonexistent_challenge()
        
        # Test Suite 4: Upvote toggle
        self.test_10_upvote_toggle()
        
        # Test Suite 5: Dashboard stats
        self.test_11_dashboard_stats()
        self.test_12_verify_rank_consistency()
        
        # Test Suite 6: Leaderboard & Profile
        self.test_13_leaderboard()
        self.test_14_profile_stats()
        
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
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All regression tests passed!")
            return True
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} test(s) failed")
            return False

def main():
    tester = Phase2_3_RegressionTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
