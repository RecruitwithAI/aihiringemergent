#!/usr/bin/env python3
"""
Comprehensive test for SuperAdmin Prompt Management feature.

Tests:
1. SEEDING - verify 7 tools with active prompts
2. FULL LIFECYCLE on "client-research" tool
3. VALIDATION/GUARDS - error conditions
4. RESET functionality
5. INTEGRATION POINT - prompt_store.get_active_system_prompt()
6. REGRESSION SMOKE - existing endpoints still work
"""

import requests
import json
import sys
import os
from pymongo import MongoClient

class PromptManagementTester:
    def __init__(self, base_url="https://ai-recruitment-flow.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.superadmin_token = None
        self.regular_user_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # MongoDB connection for direct verification
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.getenv("DB_NAME", "test_database")
        self.mongo_client = MongoClient(mongo_url)
        self.db = self.mongo_client[db_name]
        
        # Test data storage
        self.draft_prompt_id = None
        self.original_active_prompt_id = None
        self.original_active_text = None
        
        print(f"🔧 SuperAdmin Prompt Management Test")
        print(f"   API: {self.api_url}")
        print(f"   MongoDB: {mongo_url}/{db_name}")
        print("="*70)

    def run_test(self, name, method, endpoint, expected_status=200, data=None, use_auth=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if use_auth == "superadmin" and self.superadmin_token:
            headers['Authorization'] = f'Bearer {self.superadmin_token}'
        elif use_auth == "regular" and self.regular_user_token:
            headers['Authorization'] = f'Bearer {self.regular_user_token}'

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

    def login_superadmin(self):
        """Login as superadmin"""
        print("\n" + "="*70)
        print("🔐 AUTHENTICATION SETUP")
        print("="*70)
        
        # Use a fresh request (not session) to avoid cookie conflicts
        response = requests.post(
            f"{self.api_url}/auth/login",
            json={
                "email": "noorussaba.alam@gmail.com",
                "password": "#VibeCon2026"
            }
        )
        
        self.tests_run += 1
        print(f"\n🔍 Test {self.tests_run}: Login as SuperAdmin")
        
        if response.status_code == 200:
            self.tests_passed += 1
            print(f"   ✅ PASSED - Status: {response.status_code}")
            self.test_results.append({"name": "Login as SuperAdmin", "status": "PASSED"})
            
            # Extract session token from Set-Cookie header
            set_cookie = response.headers.get('Set-Cookie', '')
            if 'session_token=' in set_cookie:
                # Extract token value
                token_part = set_cookie.split('session_token=')[1].split(';')[0]
                self.superadmin_token = token_part
                print(f"   🔑 SuperAdmin token obtained: {token_part[:20]}...")
                return True
            else:
                print(f"   ⚠️  No session_token in Set-Cookie")
                return False
        else:
            print(f"   ❌ FAILED - Expected 200, got {response.status_code}")
            self.test_results.append({"name": "Login as SuperAdmin", "status": "FAILED"})
            return False

    def login_regular_user(self):
        """Login as regular user"""
        # Use a fresh request (not session) to avoid cookie conflicts
        response = requests.post(
            f"{self.api_url}/auth/login",
            json={
                "email": "regression_test_20260610_113725@bestpl.ai",
                "password": "SecurePass2026!"
            }
        )
        
        self.tests_run += 1
        print(f"\n🔍 Test {self.tests_run}: Login as Regular User")
        
        if response.status_code == 200:
            self.tests_passed += 1
            print(f"   ✅ PASSED - Status: {response.status_code}")
            self.test_results.append({"name": "Login as Regular User", "status": "PASSED"})
            
            # Extract session token from Set-Cookie header
            set_cookie = response.headers.get('Set-Cookie', '')
            if 'session_token=' in set_cookie:
                token_part = set_cookie.split('session_token=')[1].split(';')[0]
                self.regular_user_token = token_part
                print(f"   🔑 Regular user token obtained: {token_part[:20]}...")
                return True
            else:
                print(f"   ⚠️  No session_token in Set-Cookie")
                return False
        else:
            print(f"   ❌ FAILED - Expected 200, got {response.status_code}")
            self.test_results.append({"name": "Login as Regular User", "status": "FAILED"})
            return False

    def test_1_seeding(self):
        """Test 1: SEEDING - verify 7 tools with active prompts"""
        print("\n" + "="*70)
        print("📋 TEST SUITE 1: SEEDING VERIFICATION")
        print("="*70)
        
        success, response = self.run_test(
            "GET /api/admin/prompts - List all tools",
            "GET",
            "admin/prompts",
            200,
            use_auth="superadmin"
        )
        
        if success and response:
            data = response.json()
            tools = data.get('tools', [])
            
            # Verify exactly 7 tools
            if len(tools) == 7:
                print(f"   ✅ Exactly 7 tools found")
                self.tests_passed += 1
            else:
                print(f"   ❌ Expected 7 tools, found {len(tools)}")
            
            # Verify each tool has active prompt
            expected_tools = [
                "jd-builder", "search-strategy", "search-strategy-targets",
                "candidate-research", "dossier", "client-research", "talent-scout"
            ]
            
            for tool in tools:
                tool_id = tool.get('tool_id')
                label = tool.get('label')
                default_prompt = tool.get('default_prompt')
                active = tool.get('active')
                
                print(f"\n   Tool: {tool_id} ({label})")
                
                if tool_id not in expected_tools:
                    print(f"      ⚠️  Unexpected tool_id: {tool_id}")
                
                if not active:
                    print(f"      ❌ No active prompt")
                else:
                    print(f"      ✅ Active prompt present")
                    print(f"         - version: {active.get('version')}")
                    print(f"         - status: {active.get('status')}")
                    print(f"         - prompt length: {len(active.get('system_prompt', ''))} chars")
                    
                    # Verify status is "active"
                    if active.get('status') != 'active':
                        print(f"      ❌ Active prompt status is '{active.get('status')}', expected 'active'")
                    
                    # Verify system_prompt is not empty
                    if not active.get('system_prompt', '').strip():
                        print(f"      ❌ Active prompt system_prompt is empty")
                
                if not default_prompt:
                    print(f"      ⚠️  No default_prompt")
                
                if not label:
                    print(f"      ⚠️  No label")

    def test_2_full_lifecycle(self):
        """Test 2: FULL LIFECYCLE on client-research tool"""
        print("\n" + "="*70)
        print("🔄 TEST SUITE 2: FULL LIFECYCLE (client-research)")
        print("="*70)
        
        # 2a. Create draft
        test_prompt_text = "TEST PROMPT FOR CLIENT RESEARCH - This is a unique test prompt with sufficient length to pass validation."
        
        success, response = self.run_test(
            "POST /api/admin/prompts/client-research - Create draft",
            "POST",
            "admin/prompts/client-research",
            200,
            {
                "system_prompt": test_prompt_text,
                "status": "draft"
            },
            use_auth="superadmin"
        )
        
        if success and response:
            data = response.json()
            self.draft_prompt_id = data.get('prompt_id')
            draft_version = data.get('version')
            draft_status = data.get('status')
            
            print(f"   📝 Draft created: {self.draft_prompt_id}")
            print(f"      - version: {draft_version}")
            print(f"      - status: {draft_status}")
            
            if draft_status != 'draft':
                print(f"   ❌ Expected status 'draft', got '{draft_status}'")
        
        # 2b. Edit the draft
        edited_prompt_text = "EDITED TEST PROMPT FOR CLIENT RESEARCH - This text has been modified to verify the edit functionality works correctly."
        
        if self.draft_prompt_id:
            success, response = self.run_test(
                f"PUT /api/admin/prompts/{self.draft_prompt_id} - Edit draft",
                "PUT",
                f"admin/prompts/{self.draft_prompt_id}",
                200,
                {
                    "system_prompt": edited_prompt_text
                },
                use_auth="superadmin"
            )
            
            if success and response:
                data = response.json()
                updated_text = data.get('system_prompt')
                
                if updated_text == edited_prompt_text:
                    print(f"   ✅ Draft text updated correctly")
                else:
                    print(f"   ❌ Draft text mismatch")
        
        # Get current active prompt for client-research before activation
        success, response = self.run_test(
            "GET /api/admin/prompts - Get current active",
            "GET",
            "admin/prompts",
            200,
            use_auth="superadmin"
        )
        
        if success and response:
            data = response.json()
            tools = data.get('tools', [])
            for tool in tools:
                if tool.get('tool_id') == 'client-research':
                    active = tool.get('active')
                    if active:
                        self.original_active_prompt_id = active.get('prompt_id')
                        self.original_active_text = active.get('system_prompt')
                        print(f"   📌 Original active prompt: {self.original_active_prompt_id}")
        
        # 2c. Activate the draft
        if self.draft_prompt_id:
            success, response = self.run_test(
                f"POST /api/admin/prompts/{self.draft_prompt_id}/activate - Activate draft",
                "POST",
                f"admin/prompts/{self.draft_prompt_id}/activate",
                200,
                use_auth="superadmin"
            )
            
            if success and response:
                data = response.json()
                activated_status = data.get('status')
                
                if activated_status == 'active':
                    print(f"   ✅ Draft activated successfully")
                else:
                    print(f"   ❌ Expected status 'active', got '{activated_status}'")
        
        # Verify only ONE active prompt for client-research
        success, response = self.run_test(
            "GET /api/admin/prompts - Verify single active",
            "GET",
            "admin/prompts",
            200,
            use_auth="superadmin"
        )
        
        if success and response:
            data = response.json()
            tools = data.get('tools', [])
            for tool in tools:
                if tool.get('tool_id') == 'client-research':
                    active = tool.get('active')
                    history = tool.get('history', [])
                    
                    if active and active.get('prompt_id') == self.draft_prompt_id:
                        print(f"   ✅ New prompt is now active")
                    else:
                        print(f"   ❌ New prompt is not active")
                    
                    # Check if previous active is now in history
                    if self.original_active_prompt_id:
                        found_in_history = any(
                            h.get('prompt_id') == self.original_active_prompt_id and h.get('status') == 'old'
                            for h in history
                        )
                        if found_in_history:
                            print(f"   ✅ Previous active moved to history with status 'old'")
                        else:
                            print(f"   ❌ Previous active not found in history")
        
        # 2d. Verify in MongoDB directly
        print(f"\n   🔍 MongoDB Direct Verification")
        active_docs = list(self.db.tool_prompts.find({
            "tool_id": "client-research",
            "status": "active"
        }))
        
        if len(active_docs) == 1:
            print(f"   ✅ Exactly 1 active document in MongoDB")
            doc = active_docs[0]
            if doc.get('system_prompt') == edited_prompt_text:
                print(f"   ✅ Active prompt text matches edited draft")
            else:
                print(f"   ❌ Active prompt text mismatch")
        else:
            print(f"   ❌ Expected 1 active document, found {len(active_docs)}")
        
        # 2e. RESTORE - activate the old (original) version
        if self.original_active_prompt_id:
            success, response = self.run_test(
                f"POST /api/admin/prompts/{self.original_active_prompt_id}/activate - Restore old version",
                "POST",
                f"admin/prompts/{self.original_active_prompt_id}/activate",
                200,
                use_auth="superadmin"
            )
            
            if success and response:
                data = response.json()
                restored_text = data.get('system_prompt')
                
                if restored_text == self.original_active_text:
                    print(f"   ✅ Original prompt restored successfully")
                else:
                    print(f"   ❌ Restored text doesn't match original")

    def test_3_validation_guards(self):
        """Test 3: VALIDATION/GUARDS - error conditions"""
        print("\n" + "="*70)
        print("🛡️  TEST SUITE 3: VALIDATION & GUARDS")
        print("="*70)
        
        # Create a draft for testing
        success, response = self.run_test(
            "Create test draft for validation tests",
            "POST",
            "admin/prompts/client-research",
            200,
            {
                "system_prompt": "Test draft for validation - this is a valid prompt with sufficient length.",
                "status": "draft"
            },
            use_auth="superadmin"
        )
        
        test_draft_id = None
        if success and response:
            test_draft_id = response.json().get('prompt_id')
        
        # Get an active prompt ID for testing
        success, response = self.run_test(
            "Get active prompt for testing",
            "GET",
            "admin/prompts",
            200,
            use_auth="superadmin"
        )
        
        active_prompt_id = None
        if success and response:
            tools = response.json().get('tools', [])
            for tool in tools:
                if tool.get('active'):
                    active_prompt_id = tool['active'].get('prompt_id')
                    break
        
        # Test: PUT on active prompt should fail with 400
        if active_prompt_id:
            self.run_test(
                "PUT on active prompt - should fail (400)",
                "PUT",
                f"admin/prompts/{active_prompt_id}",
                400,
                {
                    "system_prompt": "Trying to edit an active prompt - should fail"
                },
                use_auth="superadmin"
            )
        
        # Test: DELETE on active prompt should fail with 400
        if active_prompt_id:
            self.run_test(
                "DELETE on active prompt - should fail (400)",
                "DELETE",
                f"admin/prompts/{active_prompt_id}",
                400,
                use_auth="superadmin"
            )
        
        # Test: DELETE draft then verify it's gone
        if test_draft_id:
            success, response = self.run_test(
                "DELETE draft - should succeed (200)",
                "DELETE",
                f"admin/prompts/{test_draft_id}",
                200,
                use_auth="superadmin"
            )
            
            if success:
                # Verify it's gone from list
                success2, response2 = self.run_test(
                    "Verify draft deleted from list",
                    "GET",
                    "admin/prompts",
                    200,
                    use_auth="superadmin"
                )
                
                if success2 and response2:
                    tools = response2.json().get('tools', [])
                    found = False
                    for tool in tools:
                        drafts = tool.get('drafts', [])
                        if any(d.get('prompt_id') == test_draft_id for d in drafts):
                            found = True
                            break
                    
                    if not found:
                        print(f"   ✅ Draft successfully removed from list")
                    else:
                        print(f"   ❌ Draft still appears in list")
        
        # Test: POST to unknown tool_id should fail with 404
        self.run_test(
            "POST to unknown tool - should fail (404)",
            "POST",
            "admin/prompts/unknown-tool-xyz",
            404,
            {
                "system_prompt": "This is a test prompt for an unknown tool",
                "status": "draft"
            },
            use_auth="superadmin"
        )
        
        # Test: system_prompt shorter than 10 chars should fail with 422
        self.run_test(
            "POST with short prompt - should fail (422)",
            "POST",
            "admin/prompts/client-research",
            422,
            {
                "system_prompt": "Short",
                "status": "draft"
            },
            use_auth="superadmin"
        )
        
        # Test: invalid status value should fail with 400
        self.run_test(
            "POST with invalid status - should fail (400)",
            "POST",
            "admin/prompts/client-research",
            400,
            {
                "system_prompt": "Valid prompt text with sufficient length for validation",
                "status": "invalid_status"
            },
            use_auth="superadmin"
        )
        
        # Test: All endpoints as REGULAR USER should fail with 403
        print(f"\n   🔒 Testing regular user access (should all be 403)")
        
        self.run_test(
            "GET /api/admin/prompts as regular user - should fail (403)",
            "GET",
            "admin/prompts",
            403,
            use_auth="regular"
        )
        
        self.run_test(
            "POST as regular user - should fail (403)",
            "POST",
            "admin/prompts/client-research",
            403,
            {
                "system_prompt": "Regular user trying to create prompt",
                "status": "draft"
            },
            use_auth="regular"
        )
        
        if active_prompt_id:
            self.run_test(
                "PUT as regular user - should fail (403)",
                "PUT",
                f"admin/prompts/{active_prompt_id}",
                403,
                {
                    "system_prompt": "Regular user trying to edit"
                },
                use_auth="regular"
            )
            
            self.run_test(
                "POST activate as regular user - should fail (403)",
                "POST",
                f"admin/prompts/{active_prompt_id}/activate",
                403,
                use_auth="regular"
            )
            
            self.run_test(
                "DELETE as regular user - should fail (403)",
                "DELETE",
                f"admin/prompts/{active_prompt_id}",
                403,
                use_auth="regular"
            )
        
        self.run_test(
            "POST reset as regular user - should fail (403)",
            "POST",
            "admin/prompts/client-research/reset",
            403,
            use_auth="regular"
        )
        
        # Test: All endpoints unauthenticated should fail with 401
        print(f"\n   🔓 Testing unauthenticated access (should all be 401)")
        
        self.run_test(
            "GET unauthenticated - should fail (401)",
            "GET",
            "admin/prompts",
            401,
            use_auth=None
        )
        
        self.run_test(
            "POST unauthenticated - should fail (401)",
            "POST",
            "admin/prompts/client-research",
            401,
            {
                "system_prompt": "Unauthenticated user trying to create",
                "status": "draft"
            },
            use_auth=None
        )

    def test_4_reset(self):
        """Test 4: RESET functionality"""
        print("\n" + "="*70)
        print("🔄 TEST SUITE 4: RESET TO DEFAULT")
        print("="*70)
        
        # Get the default prompt text first
        success, response = self.run_test(
            "GET /api/admin/prompts - Get default prompt",
            "GET",
            "admin/prompts",
            200,
            use_auth="superadmin"
        )
        
        default_prompt_text = None
        if success and response:
            tools = response.json().get('tools', [])
            for tool in tools:
                if tool.get('tool_id') == 'client-research':
                    default_prompt_text = tool.get('default_prompt')
                    print(f"   📋 Default prompt length: {len(default_prompt_text)} chars")
                    break
        
        # Reset client-research to default
        success, response = self.run_test(
            "POST /api/admin/prompts/client-research/reset - Reset to default",
            "POST",
            "admin/prompts/client-research/reset",
            200,
            use_auth="superadmin"
        )
        
        if success and response:
            data = response.json()
            reset_text = data.get('system_prompt')
            reset_status = data.get('status')
            
            if reset_status == 'active':
                print(f"   ✅ Reset prompt is active")
            else:
                print(f"   ❌ Reset prompt status is '{reset_status}', expected 'active'")
            
            if reset_text == default_prompt_text:
                print(f"   ✅ Reset prompt text matches default")
            else:
                print(f"   ❌ Reset prompt text doesn't match default")
                print(f"      Expected length: {len(default_prompt_text)}")
                print(f"      Got length: {len(reset_text)}")

    def test_5_integration_point(self):
        """Test 5: INTEGRATION POINT - prompt_store.get_active_system_prompt()"""
        print("\n" + "="*70)
        print("🔌 TEST SUITE 5: INTEGRATION POINT")
        print("="*70)
        
        print(f"\n   Testing utils.prompt_store.get_active_system_prompt() via Python")
        
        # We'll test this by importing the function directly
        try:
            import sys
            import os
            sys.path.insert(0, '/app/backend')
            
            # Set environment variables if not set
            if 'MONGO_URL' not in os.environ:
                os.environ['MONGO_URL'] = 'mongodb://localhost:27017'
            if 'DB_NAME' not in os.environ:
                os.environ['DB_NAME'] = 'test_database'
            
            # Import asyncio for running async function
            import asyncio
            from utils.prompt_store import get_active_system_prompt
            
            # Create a new event loop for this test
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                # Test with valid tool_id
                print(f"\n   Test 1: get_active_system_prompt('client-research')")
                result = loop.run_until_complete(get_active_system_prompt('client-research'))
                
                if result and len(result) > 0:
                    print(f"   ✅ Returned active prompt (length: {len(result)} chars)")
                    self.tests_passed += 1
                    self.test_results.append({"name": "get_active_system_prompt('client-research')", "status": "PASSED"})
                else:
                    print(f"   ❌ Returned empty or None")
                    self.test_results.append({"name": "get_active_system_prompt('client-research')", "status": "FAILED"})
                
                self.tests_run += 1
                
                # Test with fake tool_id (should return fallback)
                print(f"\n   Test 2: get_active_system_prompt('fake-tool-xyz')")
                result = loop.run_until_complete(get_active_system_prompt('fake-tool-xyz'))
                
                expected_fallback = "You are a helpful recruiting AI assistant."
                if result == expected_fallback:
                    print(f"   ✅ Returned fallback prompt: '{result}'")
                    self.tests_passed += 1
                    self.test_results.append({"name": "get_active_system_prompt('fake-tool-xyz') fallback", "status": "PASSED"})
                else:
                    print(f"   ❌ Expected fallback '{expected_fallback}', got '{result}'")
                    self.test_results.append({"name": "get_active_system_prompt('fake-tool-xyz') fallback", "status": "FAILED"})
                
                self.tests_run += 1
                
            finally:
                loop.close()
            
        except Exception as e:
            print(f"   ❌ Exception during integration test: {str(e)}")
            import traceback
            traceback.print_exc()
            self.tests_run += 2
            self.test_results.append({"name": "Integration test", "status": "EXCEPTION", "error": str(e)})

    def test_6_regression_smoke(self):
        """Test 6: REGRESSION SMOKE - existing endpoints still work"""
        print("\n" + "="*70)
        print("🔥 TEST SUITE 6: REGRESSION SMOKE")
        print("="*70)
        
        # Test GET /api/challenges
        self.run_test(
            "GET /api/challenges - should work (200)",
            "GET",
            "challenges",
            200,
            use_auth="superadmin"
        )
        
        # Test GET /api/dashboard/stats
        self.run_test(
            "GET /api/dashboard/stats - should work (200)",
            "GET",
            "dashboard/stats",
            200,
            use_auth="superadmin"
        )

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*70)
        print("📊 TEST SUMMARY")
        print("="*70)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"\n   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {success_rate:.1f}%")
        
        # Group results by status
        passed = [r for r in self.test_results if r['status'] == 'PASSED']
        failed = [r for r in self.test_results if r['status'] == 'FAILED']
        exceptions = [r for r in self.test_results if r['status'] == 'EXCEPTION']
        
        if failed:
            print(f"\n   ❌ Failed Tests:")
            for r in failed:
                print(f"      - {r['name']}")
                if 'expected' in r and 'got' in r:
                    print(f"        Expected: {r['expected']}, Got: {r['got']}")
        
        if exceptions:
            print(f"\n   ⚠️  Exception Tests:")
            for r in exceptions:
                print(f"      - {r['name']}")
                print(f"        Error: {r.get('error', 'Unknown')}")
        
        print("\n" + "="*70)
        
        return self.tests_run == self.tests_passed

    def run_all_tests(self):
        """Run all test suites"""
        try:
            # Authentication
            if not self.login_superadmin():
                print("❌ Failed to login as superadmin. Aborting tests.")
                return False
            
            if not self.login_regular_user():
                print("⚠️  Failed to login as regular user. Some tests will be skipped.")
            
            # Run test suites
            self.test_1_seeding()
            self.test_2_full_lifecycle()
            self.test_3_validation_guards()
            self.test_4_reset()
            self.test_5_integration_point()
            self.test_6_regression_smoke()
            
            # Print summary
            return self.print_summary()
            
        except Exception as e:
            print(f"\n❌ Fatal error during test execution: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            # Cleanup
            if self.mongo_client:
                self.mongo_client.close()


if __name__ == "__main__":
    tester = PromptManagementTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
