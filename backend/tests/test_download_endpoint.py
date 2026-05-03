"""
Test file for P0 File Download Bug Fix
Tests the /api/ai/download endpoint for TXT, PDF, and DOCX formats
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "saba@bestpl.ai"
TEST_PASSWORD = "Bestpl2026!"


class TestDownloadEndpoint:
    """Tests for /api/ai/download endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get session cookie
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        print(f"✓ Logged in as {TEST_EMAIL}")
    
    def test_download_txt_format(self):
        """P0: Test TXT download creates file from content"""
        test_content = "# Test Job Description\n\nThis is a test JD for a Software Engineer role.\n\n## Requirements\n- Python experience\n- FastAPI knowledge"
        
        response = self.session.post(
            f"{BASE_URL}/api/ai/download",
            json={
                "content": test_content,
                "format": "txt",
                "filename": "test_jd"
            }
        )
        
        assert response.status_code == 200, f"TXT download failed: {response.status_code} - {response.text}"
        assert response.headers.get("Content-Type", "").startswith("text/plain"), f"Wrong content type: {response.headers.get('Content-Type')}"
        assert "attachment" in response.headers.get("Content-Disposition", ""), "Missing Content-Disposition header"
        assert len(response.content) > 0, "Empty response content"
        
        # Verify content matches
        downloaded_content = response.content.decode('utf-8')
        assert "Test Job Description" in downloaded_content, "Content mismatch"
        print(f"✓ TXT download works - received {len(response.content)} bytes")
    
    def test_download_pdf_format(self):
        """P0: Test PDF download via backend endpoint"""
        test_content = """# Senior Software Engineer

## About the Role
We are looking for a Senior Software Engineer to join our team.

## Requirements
- 5+ years of experience
- Python and JavaScript proficiency
- Experience with cloud platforms

## Responsibilities
- Design and implement scalable systems
- Mentor junior developers
- Code review and best practices
"""
        
        response = self.session.post(
            f"{BASE_URL}/api/ai/download",
            json={
                "content": test_content,
                "format": "pdf",
                "filename": "test_jd_pdf"
            }
        )
        
        assert response.status_code == 200, f"PDF download failed: {response.status_code} - {response.text}"
        assert response.headers.get("Content-Type") == "application/pdf", f"Wrong content type: {response.headers.get('Content-Type')}"
        assert "attachment" in response.headers.get("Content-Disposition", ""), "Missing Content-Disposition header"
        
        # Verify PDF magic bytes
        assert response.content[:4] == b'%PDF', f"Invalid PDF magic bytes: {response.content[:4]}"
        print(f"✓ PDF download works - received {len(response.content)} bytes with valid PDF header")
    
    def test_download_docx_format(self):
        """P0: Test DOCX download via backend endpoint"""
        test_content = """# Product Manager Role

## Overview
Join our product team to drive innovation.

## Key Responsibilities
- Define product roadmap
- Work with engineering teams
- Analyze market trends

## Qualifications
- 3+ years PM experience
- Technical background preferred
- Strong communication skills
"""
        
        response = self.session.post(
            f"{BASE_URL}/api/ai/download",
            json={
                "content": test_content,
                "format": "docx",
                "filename": "test_jd_docx"
            }
        )
        
        assert response.status_code == 200, f"DOCX download failed: {response.status_code} - {response.text}"
        expected_content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        assert response.headers.get("Content-Type") == expected_content_type, f"Wrong content type: {response.headers.get('Content-Type')}"
        assert "attachment" in response.headers.get("Content-Disposition", ""), "Missing Content-Disposition header"
        
        # Verify DOCX magic bytes (PK zip format)
        assert response.content[:2] == b'PK', f"Invalid DOCX magic bytes: {response.content[:2]}"
        print(f"✓ DOCX download works - received {len(response.content)} bytes with valid PK header")
    
    def test_download_with_special_characters(self):
        """Test download handles special characters in content"""
        test_content = "Test with special chars: bullet, dash, quotes, apostrophe"
        
        response = self.session.post(
            f"{BASE_URL}/api/ai/download",
            json={
                "content": test_content,
                "format": "txt",
                "filename": "special_chars_test"
            }
        )
        
        assert response.status_code == 200, f"Download with special chars failed: {response.status_code}"
        print("✓ Download handles special characters")
    
    def test_download_with_markdown_tables(self):
        """Test PDF/DOCX download handles markdown tables"""
        test_content = """# Candidate Comparison

| Name | Experience | Location | Fit Score |
|------|------------|----------|-----------|
| John Doe | 5 years | NYC | 85% |
| Jane Smith | 7 years | SF | 92% |
| Bob Wilson | 3 years | Remote | 78% |

## Summary
Based on the analysis, Jane Smith is the top candidate.
"""
        
        # Test PDF with table
        response = self.session.post(
            f"{BASE_URL}/api/ai/download",
            json={
                "content": test_content,
                "format": "pdf",
                "filename": "table_test"
            }
        )
        
        assert response.status_code == 200, f"PDF with table failed: {response.status_code}"
        assert response.content[:4] == b'%PDF', "Invalid PDF"
        print("✓ PDF download handles markdown tables")
        
        # Test DOCX with table
        response = self.session.post(
            f"{BASE_URL}/api/ai/download",
            json={
                "content": test_content,
                "format": "docx",
                "filename": "table_test"
            }
        )
        
        assert response.status_code == 200, f"DOCX with table failed: {response.status_code}"
        assert response.content[:2] == b'PK', "Invalid DOCX"
        print("✓ DOCX download handles markdown tables")
    
    def test_download_invalid_format(self):
        """Test download rejects invalid format"""
        response = self.session.post(
            f"{BASE_URL}/api/ai/download",
            json={
                "content": "Test content",
                "format": "invalid_format",
                "filename": "test"
            }
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid format, got {response.status_code}"
        print("✓ Invalid format correctly rejected with 400")
    
    def test_download_requires_auth(self):
        """Test download endpoint requires authentication"""
        # Create new session without auth
        unauth_session = requests.Session()
        unauth_session.headers.update({"Content-Type": "application/json"})
        
        response = unauth_session.post(
            f"{BASE_URL}/api/ai/download",
            json={
                "content": "Test content",
                "format": "txt",
                "filename": "test"
            }
        )
        
        assert response.status_code == 401, f"Expected 401 for unauthenticated request, got {response.status_code}"
        print("✓ Download endpoint correctly requires authentication")


class TestCSVDownload:
    """Tests for CSV download (Talent Scout feature)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert login_response.status_code == 200
    
    def test_csv_download_with_json_array(self):
        """Test CSV download with JSON array of candidates"""
        import json
        
        candidates = [
            {
                "name": "John Doe",
                "current_title": "VP Engineering",
                "current_employer": "TechCorp",
                "location": "San Francisco",
                "previous_employers": ["Google", "Meta"],
                "data_confidence": "high"
            },
            {
                "name": "Jane Smith",
                "current_title": "Director of Engineering",
                "current_employer": "StartupXYZ",
                "location": "New York",
                "previous_employers": ["Amazon", "Microsoft"],
                "data_confidence": "medium"
            }
        ]
        
        response = self.session.post(
            f"{BASE_URL}/api/ai/download",
            json={
                "content": json.dumps(candidates),
                "format": "csv",
                "filename": "talent_scout_results"
            }
        )
        
        assert response.status_code == 200, f"CSV download failed: {response.status_code}"
        assert "text/csv" in response.headers.get("Content-Type", ""), f"Wrong content type: {response.headers.get('Content-Type')}"
        
        csv_content = response.content.decode('utf-8')
        assert "name" in csv_content, "CSV missing header"
        assert "John Doe" in csv_content, "CSV missing data"
        print(f"✓ CSV download works - received {len(response.content)} bytes")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
