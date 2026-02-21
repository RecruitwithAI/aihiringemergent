"""
Backend tests for AI Tools new endpoints:
- POST /api/ai/upload-chunk (chunked file upload)
- POST /api/ai/extract-file (chunk assembly + text extraction)
- POST /api/ai/download (document download: txt, docx, pdf)
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
CREDS = {"email": "saba@bestpl.ai", "password": "Bestpl2026!"}


@pytest.fixture(scope="module")
def session():
    """Authenticated requests session."""
    s = requests.Session()
    resp = s.post(f"{BASE_URL}/api/auth/login", json=CREDS)
    assert resp.status_code == 200, f"Login failed: {resp.status_code} {resp.text}"
    print(f"Logged in as {CREDS['email']}, cookies: {dict(s.cookies)}")
    return s


class TestUploadChunk:
    """Tests for POST /api/ai/upload-chunk"""

    def test_upload_single_chunk_txt(self, session):
        """Upload a single .txt chunk and verify response."""
        content = b"This is a test job description context file for JD Builder."
        upload_id = "test_upload_txt_001"
        files = {"chunk": ("test.txt", io.BytesIO(content), "text/plain")}
        data = {
            "upload_id": upload_id,
            "chunk_index": "0",
            "total_chunks": "1",
            "filename": "test.txt",
        }
        resp = session.post(f"{BASE_URL}/api/ai/upload-chunk", files=files, data=data)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        body = resp.json()
        assert body["ok"] is True
        assert body["chunk"] == 0
        assert body["total"] == 1
        print(f"PASS: upload-chunk txt single chunk → {body}")

    def test_upload_multiple_chunks(self, session):
        """Upload 2 chunks of a file and verify each response."""
        content = b"A" * (2 * 1024 * 1024)  # 2 MB total
        upload_id = "test_upload_multi_001"
        chunk_size = 1024 * 1024  # 1 MB

        for i in range(2):
            chunk_data = content[i * chunk_size: (i + 1) * chunk_size]
            files = {"chunk": (f"large.txt", io.BytesIO(chunk_data), "text/plain")}
            data = {
                "upload_id": upload_id,
                "chunk_index": str(i),
                "total_chunks": "2",
                "filename": "large.txt",
            }
            resp = session.post(f"{BASE_URL}/api/ai/upload-chunk", files=files, data=data)
            assert resp.status_code == 200, f"Chunk {i} failed: {resp.status_code} {resp.text}"
            body = resp.json()
            assert body["ok"] is True
            assert body["chunk"] == i
        print("PASS: upload-chunk multiple chunks (2x 1MB)")

    def test_upload_chunk_unauthenticated(self):
        """Upload chunk without auth should return 401."""
        s = requests.Session()
        content = b"test content"
        files = {"chunk": ("test.txt", io.BytesIO(content), "text/plain")}
        data = {"upload_id": "unauth_test", "chunk_index": "0", "total_chunks": "1", "filename": "test.txt"}
        resp = s.post(f"{BASE_URL}/api/ai/upload-chunk", files=files, data=data)
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: upload-chunk unauthenticated → 401")


class TestExtractFile:
    """Tests for POST /api/ai/extract-file"""

    def test_extract_txt_file(self, session):
        """Upload txt chunks then extract - verifies full flow."""
        upload_id = "test_extract_txt_002"
        text_content = "Senior Software Engineer role at Acme Corp. Skills: Python, FastAPI, MongoDB. Remote-friendly."
        content = text_content.encode("utf-8")

        # Upload chunk
        files = {"chunk": ("context.txt", io.BytesIO(content), "text/plain")}
        data = {"upload_id": upload_id, "chunk_index": "0", "total_chunks": "1", "filename": "context.txt"}
        up_resp = session.post(f"{BASE_URL}/api/ai/upload-chunk", files=files, data=data)
        assert up_resp.status_code == 200, f"Upload chunk failed: {up_resp.text}"

        # Extract
        resp = session.post(
            f"{BASE_URL}/api/ai/extract-file",
            json={"upload_id": upload_id, "filename": "context.txt"},
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        body = resp.json()
        assert "extracted_text" in body, "Missing extracted_text in response"
        assert "char_count" in body, "Missing char_count in response"
        assert body["char_count"] > 0, "char_count should be > 0"
        assert "Senior Software Engineer" in body["extracted_text"], "Expected text content not found"
        assert body["filename"] == "context.txt"
        print(f"PASS: extract-file txt → char_count={body['char_count']}, preview='{body['extracted_text'][:60]}'")

    def test_extract_missing_upload_session(self, session):
        """Extract with non-existent upload_id should return 404."""
        resp = session.post(
            f"{BASE_URL}/api/ai/extract-file",
            json={"upload_id": "nonexistent_upload_xyz999", "filename": "test.txt"},
        )
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}: {resp.text}"
        print(f"PASS: extract-file missing session → 404")

    def test_extract_unauthenticated(self):
        """Extract without auth should return 401."""
        s = requests.Session()
        resp = s.post(
            f"{BASE_URL}/api/ai/extract-file",
            json={"upload_id": "some_id", "filename": "test.txt"},
        )
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: extract-file unauthenticated → 401")


class TestDownloadDocument:
    """Tests for POST /api/ai/download"""

    SAMPLE_CONTENT = """# Senior Software Engineer\n\n## Role Summary\nWe are looking for a **Senior Software Engineer** to join our team.\n\n## Key Responsibilities\n- Design and build scalable APIs\n- Lead technical discussions\n\n## Requirements\n- 5+ years Python experience\n- Experience with FastAPI and MongoDB"""

    def test_download_txt(self, session):
        """Download content as .txt file."""
        resp = session.post(
            f"{BASE_URL}/api/ai/download",
            json={"content": self.SAMPLE_CONTENT, "format": "txt", "filename": "JD Builder"},
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        assert "text/plain" in resp.headers.get("content-type", ""), f"Expected text/plain, got {resp.headers.get('content-type')}"
        assert "attachment" in resp.headers.get("content-disposition", ""), "Missing content-disposition header"
        assert ".txt" in resp.headers.get("content-disposition", ""), "Expected .txt in content-disposition"
        assert len(resp.content) > 0, "Empty response content"
        print(f"PASS: download txt → {resp.headers.get('content-disposition')}, size={len(resp.content)} bytes")

    def test_download_docx(self, session):
        """Download content as .docx file."""
        resp = session.post(
            f"{BASE_URL}/api/ai/download",
            json={"content": self.SAMPLE_CONTENT, "format": "docx", "filename": "JD Builder"},
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        ct = resp.headers.get("content-type", "")
        assert "openxmlformats" in ct or "docx" in ct or "officedocument" in ct, f"Expected docx content-type, got {ct}"
        assert "attachment" in resp.headers.get("content-disposition", "")
        assert ".docx" in resp.headers.get("content-disposition", "")
        assert len(resp.content) > 0
        # Verify it's a valid ZIP (docx files are ZIP archives)
        assert resp.content[:2] == b"PK", "DOCX file should start with PK (ZIP magic bytes)"
        print(f"PASS: download docx → {resp.headers.get('content-disposition')}, size={len(resp.content)} bytes")

    def test_download_pdf(self, session):
        """Download content as .pdf file."""
        resp = session.post(
            f"{BASE_URL}/api/ai/download",
            json={"content": self.SAMPLE_CONTENT, "format": "pdf", "filename": "JD Builder"},
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        ct = resp.headers.get("content-type", "")
        assert "pdf" in ct, f"Expected application/pdf, got {ct}"
        assert "attachment" in resp.headers.get("content-disposition", "")
        assert ".pdf" in resp.headers.get("content-disposition", "")
        assert len(resp.content) > 0
        # Verify it's a valid PDF (starts with %PDF)
        assert resp.content[:4] == b"%PDF", f"PDF should start with %PDF, got {resp.content[:10]}"
        print(f"PASS: download pdf → {resp.headers.get('content-disposition')}, size={len(resp.content)} bytes")

    def test_download_invalid_format(self, session):
        """Download with invalid format should return 400."""
        resp = session.post(
            f"{BASE_URL}/api/ai/download",
            json={"content": "test content", "format": "xlsx", "filename": "test"},
        )
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.text}"
        print(f"PASS: download invalid format → 400")

    def test_download_unauthenticated(self):
        """Download without auth should return 401."""
        s = requests.Session()
        resp = s.post(
            f"{BASE_URL}/api/ai/download",
            json={"content": "test", "format": "txt", "filename": "test"},
        )
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: download unauthenticated → 401")
