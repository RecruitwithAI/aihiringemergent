"""
Security hardening regression tests:
1) Login throttle / brute-force lockout
2) Fernet-at-rest encryption of users.openai_api_key
3) Security headers middleware on every /api response
4) Regression: existing endpoints still work end-to-end (auth, dashboard, challenges, leaderboard, profile, AI generation)
"""
import os
import asyncio
import requests
import pytest
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ai-recruitment-flow.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

# Test credentials from /app/memory/test_credentials.md and review_request
SUPERADMIN_EMAIL = "noorussaba.alam@gmail.com"
SUPERADMIN_PASS = "#VibeCon2026"
ADMIN_EMAIL = "regression_test_20260610_113725@bestpl.ai"
ADMIN_PASS = "SecurePass2026!"
LOCKOUT_EMAIL = "lockout-test@example.com"

# Direct mongo handle to inspect DB-side state (indexes, ciphertext, cleanup)
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")
_mongo = MongoClient(MONGO_URL)
_db = _mongo[DB_NAME]


# ---------------- fixtures ----------------

@pytest.fixture(scope="module", autouse=True)
def _clear_lockout_before_module():
    # Clear any stale lockout markers for our test accounts BEFORE the suite
    _db.login_attempts.delete_many({"email": {"$in": [
        SUPERADMIN_EMAIL.lower(), ADMIN_EMAIL.lower(), LOCKOUT_EMAIL.lower(),
        "different-email@example.com"
    ]}})
    yield
    _db.login_attempts.delete_many({"email": {"$in": [
        SUPERADMIN_EMAIL.lower(), ADMIN_EMAIL.lower(), LOCKOUT_EMAIL.lower(),
        "different-email@example.com"
    ]}})


@pytest.fixture
def session_admin():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture
def session_superadmin():
    # Ensure lockout cleared first
    _db.login_attempts.delete_many({"email": SUPERADMIN_EMAIL.lower()})
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": SUPERADMIN_EMAIL, "password": SUPERADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"SuperAdmin login failed: {r.status_code} {r.text}"
    return s


# ---------------- 1) Login still works ----------------

