#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Refactored AI Tools Application
Tests all 6 AI tools with their specific features and configurations
"""

import requests
import json
import sys
import time
import io
from datetime import datetime

class AIToolsBackendTester:
    def __init__(self, base_url="https://ai-tools-hub-69.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = []
        self.authenticated = False
        print(f"🔧 Testing AI Tools Backend at: {self.api_url}")
        print("="*70)

    def log_test(self, name, passed, details=""):
        """Log test result"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            print(f"✅ {name}")
            if details:
                print(f"   {details}")
        else:
            self.tests_failed.append(name)
            print(f"❌ {name}")
            if details:
                print(f"   {details}")

    def test_authentication(self):
        """Test user authentication"""
        print("\n" + "="*70)
        print("🔐 AUTHENTICATION TEST")
        print("="*70)
        
        # Login with test credentials
        login_data = {
            "email": "saba@bestpl.ai",
            "password": "Bestpl2026!"
        }
        
        try:
            response = self.session.post(
                f"{self.api_url}/auth/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                user_data = response.json()
                self.authenticated = True
                self.log_test(
                    "User Login",
                    True,
                    f"Logged in as: {user_data.get('name', 'Unknown')} ({user_data.get('email', '')})"
                )
                return True
            else:
                self.log_test(
                    "User Login",
                    False,
                    f"Status: {response.status_code}, Response: {response.text[:200]}"
                )
                return False
                
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
            return False

    def test_usage_stats(self):
        """Test GET /api/ai/usage endpoint"""
        print("\n" + "="*70)
        print("📊 USAGE STATS TEST")
        print("="*70)
        
        try:
            response = self.session.get(
                f"{self.api_url}/ai/usage",
                timeout=10
            )
            
            if response.status_code == 200:
                usage_data = response.json()
                daily_usage = usage_data.get('daily_usage', {})
                has_own_key = usage_data.get('has_own_api_key', False)
                
                self.log_test(
                    "Get Usage Stats",
                    True,
                    f"Used: {daily_usage.get('used', 0)}/{daily_usage.get('limit', 3)}, Has API Key: {has_own_key}"
                )
                return True
            else:
                self.log_test(
                    "Get Usage Stats",
                    False,
                    f"Status: {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test("Get Usage Stats", False, f"Exception: {str(e)}")
            return False

    def test_ai_generation(self, tool_type, prompt, context=None, expected_keywords=None):
        """Test AI generation for a specific tool"""
        try:
            request_data = {
                "tool_type": tool_type,
                "prompt": prompt
            }
            
            if context:
                request_data["context"] = context
            
            response = self.session.post(
                f"{self.api_url}/ai/generate",
                json=request_data,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result.get('response', '')
                response_length = len(ai_response)
                
                # Check if response contains expected keywords
                keywords_found = True
                if expected_keywords:
                    keywords_found = any(keyword.lower() in ai_response.lower() for keyword in expected_keywords)
                
                details = f"Response length: {response_length} chars"
                if expected_keywords and not keywords_found:
                    details += f" | Warning: Expected keywords not found"
                
                self.log_test(
                    f"AI Generate ({tool_type})",
                    True,
                    details
                )
                return True, ai_response
            else:
                error_detail = response.text[:200] if response.text else "No error message"
                self.log_test(
                    f"AI Generate ({tool_type})",
                    False,
                    f"Status: {response.status_code}, Error: {error_detail}"
                )
                return False, None
                
        except Exception as e:
            self.log_test(f"AI Generate ({tool_type})", False, f"Exception: {str(e)}")
            return False, None

    def test_all_tools(self):
        """Test AI generation for all 6 tools"""
        print("\n" + "="*70)
        print("🤖 AI GENERATION TESTS - ALL 6 TOOLS")
        print("="*70)
        
        # 1. JD Builder
        self.test_ai_generation(
            tool_type="jd-builder",
            prompt="Senior Software Engineer, full-stack, 5+ years experience",
            context="Tech startup, fast-paced environment",
            expected_keywords=["responsibilities", "qualifications", "experience"]
        )
        
        time.sleep(1)  # Rate limiting
        
        # 2. Candidate Research
        self.test_ai_generation(
            tool_type="candidate-research",
            prompt="John Doe, 10 years in software engineering, worked at Google and Meta",
            expected_keywords=["background", "career", "experience"]
        )
        
        time.sleep(1)
        
        # 3. Search Strategy (Standard)
        self.test_ai_generation(
            tool_type="search-strategy",
            prompt="Find ML engineers in Bay Area",
            expected_keywords=["search", "strategy", "target"]
        )
        
        time.sleep(1)
        
        # 4. Search Strategy (Target Company List)
        self.test_ai_generation(
            tool_type="search-strategy-targets",
            prompt="Find ML engineers in Bay Area",
            expected_keywords=["company", "location", "website"]
        )
        
        time.sleep(1)
        
        # 5. Talent Scout
        success, response = self.test_ai_generation(
            tool_type="talent-scout",
            prompt="Target Role: Senior Software Engineer\nCompany: Tech startups\nGeography: San Francisco\nCompensation: $150k-$200k\nRequirements: 5+ years, React, Node.js",
            expected_keywords=["name", "current_title", "current_employer"]
        )
        
        # Validate JSON response for Talent Scout
        if success and response:
            try:
                candidates = json.loads(response)
                if isinstance(candidates, list) and len(candidates) > 0:
                    self.log_test(
                        "Talent Scout JSON Validation",
                        True,
                        f"Returned {len(candidates)} candidates"
                    )
                else:
                    self.log_test(
                        "Talent Scout JSON Validation",
                        False,
                        "Response is not a valid candidate array"
                    )
            except json.JSONDecodeError:
                self.log_test(
                    "Talent Scout JSON Validation",
                    False,
                    "Response is not valid JSON"
                )
        
        time.sleep(1)
        
        # 6. Candidate Dossier
        self.test_ai_generation(
            tool_type="dossier",
            prompt="Jane Smith, Senior Product Manager",
            context="10 years experience, worked at Amazon and Microsoft",
            expected_keywords=["summary", "background", "experience"]
        )
        
        time.sleep(1)
        
        # 7. Client Research
        self.test_ai_generation(
            tool_type="client-research",
            prompt="TechCorp Inc, AI/ML startup in Silicon Valley",
            expected_keywords=["company", "overview", "leadership"]
        )

    def test_file_upload(self):
        """Test file upload and extraction"""
        print("\n" + "="*70)
        print("📎 FILE UPLOAD & EXTRACTION TESTS")
        print("="*70)
        
        # Create a test text file
        test_content = "This is a test context document for JD Builder.\nIt contains additional information about the role and company culture."
        test_filename = "test_context.txt"
        upload_id = f"test_{int(time.time())}"
        
        try:
            # Test chunk upload
            files = {
                'chunk': (test_filename, io.BytesIO(test_content.encode('utf-8')), 'text/plain')
            }
            data = {
                'upload_id': upload_id,
                'chunk_index': '0',
                'total_chunks': '1',
                'filename': test_filename
            }
            
            response = self.session.post(
                f"{self.api_url}/ai/upload-chunk",
                files=files,
                data=data,
                timeout=30
            )
            
            if response.status_code == 200:
                self.log_test(
                    "File Upload (Chunk)",
                    True,
                    f"Uploaded {test_filename}"
                )
                
                # Test file extraction
                extract_data = {
                    "upload_id": upload_id,
                    "filename": test_filename
                }
                
                response = self.session.post(
                    f"{self.api_url}/ai/extract-file",
                    json=extract_data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    extracted_text = result.get('extracted_text', '')
                    char_count = result.get('char_count', 0)
                    
                    self.log_test(
                        "File Extraction",
                        True,
                        f"Extracted {char_count} characters"
                    )
                    return True
                else:
                    self.log_test(
                        "File Extraction",
                        False,
                        f"Status: {response.status_code}"
                    )
                    return False
            else:
                self.log_test(
                    "File Upload (Chunk)",
                    False,
                    f"Status: {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test("File Upload & Extraction", False, f"Exception: {str(e)}")
            return False

    def test_download_formats(self):
        """Test document download in different formats"""
        print("\n" + "="*70)
        print("💾 DOWNLOAD FORMAT TESTS")
        print("="*70)
        
        test_content = """# Test Job Description

## Role Overview
This is a test job description for a Senior Software Engineer position.

## Key Responsibilities
- Design and develop scalable applications
- Lead technical discussions
- Mentor junior developers

## Qualifications
- 5+ years of experience
- Strong programming skills
- Excellent communication"""
        
        formats = ['txt', 'pdf', 'docx']
        
        for fmt in formats:
            try:
                download_data = {
                    "content": test_content,
                    "filename": f"test_document",
                    "format": fmt
                }
                
                response = self.session.post(
                    f"{self.api_url}/ai/download",
                    json=download_data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    content_length = len(response.content)
                    self.log_test(
                        f"Download ({fmt.upper()})",
                        True,
                        f"Generated {content_length} bytes"
                    )
                else:
                    self.log_test(
                        f"Download ({fmt.upper()})",
                        False,
                        f"Status: {response.status_code}"
                    )
                    
            except Exception as e:
                self.log_test(f"Download ({fmt.upper()})", False, f"Exception: {str(e)}")
        
        # Test CSV download for Talent Scout
        try:
            csv_content = json.dumps([
                {
                    "name": "John Doe",
                    "current_title": "Senior Engineer",
                    "current_employer": "TechCorp",
                    "location": "San Francisco, CA"
                }
            ])
            
            download_data = {
                "content": csv_content,
                "filename": "candidates",
                "format": "csv"
            }
            
            response = self.session.post(
                f"{self.api_url}/ai/download",
                json=download_data,
                timeout=30
            )
            
            if response.status_code == 200:
                content_length = len(response.content)
                self.log_test(
                    "Download (CSV - Talent Scout)",
                    True,
                    f"Generated {content_length} bytes"
                )
            else:
                self.log_test(
                    "Download (CSV - Talent Scout)",
                    False,
                    f"Status: {response.status_code}"
                )
                
        except Exception as e:
            self.log_test("Download (CSV - Talent Scout)", False, f"Exception: {str(e)}")

    def test_history(self):
        """Test AI history retrieval"""
        print("\n" + "="*70)
        print("📜 HISTORY TEST")
        print("="*70)
        
        try:
            response = self.session.get(
                f"{self.api_url}/ai/history",
                timeout=10
            )
            
            if response.status_code == 200:
                history = response.json()
                self.log_test(
                    "Get AI History",
                    True,
                    f"Retrieved {len(history)} history entries"
                )
                return True
            else:
                self.log_test(
                    "Get AI History",
                    False,
                    f"Status: {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test("Get AI History", False, f"Exception: {str(e)}")
            return False

    def test_api_key_management(self):
        """Test API key save/delete endpoints"""
        print("\n" + "="*70)
        print("🔑 API KEY MANAGEMENT TESTS")
        print("="*70)
        
        # Test save API key
        try:
            save_data = {
                "api_key": "sk-test-key-for-testing-purposes-123456789"
            }
            
            response = self.session.post(
                f"{self.api_url}/ai/save-api-key",
                json=save_data,
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_test(
                    "Save API Key",
                    True,
                    "API key saved successfully"
                )
                
                # Test delete API key
                response = self.session.delete(
                    f"{self.api_url}/ai/delete-api-key",
                    timeout=10
                )
                
                if response.status_code == 200:
                    self.log_test(
                        "Delete API Key",
                        True,
                        "API key deleted successfully"
                    )
                else:
                    self.log_test(
                        "Delete API Key",
                        False,
                        f"Status: {response.status_code}"
                    )
            else:
                self.log_test(
                    "Save API Key",
                    False,
                    f"Status: {response.status_code}"
                )
                
        except Exception as e:
            self.log_test("API Key Management", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting AI Tools Backend Testing")
        print("="*70)
        
        # 1. Authentication
        if not self.test_authentication():
            print("\n❌ Authentication failed - cannot continue testing")
            return False
        
        # 2. Usage Stats
        self.test_usage_stats()
        
        # 3. All AI Tools Generation
        self.test_all_tools()
        
        # 4. File Upload & Extraction
        self.test_file_upload()
        
        # 5. Download Formats
        self.test_download_formats()
        
        # 6. History
        self.test_history()
        
        # 7. API Key Management
        self.test_api_key_management()
        
        # Final Summary
        print("\n" + "="*70)
        print("📊 TEST SUMMARY")
        print("="*70)
        print(f"✅ Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Tests failed: {len(self.tests_failed)}/{self.tests_run}")
        print(f"📈 Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_failed:
            print("\n❌ Failed tests:")
            for test_name in self.tests_failed:
                print(f"   - {test_name}")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All tests passed!")
            return True
        else:
            print(f"\n⚠️  {len(self.tests_failed)} test(s) failed")
            return False

def main():
    tester = AIToolsBackendTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
