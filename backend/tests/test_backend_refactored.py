"""
Backend API Tests - Refactored Modular Routers
Tests all API endpoints: auth, challenges, ai, dashboard

Test credentials: saba@bestpl.ai / Bestpl2026!
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# ==================== AUTH ENDPOINTS ====================

class TestAuthEndpoints:
    """Test auth router: /api/auth/login, /api/auth/me, /api/auth/logout"""
    
    def test_login_success(self):
        """POST /api/auth/login - valid credentials return user info"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "saba@bestpl.ai",
            "password": "Bestpl2026!"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "user_id" in data
        assert data["email"] == "saba@bestpl.ai"
        assert "name" in data
        assert "badge" in data
        assert "points" in data
        print(f"✓ Login success: user_id={data['user_id']}, name={data['name']}")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login - invalid credentials return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials returns 401")
    
    def test_auth_me_with_cookie(self):
        """GET /api/auth/me - returns current user info using session cookie"""
        session = requests.Session()
        # Login first
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "saba@bestpl.ai",
            "password": "Bestpl2026!"
        })
        assert login_resp.status_code == 200
        
        # Now test /auth/me
        me_resp = session.get(f"{BASE_URL}/api/auth/me")
        assert me_resp.status_code == 200, f"Expected 200, got {me_resp.status_code}: {me_resp.text}"
        data = me_resp.json()
        assert data["email"] == "saba@bestpl.ai"
        assert "badge" in data
        print(f"✓ /auth/me returns user: {data['name']}")
    
    def test_auth_me_without_auth(self):
        """GET /api/auth/me - returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ /auth/me without auth returns 401")


# ==================== CHALLENGES ENDPOINTS ====================

class TestChallengesEndpoints:
    """Test challenges router: /api/challenges"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Setup authenticated session for tests"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "saba@bestpl.ai",
            "password": "Bestpl2026!"
        })
        if login_resp.status_code != 200:
            pytest.skip("Login failed - cannot run challenge tests")
    
    def test_get_challenges_list(self):
        """GET /api/challenges - returns list of challenges"""
        response = self.session.get(f"{BASE_URL}/api/challenges")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            challenge = data[0]
            assert "challenge_id" in challenge
            assert "title" in challenge
            assert "description" in challenge
            assert "author" in challenge
            assert "answers_count" in challenge
        print(f"✓ GET /api/challenges returned {len(data)} challenges")
    
    def test_create_challenge(self):
        """POST /api/challenges - creates a new challenge"""
        unique_suffix = uuid.uuid4().hex[:8]
        response = self.session.post(f"{BASE_URL}/api/challenges", json={
            "title": f"TEST_Challenge_{unique_suffix}",
            "description": "Test challenge description for backend testing",
            "tags": ["test", "backend"]
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "challenge_id" in data
        assert data["title"] == f"TEST_Challenge_{unique_suffix}"
        print(f"✓ Created challenge: {data['challenge_id']}")
        return data["challenge_id"]
    
    def test_get_single_challenge(self):
        """GET /api/challenges/{id} - returns challenge with answers"""
        # First create a challenge
        unique_suffix = uuid.uuid4().hex[:8]
        create_resp = self.session.post(f"{BASE_URL}/api/challenges", json={
            "title": f"TEST_GetChallenge_{unique_suffix}",
            "description": "Test for get single challenge",
            "tags": ["test"]
        })
        assert create_resp.status_code == 200
        challenge_id = create_resp.json()["challenge_id"]
        
        # Get the challenge
        response = self.session.get(f"{BASE_URL}/api/challenges/{challenge_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["challenge_id"] == challenge_id
        assert "author" in data
        assert "answers" in data
        print(f"✓ GET /api/challenges/{challenge_id} returned challenge with {len(data['answers'])} answers")
    
    def test_challenge_not_found(self):
        """GET /api/challenges/invalid_id - returns 404"""
        response = self.session.get(f"{BASE_URL}/api/challenges/nonexistent_id_123")
        assert response.status_code == 404
        print("✓ Non-existent challenge returns 404")


# ==================== AI TOOLS ENDPOINTS ====================

class TestAIToolsEndpoints:
    """Test AI router: /api/ai/generate, /api/ai/history"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Setup authenticated session for tests"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "saba@bestpl.ai",
            "password": "Bestpl2026!"
        })
        if login_resp.status_code != 200:
            pytest.skip("Login failed - cannot run AI tests")
    
    def test_ai_generate_jd_builder(self):
        """POST /api/ai/generate - generates content using JD Builder tool"""
        response = self.session.post(f"{BASE_URL}/api/ai/generate", json={
            "tool_type": "jd-builder",
            "prompt": "Create a short job description for a Backend Developer role",
            "context": ""
        }, timeout=90)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "response" in data
        assert "tool_type" in data
        assert data["tool_type"] == "jd-builder"
        assert len(data["response"]) > 50  # Should have substantial content
        print(f"✓ AI generate (jd-builder) returned {len(data['response'])} chars")
    
    def test_ai_generate_with_context(self):
        """POST /api/ai/generate - generates with additional context"""
        response = self.session.post(f"{BASE_URL}/api/ai/generate", json={
            "tool_type": "jd-builder",
            "prompt": "Create a brief job description for a Frontend Developer",
            "context": "Company: TechCorp, Remote work available, Startup culture"
        }, timeout=90)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "response" in data
        print(f"✓ AI generate with context returned {len(data['response'])} chars")
    
    def test_ai_history(self):
        """GET /api/ai/history - returns user's AI tool usage history"""
        response = self.session.get(f"{BASE_URL}/api/ai/history")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            item = data[0]
            assert "tool_type" in item
            assert "prompt" in item
            assert "response" in item
        print(f"✓ AI history returned {len(data)} items")
    
    def test_ai_generate_unauthorized(self):
        """POST /api/ai/generate - requires authentication"""
        response = requests.post(f"{BASE_URL}/api/ai/generate", json={
            "tool_type": "jd-builder",
            "prompt": "Test prompt"
        })
        assert response.status_code == 401
        print("✓ AI generate without auth returns 401")


# ==================== DASHBOARD ENDPOINTS ====================

class TestDashboardEndpoints:
    """Test dashboard router: /api/dashboard/stats, /api/leaderboard, /api/profile/stats"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Setup authenticated session for tests"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "saba@bestpl.ai",
            "password": "Bestpl2026!"
        })
        if login_resp.status_code != 200:
            pytest.skip("Login failed - cannot run dashboard tests")
    
    def test_dashboard_stats(self):
        """GET /api/dashboard/stats - returns comprehensive dashboard data"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify all expected fields
        assert "total_members" in data
        assert "total_challenges" in data
        assert "total_answers" in data
        assert "user_points" in data
        assert "user_badge" in data
        assert "user_rank" in data
        assert "recent_challenges" in data
        assert "activity_feed" in data
        
        assert isinstance(data["total_members"], int)
        assert isinstance(data["total_challenges"], int)
        assert isinstance(data["recent_challenges"], list)
        print(f"✓ Dashboard stats: {data['total_members']} members, {data['total_challenges']} challenges")
    
    def test_dashboard_stats_unauthorized(self):
        """GET /api/dashboard/stats - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 401
        print("✓ Dashboard stats without auth returns 401")
    
    def test_leaderboard(self):
        """GET /api/leaderboard - returns ranked users list"""
        response = self.session.get(f"{BASE_URL}/api/leaderboard")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            user = data[0]
            assert "user_id" in user
            assert "name" in user
            assert "points" in user
            assert "rank" in user
            assert "badge" in user
            # Verify ranking order
            for i in range(1, len(data)):
                assert data[i]["rank"] == i + 1
                assert data[i]["points"] <= data[i-1]["points"]
        print(f"✓ Leaderboard returned {len(data)} users")
    
    def test_profile_stats(self):
        """GET /api/profile/stats - returns user's profile statistics"""
        response = self.session.get(f"{BASE_URL}/api/profile/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "challenges_posted" in data
        assert "answers_given" in data
        assert "ai_tools_used" in data
        assert "points" in data
        assert "badge" in data
        print(f"✓ Profile stats: {data['challenges_posted']} challenges, {data['ai_tools_used']} AI uses")


# ==================== AI FILE UPLOAD/DOWNLOAD ENDPOINTS ====================

class TestAIFileOperations:
    """Test AI file upload and download: /api/ai/upload-chunk, /api/ai/extract-file, /api/ai/download"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Setup authenticated session for tests"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "saba@bestpl.ai",
            "password": "Bestpl2026!"
        })
        if login_resp.status_code != 200:
            pytest.skip("Login failed - cannot run file tests")
    
    def test_upload_and_extract_txt_file(self):
        """POST /api/ai/upload-chunk + /api/ai/extract-file - uploads and extracts text file"""
        upload_id = f"test_{uuid.uuid4().hex[:8]}"
        test_content = b"This is test content for file extraction testing.\nMultiple lines of text."
        
        # Upload chunk
        files = {"chunk": ("test.txt", test_content, "text/plain")}
        data = {
            "upload_id": upload_id,
            "chunk_index": "0",
            "total_chunks": "1",
            "filename": "test.txt"
        }
        upload_resp = self.session.post(f"{BASE_URL}/api/ai/upload-chunk", files=files, data=data)
        assert upload_resp.status_code == 200, f"Upload failed: {upload_resp.text}"
        
        # Extract file
        extract_resp = self.session.post(f"{BASE_URL}/api/ai/extract-file", json={
            "upload_id": upload_id,
            "filename": "test.txt"
        })
        assert extract_resp.status_code == 200, f"Extract failed: {extract_resp.text}"
        extract_data = extract_resp.json()
        
        assert "extracted_text" in extract_data
        assert "char_count" in extract_data
        assert "filename" in extract_data
        assert extract_data["filename"] == "test.txt"
        assert "test content" in extract_data["extracted_text"]
        print(f"✓ File upload/extract: {extract_data['char_count']} chars extracted")
    
    def test_download_txt_format(self):
        """POST /api/ai/download - downloads content as txt"""
        response = self.session.post(f"{BASE_URL}/api/ai/download", json={
            "content": "# Test Document\n\nThis is test content.",
            "format": "txt",
            "filename": "test_doc"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "text/plain" in response.headers.get("Content-Type", "")
        print("✓ Download txt format works")
    
    def test_download_docx_format(self):
        """POST /api/ai/download - downloads content as docx"""
        response = self.session.post(f"{BASE_URL}/api/ai/download", json={
            "content": "# Test Document\n\nThis is test content.\n\n- Bullet point 1\n- Bullet point 2",
            "format": "docx",
            "filename": "test_doc"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        assert "wordprocessingml" in response.headers.get("Content-Type", "")
        # Check DOCX magic bytes (PK)
        assert response.content[:2] == b"PK"
        print("✓ Download docx format works")
    
    def test_download_pdf_format(self):
        """POST /api/ai/download - downloads content as pdf"""
        response = self.session.post(f"{BASE_URL}/api/ai/download", json={
            "content": "# Test Document\n\nThis is test content.\n\n- Bullet point 1\n- Bullet point 2",
            "format": "pdf",
            "filename": "test_doc"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        assert "pdf" in response.headers.get("Content-Type", "")
        # Check PDF magic bytes
        assert response.content[:4] == b"%PDF"
        print("✓ Download pdf format works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