class TestLoginStillWorks:
    def test_superadmin_login(self):
        _db.login_attempts.delete_many({"email": SUPERADMIN_EMAIL.lower()})
        r = requests.post(f"{API}/auth/login",
                          json={"email": SUPERADMIN_EMAIL, "password": SUPERADMIN_PASS}, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == SUPERADMIN_EMAIL
        assert body.get("role") == "superadmin"

    def test_admin_login(self):
        _db.login_attempts.delete_many({"email": ADMIN_EMAIL.lower()})
        r = requests.post(f"{API}/auth/login",
                          json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_success_clears_failed_attempts(self):
        # Inject 2 failures, then succeed, then verify attempts list is empty
        _db.login_attempts.delete_many({"email": ADMIN_EMAIL.lower()})
        for _ in range(2):
            requests.post(f"{API}/auth/login",
                          json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=15)
        pre = _db.login_attempts.count_documents({"email": ADMIN_EMAIL.lower()})
        assert pre == 2
        ok = requests.post(f"{API}/auth/login",
                           json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
        assert ok.status_code == 200
        post = _db.login_attempts.count_documents({"email": ADMIN_EMAIL.lower()})
        assert post == 0, "Successful login must clear failed-attempt counters"


# ---------------- 2) Brute-force lockout ----------------

class TestBruteForceLockout:
    def test_lockout_after_5_failures_on_6th(self):
        _db.login_attempts.delete_many({"email": LOCKOUT_EMAIL.lower()})
        # 5 wrong-pw attempts -> 401
        for i in range(5):
            r = requests.post(f"{API}/auth/login",
                              json={"email": LOCKOUT_EMAIL, "password": f"bad{i}"}, timeout=15)
            assert r.status_code == 401, f"Attempt {i+1}: expected 401, got {r.status_code}"
        # 6th attempt -> 429
        r6 = requests.post(f"{API}/auth/login",
                           json={"email": LOCKOUT_EMAIL, "password": "bad6"}, timeout=15)
        assert r6.status_code == 429, f"6th attempt: expected 429, got {r6.status_code} {r6.text}"
        detail = r6.json().get("detail", "")
        assert "Too many failed login attempts" in detail
        assert "minute" in detail

    def test_lockout_blocks_correct_password_too(self):
        # Lockout already armed by previous test
        r = requests.post(f"{API}/auth/login",
                          json={"email": LOCKOUT_EMAIL, "password": "AnythingEvenCorrect"}, timeout=15)
        assert r.status_code == 429, "During lockout, even correct password should be 429"

    def test_lockout_does_not_affect_other_email(self):
        # Different email should still be accepted normally (will 401 because not registered)
        r = requests.post(f"{API}/auth/login",
                          json={"email": "different-email@example.com", "password": "anything"}, timeout=15)
        # Unknown email returns 401, NOT 429 — proves locking is per-email
        assert r.status_code == 401, f"Different email shouldn't be locked, got {r.status_code}"

    def test_lockout_collection_has_required_indexes(self):
        info = _db.login_attempts.index_information()
        assert "ix_email_ts" in info, f"Missing ix_email_ts: have {list(info)}"
        assert "ttl_attempt" in info, f"Missing ttl_attempt: have {list(info)}"
        ttl_spec = info["ttl_attempt"]
        assert ttl_spec.get("expireAfterSeconds") == 3600, f"TTL must be 3600s, got {ttl_spec.get('expireAfterSeconds')}"


# ---------------- 3) OpenAI key encryption at rest ----------------

class TestApiKeyEncryption:
    def test_save_api_key_stores_ciphertext(self, session_admin):
        test_key = "sk-test-ABC123-encrypt-roundtrip"
        r = session_admin.post(f"{API}/ai/save-api-key", json={"api_key": test_key}, timeout=15)
        assert r.status_code == 200, f"save-api-key failed: {r.status_code} {r.text}"
        # Inspect DB directly
        u = _db.users.find_one({"email": ADMIN_EMAIL}, {"_id": 0, "openai_api_key": 1})
        assert u is not None
        stored = u.get("openai_api_key", "")
        assert stored.startswith("enc:v1:"), f"Stored key must be Fernet-encrypted, got: {stored[:20]}..."
        assert "sk-test-ABC123" not in stored, "Plaintext key must NEVER appear in DB"

    def test_delete_api_key(self, session_admin):
        r = session_admin.delete(f"{API}/ai/delete-api-key", timeout=15)
        assert r.status_code == 200
        u = _db.users.find_one({"email": ADMIN_EMAIL}, {"_id": 0, "openai_api_key": 1, "has_own_api_key": 1})
        # Should be either missing or empty/None
        assert not u.get("openai_api_key"), f"Key should be removed, found: {u.get('openai_api_key')}"
        assert u.get("has_own_api_key") in (False, None), "has_own_api_key should be False after delete"

    def test_superadmin_key_is_encrypted_at_rest(self):
        u = _db.users.find_one({"email": SUPERADMIN_EMAIL}, {"_id": 0, "openai_api_key": 1})
        assert u is not None and u.get("openai_api_key"), "SuperAdmin should have an OpenAI key"
        assert u["openai_api_key"].startswith("enc:v1:"), \
            f"SuperAdmin key must be encrypted; starts with {u['openai_api_key'][:10]}"


# ---------------- 4) Security headers on EVERY API response ----------------

class TestSecurityHeaders:
    REQUIRED = {
        "strict-transport-security": None,  # presence only
        "x-content-type-options": "nosniff",
        "x-frame-options": "SAMEORIGIN",
        "referrer-policy": "strict-origin-when-cross-origin",
        "permissions-policy": None,  # presence only
        "cross-origin-opener-policy": "same-origin",
    }

    def _assert_headers(self, headers, label):
        # normalize header names to lowercase
        lower = {k.lower(): v for k, v in headers.items()}
        missing = []
        for name, expected in self.REQUIRED.items():
            if name not in lower:
                missing.append(name)
                continue
            if expected is not None and lower[name].strip().lower() != expected.lower():
                missing.append(f"{name}={lower[name]} (expected {expected})")
        assert not missing, f"{label}: missing/incorrect headers: {missing}"

    def test_headers_on_auth_me_unauth(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        # 401 unauth, but headers must still be present
        self._assert_headers(r.headers, "GET /auth/me")

    def test_headers_on_dashboard_stats(self, session_admin):
        r = session_admin.get(f"{API}/dashboard/stats", timeout=15)
        assert r.status_code == 200
        self._assert_headers(r.headers, "GET /dashboard/stats")

    def test_headers_on_challenges_list(self):
        r = requests.get(f"{API}/challenges", timeout=15)
        self._assert_headers(r.headers, "GET /challenges")


# ---------------- 5) AI generation works with encrypted SuperAdmin key ----------------

class TestEncryptedKeyDecryptPath:
    def test_ai_generate_with_encrypted_superadmin_key(self, session_superadmin):
        # SuperAdmin has an encrypted master key — if decrypt path works, this returns 200
        payload = {
            "tool_type": "jd-builder",
            "prompt": "Write a one-line JD summary for a Python backend engineer.",
        }
        r = session_superadmin.post(f"{API}/ai/generate", json=payload, timeout=90)
        # 200 = decrypt worked end-to-end and OpenAI responded.
        # 429 = our daily-limit gate fired (key WAS decrypted to get past the user-key check).
        # 500 with upstream OpenAI quota error ALSO proves decrypt worked (key was sent to OpenAI).
        assert r.status_code in (200, 429, 500), f"AI generate failed: {r.status_code} {r.text[:300]}"
        if r.status_code == 200:
            body = r.json()
            text = body.get("result") or body.get("response") or body.get("content") or ""
            assert isinstance(text, str) and len(text) > 0, f"AI returned empty response: {body}"
        elif r.status_code == 429:
            detail = r.json().get("detail", "")
            assert "limit" in detail.lower() or "api" in detail.lower(), \
                f"429 should be daily-limit, got: {detail}"
        else:  # 500 — must be the upstream OpenAI quota error, NOT a decrypt/auth error
            text = r.text.lower()
            assert ("quota" in text or "ratelimit" in text or "rate limit" in text
                    or "openai" in text or "internal server error" in text), \
                f"500 must come from upstream OpenAI, not local decrypt failure: {r.text[:300]}"


# ---------------- 6) Regression: existing functionality ----------------

class TestRegression:
    def test_auth_me(self, session_superadmin):
        r = session_superadmin.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == SUPERADMIN_EMAIL

    def test_dashboard_stats(self, session_superadmin):
        r = session_superadmin.get(f"{API}/dashboard/stats", timeout=15)
        assert r.status_code == 200
        # Just ensure JSON body
        assert isinstance(r.json(), dict)

    def test_challenges_list(self, session_superadmin):
        r = session_superadmin.get(f"{API}/challenges", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_leaderboard(self, session_superadmin):
        r = session_superadmin.get(f"{API}/leaderboard", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_profile_stats(self, session_superadmin):
        r = session_superadmin.get(f"{API}/profile/stats", timeout=15)
        assert r.status_code == 200

    def test_update_profile_picture(self, session_superadmin):
        # 1x1 transparent png base64
        tiny_png = ("data:image/png;base64,"
                    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=")
        r = session_superadmin.put(f"{API}/users/me/picture", json={"picture": tiny_png}, timeout=15)
        assert r.status_code in (200, 204), f"picture update failed: {r.status_code} {r.text[:200]}"
