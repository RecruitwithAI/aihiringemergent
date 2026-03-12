import requests
import json
import sys
from datetime import datetime
import time

class TalentScoutTester:
    def __init__(self):
        self.base_url = "https://talent-scout-ai-27.preview.emergentagent.com/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.mandate_id = None
        self.candidate_id = None

    def log_test(self, name, success, message=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED {message}")
        else:
            print(f"❌ {name}: FAILED {message}")
        return success

    def test_endpoint(self, method, endpoint, expected_status, data=None, description=""):
        """Test a single endpoint"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            # Use longer timeout for AI operations
            timeout = 30 if 'search/orchestrate' in endpoint else 15
            
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=timeout)
            else:
                return self.log_test(description, False, f"Unsupported method: {method}")

            success = response.status_code == expected_status
            message = f"Status: {response.status_code}"
            
            if not success:
                message += f", Expected: {expected_status}"
                try:
                    error_detail = response.json().get('detail', 'No detail')
                    message += f", Error: {error_detail}"
                except:
                    message += f", Response: {response.text[:100]}"
            
            return self.log_test(description, success, message), response
            
        except Exception as e:
            return self.log_test(description, False, f"Exception: {str(e)}"), None

    def test_mandate_creation(self):
        """Test mandate creation with valid data"""
        mandate_data = {
            "role": "VP of Engineering", 
            "target_companies": ["Google", "Microsoft", "Amazon"],
            "geography": "San Francisco Bay Area",
            "must_haves": "10+ years engineering leadership",
            "no_go_constraints": "No remote-only companies",
            "compensation_band": "$200k-$300k",
            "reporting_line": "Reports to CTO",
            "ideal_backgrounds": "SaaS, enterprise software, team scaling"
        }
        
        success, response = self.test_endpoint(
            "POST", "mandates", 200, mandate_data,
            "Create mandate"
        )
        
        if success and response:
            try:
                mandate = response.json()
                self.mandate_id = mandate.get('id')
                print(f"   Created mandate ID: {self.mandate_id}")
            except:
                self.log_test("Parse mandate response", False, "Invalid JSON response")
        
        return success

    def test_get_mandates(self):
        """Test retrieving all mandates"""
        success, response = self.test_endpoint(
            "GET", "mandates", 200, None,
            "Get all mandates"
        )
        
        if success and response:
            try:
                mandates = response.json()
                print(f"   Found {len(mandates)} mandates")
            except:
                self.log_test("Parse mandates response", False, "Invalid JSON response")
        
        return success

    def test_get_mandate_detail(self):
        """Test retrieving specific mandate"""
        if not self.mandate_id:
            return self.log_test("Get mandate detail", False, "No mandate ID available")
        
        success, response = self.test_endpoint(
            "GET", f"mandates/{self.mandate_id}", 200, None,
            "Get mandate detail"
        )
        
        if success and response:
            try:
                mandate = response.json()
                print(f"   Mandate role: {mandate.get('role')}")
            except:
                self.log_test("Parse mandate detail response", False, "Invalid JSON response")
        
        return success

    def test_settings_endpoints(self):
        """Test settings functionality"""
        # Test get settings
        success1, response = self.test_endpoint(
            "GET", "settings", 200, None,
            "Get settings"
        )
        
        # Test update settings
        settings_data = {"ai_model": "gpt-5.2"}
        success2, response = self.test_endpoint(
            "PUT", "settings", 200, settings_data,
            "Update settings"
        )
        
        return success1 and success2

    def test_search_orchestration(self):
        """Test AI search orchestration"""
        if not self.mandate_id:
            return self.log_test("Search orchestration", False, "No mandate ID available")
        
        search_data = {"mandate_id": self.mandate_id}
        success, response = self.test_endpoint(
            "POST", "search/orchestrate", 200, search_data,
            "Start AI search orchestration"
        )
        
        if success and response:
            try:
                result = response.json()
                print(f"   Search status: {result.get('status')}")
                print(f"   Message: {result.get('message')}")
                
                # Wait a bit for processing
                time.sleep(3)
                
            except:
                self.log_test("Parse search response", False, "Invalid JSON response")
        
        return success

    def test_get_candidates(self):
        """Test retrieving candidates for mandate"""
        if not self.mandate_id:
            return self.log_test("Get candidates", False, "No mandate ID available")
        
        success, response = self.test_endpoint(
            "GET", f"mandates/{self.mandate_id}/candidates", 200, None,
            "Get mandate candidates"
        )
        
        if success and response:
            try:
                candidates = response.json()
                print(f"   Found {len(candidates)} candidates")
                if candidates:
                    self.candidate_id = candidates[0].get('id')
                    print(f"   First candidate ID: {self.candidate_id}")
            except:
                self.log_test("Parse candidates response", False, "Invalid JSON response")
        
        return success

    def test_get_candidate_detail(self):
        """Test retrieving specific candidate"""
        if not self.candidate_id:
            return self.log_test("Get candidate detail", False, "No candidate ID available")
        
        success, response = self.test_endpoint(
            "GET", f"candidates/{self.candidate_id}", 200, None,
            "Get candidate detail"
        )
        
        if success and response:
            try:
                candidate = response.json()
                print(f"   Candidate name: {candidate.get('name')}")
                print(f"   Fit score: {candidate.get('fit_score')}")
            except:
                self.log_test("Parse candidate detail response", False, "Invalid JSON response")
        
        return success

    def test_error_cases(self):
        """Test error handling"""
        # Test invalid mandate ID
        success1, _ = self.test_endpoint(
            "GET", "mandates/invalid-id", 404, None,
            "Invalid mandate ID (should return 404)"
        )
        
        # Test invalid candidate ID  
        success2, _ = self.test_endpoint(
            "GET", "candidates/invalid-id", 404, None,
            "Invalid candidate ID (should return 404)"
        )
        
        # Test invalid mandate creation
        invalid_data = {"role": ""}  # Missing required fields
        success3, _ = self.test_endpoint(
            "POST", "mandates", 422, invalid_data,
            "Invalid mandate data (should return 422)"
        )
        
        return success1 and success2 and success3

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting Talent Scout AI Backend Tests")
        print("=" * 50)
        
        # Core functionality tests
        print("\n📋 Testing Mandate Management...")
        self.test_mandate_creation()
        self.test_get_mandates()
        self.test_get_mandate_detail()
        
        print("\n⚙️  Testing Settings...")
        self.test_settings_endpoints()
        
        print("\n🤖 Testing AI Search Orchestration...")
        self.test_search_orchestration()
        
        print("\n👥 Testing Candidate Management...")
        self.test_get_candidates()
        self.test_get_candidate_detail()
        
        print("\n❌ Testing Error Handling...")
        self.test_error_cases()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 TEST SUMMARY")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = TalentScoutTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())