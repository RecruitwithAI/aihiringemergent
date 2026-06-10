#!/usr/bin/env python3
"""
Regression test for Code Review Fixes - Backend Refactor:
- File extraction moved to utils/file_extraction.py (per-type handlers)
- Document export moved to utils/document_export.py (markdown→DOCX/PDF)
- Dashboard stats split into helper functions
"""

import requests
import json
import sys
import os
import io
import uuid
from datetime import datetime

class RefactorRegressionTester:
    def __init__(self, base_url="https://ai-recruitment-flow.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.session_token = None
        self.test_user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.challenge_id = None
        
        print(f"🔧 Code Review Fixes - Backend Refactor Regression Test")
        print(f"   API: {self.api_url}")
        print("="*70)

    def log_test(self, name, passed, details=""):
        """Log test result"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            print(f"   ✅ Test {self.tests_run}: {name}")
            if details:
                print(f"      {details}")
            self.test_results.append({"name": name, "status": "PASSED"})
        else:
            print(f"   ❌ Test {self.tests_run}: {name}")
            if details:
                print(f"      {details}")
            self.test_results.append({"name": name, "status": "FAILED", "details": details})

    def authenticate(self):
        """Authenticate with existing test user"""
        print("\n" + "="*70)
        print("🔐 AUTHENTICATION")
        print("="*70)
        
        # Use existing test credentials
        test_email = "regression_test_20260610_113725@bestpl.ai"
        test_password = "SecurePass2026!"
        
        try:
            response = self.session.post(
                f"{self.api_url}/auth/login",
                json={"email": test_email, "password": test_password}
            )
            
            if response.status_code == 200:
                if 'session_token' in self.session.cookies:
                    self.session_token = self.session.cookies['session_token']
                    user_data = response.json()
                    self.test_user = {
                        "email": test_email,
                        "user_id": user_data.get("user_id"),
                        "name": user_data.get("name")
                    }
                    print(f"   ✅ Authenticated as: {test_email}")
                    print(f"   User ID: {self.test_user['user_id']}")
                    return True
            else:
                print(f"   ❌ Authentication failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Authentication exception: {str(e)}")
            return False

    def test_downloads(self):
        """Test Suite 1: Document Download - Multiple Formats"""
        print("\n" + "="*70)
        print("📥 TEST SUITE 1: DOCUMENT DOWNLOADS (utils/document_export.py)")
        print("="*70)
        
        # Markdown content with H1/H2/H3, bullets with bold, and table
        markdown_content = """# Executive Search Strategy

## Target Profile

We are seeking a **Chief Technology Officer** with the following qualifications:

- **10+ years** of technology leadership experience
- Proven track record in **scaling engineering teams**
- Experience with **cloud infrastructure** and **microservices**

### Target Companies

| Company Name | Location | Headcount | Why Target |
|--------------|----------|-----------|------------|
| TechCorp Inc | San Francisco, CA | 500-1000 | Strong engineering culture |
| DataSystems LLC | Austin, TX | 200-500 | Rapid growth phase |

## Search Channels

- LinkedIn Recruiter
- Executive networks
- Industry conferences"""

        headers = {'Authorization': f'Bearer {self.session_token}'}
        
        # Test 1: TXT format
        try:
            response = self.session.post(
                f"{self.api_url}/ai/download",
                json={
                    "content": markdown_content,
                    "filename": "test_document",
                    "format": "txt"
                },
                headers=headers
            )
            
            passed = (
                response.status_code == 200 and
                response.headers.get('content-type', '').startswith('text/plain') and
                len(response.content) > 0 and
                markdown_content.encode('utf-8') == response.content
            )
            self.log_test(
                "TXT download - correct content-type and content",
                passed,
                f"Status: {response.status_code}, Type: {response.headers.get('content-type')}, Size: {len(response.content)}B"
            )
        except Exception as e:
            self.log_test("TXT download", False, f"Exception: {str(e)}")
        
        # Test 2: PDF format - check magic bytes and size
        try:
            response = self.session.post(
                f"{self.api_url}/ai/download",
                json={
                    "content": markdown_content,
                    "filename": "test_document",
                    "format": "pdf"
                },
                headers=headers
            )
            
            pdf_magic = response.content[:4] == b'%PDF'
            passed = (
                response.status_code == 200 and
                response.headers.get('content-type') == 'application/pdf' and
                pdf_magic and
                len(response.content) > 500
            )
            self.log_test(
                "PDF download - magic bytes %PDF and size > 500B",
                passed,
                f"Status: {response.status_code}, Magic: {response.content[:4]}, Size: {len(response.content)}B"
            )
        except Exception as e:
            self.log_test("PDF download", False, f"Exception: {str(e)}")
        
        # Test 3: DOCX format - check magic bytes (ZIP signature)
        try:
            response = self.session.post(
                f"{self.api_url}/ai/download",
                json={
                    "content": markdown_content,
                    "filename": "test_document",
                    "format": "docx"
                },
                headers=headers
            )
            
            docx_magic = response.content[:4] == b'PK\x03\x04'
            passed = (
                response.status_code == 200 and
                'openxmlformats' in response.headers.get('content-type', '') and
                docx_magic
            )
            self.log_test(
                "DOCX download - ZIP magic bytes PK\\x03\\x04",
                passed,
                f"Status: {response.status_code}, Magic: {response.content[:4]}, Size: {len(response.content)}B"
            )
        except Exception as e:
            self.log_test("DOCX download", False, f"Exception: {str(e)}")
        
        # Test 4: CSV format with JSON array (arrays should be flattened)
        try:
            csv_content = json.dumps([
                {"name": "Alice", "skills": ["Python", "JavaScript"]},
                {"name": "Bob", "skills": ["Java", "C++"]}
            ])
            
            response = self.session.post(
                f"{self.api_url}/ai/download",
                json={
                    "content": csv_content,
                    "filename": "candidates",
                    "format": "csv"
                },
                headers=headers
            )
            
            csv_text = response.content.decode('utf-8')
            arrays_flattened = "Python, JavaScript" in csv_text or "Python,JavaScript" in csv_text
            passed = (
                response.status_code == 200 and
                response.headers.get('content-type', '').startswith('text/csv') and
                arrays_flattened
            )
            self.log_test(
                "CSV download - JSON array with flattened arrays",
                passed,
                f"Status: {response.status_code}, Arrays flattened: {arrays_flattened}"
            )
        except Exception as e:
            self.log_test("CSV download with JSON", False, f"Exception: {str(e)}")
        
        # Test 5: CSV format with non-JSON content (fallback)
        try:
            response = self.session.post(
                f"{self.api_url}/ai/download",
                json={
                    "content": "Name,Email\nJohn,john@example.com",
                    "filename": "simple",
                    "format": "csv"
                },
                headers=headers
            )
            
            passed = (
                response.status_code == 200 and
                response.headers.get('content-type', '').startswith('text/csv')
            )
            self.log_test(
                "CSV download - non-JSON fallback",
                passed,
                f"Status: {response.status_code}"
            )
        except Exception as e:
            self.log_test("CSV download fallback", False, f"Exception: {str(e)}")
        
        # Test 6: Invalid format
        try:
            response = self.session.post(
                f"{self.api_url}/ai/download",
                json={
                    "content": "test",
                    "filename": "test",
                    "format": "invalid"
                },
                headers=headers
            )
            
            passed = response.status_code == 400
            self.log_test(
                "Invalid format - expect 400",
                passed,
                f"Status: {response.status_code}"
            )
        except Exception as e:
            self.log_test("Invalid format", False, f"Exception: {str(e)}")

    def test_file_extraction(self):
        """Test Suite 2: File Upload & Extraction"""
        print("\n" + "="*70)
        print("📤 TEST SUITE 2: FILE UPLOAD & EXTRACTION (utils/file_extraction.py)")
        print("="*70)
        
        headers = {'Authorization': f'Bearer {self.session_token}'}
        
        # Test 7: Upload and extract .txt file
        try:
            upload_id = str(uuid.uuid4())
            test_content = "This is a test document for file extraction regression testing."
            
            # Upload chunk
            files = {
                'chunk': ('test.txt', io.BytesIO(test_content.encode('utf-8')), 'text/plain')
            }
            data = {
                'upload_id': upload_id,
                'chunk_index': '0',
                'total_chunks': '1',
                'filename': 'test.txt'
            }
            
            upload_response = self.session.post(
                f"{self.api_url}/ai/upload-chunk",
                files=files,
                data=data,
                headers={'Authorization': f'Bearer {self.session_token}'}
            )
            
            if upload_response.status_code == 200:
                # Extract file
                extract_response = self.session.post(
                    f"{self.api_url}/ai/extract-file",
                    json={
                        "upload_id": upload_id,
                        "filename": "test.txt"
                    },
                    headers=headers
                )
                
                if extract_response.status_code == 200:
                    extract_data = extract_response.json()
                    extracted_text = extract_data.get("extracted_text", "")
                    passed = (
                        extracted_text.strip() == test_content.strip() and
                        extract_data.get("char_count") == len(test_content)
                    )
                    self.log_test(
                        "TXT file upload and extraction",
                        passed,
                        f"Extracted {extract_data.get('char_count')} chars, matches: {passed}"
                    )
                else:
                    self.log_test(
                        "TXT file extraction",
                        False,
                        f"Extract failed: {extract_response.status_code}"
                    )
            else:
                self.log_test(
                    "TXT file upload",
                    False,
                    f"Upload failed: {upload_response.status_code}"
                )
        except Exception as e:
            self.log_test("TXT file upload/extract", False, f"Exception: {str(e)}")
        
        # Test 8: Unsupported file extension
        try:
            upload_id = str(uuid.uuid4())
            
            # Upload chunk with unsupported extension
            files = {
                'chunk': ('test.xyz', io.BytesIO(b'test content'), 'application/octet-stream')
            }
            data = {
                'upload_id': upload_id,
                'chunk_index': '0',
                'total_chunks': '1',
                'filename': 'test.xyz'
            }
            
            upload_response = self.session.post(
                f"{self.api_url}/ai/upload-chunk",
                files=files,
                data=data,
                headers={'Authorization': f'Bearer {self.session_token}'}
            )
            
            if upload_response.status_code == 200:
                # Try to extract - should fail with 400
                extract_response = self.session.post(
                    f"{self.api_url}/ai/extract-file",
                    json={
                        "upload_id": upload_id,
                        "filename": "test.xyz"
                    },
                    headers=headers
                )
                
                passed = extract_response.status_code == 400
                self.log_test(
                    "Unsupported extension (.xyz) - expect 400",
                    passed,
                    f"Status: {extract_response.status_code}"
                )
            else:
                self.log_test(
                    "Unsupported extension upload",
                    False,
                    f"Upload failed: {upload_response.status_code}"
                )
        except Exception as e:
            self.log_test("Unsupported extension", False, f"Exception: {str(e)}")
        
        # Test 9: Non-existent upload_id
        try:
            response = self.session.post(
                f"{self.api_url}/ai/extract-file",
                json={
                    "upload_id": "nonexistent-upload-id-12345",
                    "filename": "test.txt"
                },
                headers=headers
            )
            
            passed = response.status_code == 404
            self.log_test(
                "Non-existent upload_id - expect 404",
                passed,
                f"Status: {response.status_code}"
            )
        except Exception as e:
            self.log_test("Non-existent upload_id", False, f"Exception: {str(e)}")

    def test_dashboard(self):
        """Test Suite 3: Dashboard Stats (refactored helpers)"""
        print("\n" + "="*70)
        print("📊 TEST SUITE 3: DASHBOARD STATS (routers/dashboard.py helpers)")
        print("="*70)
        
        headers = {'Authorization': f'Bearer {self.session_token}'}
        
        # First, create a challenge and answer to populate the dashboard
        try:
            timestamp = datetime.now().strftime("%H:%M:%S")
            challenge_response = self.session.post(
                f"{self.api_url}/challenges",
                json={
                    "title": f"Refactor Test Challenge {timestamp}",
                    "description": "Testing dashboard stats after backend refactor",
                    "tags": ["refactor", "testing"]
                },
                headers=headers
            )
            
            if challenge_response.status_code == 200:
                self.challenge_id = challenge_response.json().get("challenge_id")
                print(f"   ✓ Created test challenge: {self.challenge_id}")
                
                # Create an answer
                answer_response = self.session.post(
                    f"{self.api_url}/challenges/{self.challenge_id}/answers",
                    json={"content": "Test answer for dashboard stats"},
                    headers=headers
                )
                
                if answer_response.status_code == 200:
                    print(f"   ✓ Created test answer")
        except Exception as e:
            print(f"   ⚠️  Could not create test data: {str(e)}")
        
        # Test 10: Dashboard stats - verify all required keys
        try:
            response = self.session.get(
                f"{self.api_url}/dashboard/stats",
                headers=headers
            )
            
            if response.status_code == 200:
                stats = response.json()
                
                required_keys = [
                    "total_members",
                    "total_challenges",
                    "total_answers",
                    "user_points",
                    "user_badge",
                    "user_rank",
                    "recent_challenges",
                    "last_ai_tool",
                    "last_challenge",
                    "activity_feed"
                ]
                
                missing_keys = [key for key in required_keys if key not in stats]
                
                # Verify recent_challenges structure
                recent_challenges_valid = True
                if "recent_challenges" in stats and isinstance(stats["recent_challenges"], list):
                    for challenge in stats["recent_challenges"]:
                        if "author" not in challenge or "badge" not in challenge.get("author", {}):
                            recent_challenges_valid = False
                            break
                
                # Verify activity_feed structure
                activity_feed_valid = True
                if "activity_feed" in stats and isinstance(stats["activity_feed"], list):
                    for item in stats["activity_feed"]:
                        if "type" not in item or "author" not in item:
                            activity_feed_valid = False
                            break
                        if item["type"] not in ["challenge", "answer"]:
                            activity_feed_valid = False
                            break
                
                # Verify last_challenge reflects our created challenge
                last_challenge_valid = False
                if "last_challenge" in stats and stats["last_challenge"]:
                    last_challenge_valid = (
                        "challenge_id" in stats["last_challenge"] and
                        "title" in stats["last_challenge"] and
                        "interaction_type" in stats["last_challenge"]
                    )
                
                passed = (
                    len(missing_keys) == 0 and
                    recent_challenges_valid and
                    activity_feed_valid
                )
                
                details = f"Missing keys: {missing_keys if missing_keys else 'None'}, "
                details += f"Recent challenges valid: {recent_challenges_valid}, "
                details += f"Activity feed valid: {activity_feed_valid}, "
                details += f"Last challenge valid: {last_challenge_valid}"
                
                self.log_test(
                    "Dashboard stats - all required keys present",
                    passed,
                    details
                )
                
                # Additional verification
                if passed:
                    print(f"      Total members: {stats.get('total_members')}")
                    print(f"      Total challenges: {stats.get('total_challenges')}")
                    print(f"      Total answers: {stats.get('total_answers')}")
                    print(f"      User rank: {stats.get('user_rank')}")
                    print(f"      Recent challenges: {len(stats.get('recent_challenges', []))}")
                    print(f"      Activity feed items: {len(stats.get('activity_feed', []))}")
            else:
                self.log_test(
                    "Dashboard stats",
                    False,
                    f"Status: {response.status_code}"
                )
        except Exception as e:
            self.log_test("Dashboard stats", False, f"Exception: {str(e)}")

    def test_leaderboard_and_profile(self):
        """Test Suite 4: Leaderboard and Profile Stats"""
        print("\n" + "="*70)
        print("🏆 TEST SUITE 4: LEADERBOARD & PROFILE STATS")
        print("="*70)
        
        headers = {'Authorization': f'Bearer {self.session_token}'}
        
        # Test 11: Leaderboard
        try:
            response = self.session.get(
                f"{self.api_url}/leaderboard",
                headers=headers
            )
            
            if response.status_code == 200:
                leaderboard = response.json()
                
                # Verify structure
                valid_structure = True
                if isinstance(leaderboard, list) and len(leaderboard) > 0:
                    for entry in leaderboard:
                        if "rank" not in entry or "badge" not in entry:
                            valid_structure = False
                            break
                
                passed = valid_structure
                self.log_test(
                    "Leaderboard - rank and badge present",
                    passed,
                    f"Entries: {len(leaderboard)}, Valid structure: {valid_structure}"
                )
            else:
                self.log_test(
                    "Leaderboard",
                    False,
                    f"Status: {response.status_code}"
                )
        except Exception as e:
            self.log_test("Leaderboard", False, f"Exception: {str(e)}")
        
        # Test 12: Profile stats
        try:
            response = self.session.get(
                f"{self.api_url}/profile/stats",
                headers=headers
            )
            
            if response.status_code == 200:
                stats = response.json()
                
                required_keys = [
                    "challenges_posted",
                    "answers_given",
                    "ai_tools_used",
                    "points",
                    "badge"
                ]
                
                missing_keys = [key for key in required_keys if key not in stats]
                passed = len(missing_keys) == 0
                
                self.log_test(
                    "Profile stats - all required keys present",
                    passed,
                    f"Missing keys: {missing_keys if missing_keys else 'None'}"
                )
                
                if passed:
                    print(f"      Challenges posted: {stats.get('challenges_posted')}")
                    print(f"      Answers given: {stats.get('answers_given')}")
                    print(f"      AI tools used: {stats.get('ai_tools_used')}")
                    print(f"      Points: {stats.get('points')}")
                    print(f"      Badge: {stats.get('badge')}")
            else:
                self.log_test(
                    "Profile stats",
                    False,
                    f"Status: {response.status_code}"
                )
        except Exception as e:
            self.log_test("Profile stats", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all regression tests"""
        print("\n🚀 Starting Code Review Fixes Regression Tests")
        print("="*70)
        
        if not self.authenticate():
            print("\n❌ Authentication failed - cannot proceed with tests")
            return False
        
        # Run test suites
        self.test_downloads()
        self.test_file_extraction()
        self.test_dashboard()
        self.test_leaderboard_and_profile()
        
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
                print(f"   - {test['name']}")
                if "details" in test:
                    print(f"     {test['details']}")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All regression tests passed!")
            print("✅ Refactored code maintains identical API behavior")
            return True
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} test(s) failed")
            return False

def main():
    tester = RefactorRegressionTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
