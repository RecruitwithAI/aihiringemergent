"""
Backend tests for the new Dashboard homepage features:
- /api/dashboard/stats endpoint with last_ai_tool, last_challenge, activity_feed
- Auth endpoints: login, register redirecting to /dashboard
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://api-key-mgmt-1.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

TEST_USER_EMAIL = "testdash@bestpl.ai"
TEST_USER_PASSWORD = "Test1234!"

# ==================== Fixtures ====================

@pytest.fixture(scope="module")
def session():
    """Shared requests session with cookies enabled"""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s

@pytest.fixture(scope="module")
def auth_session(session):
    """Authenticated session with cookie for testdash@bestpl.ai"""
    resp = session.post(f"{API}/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    })
    if resp.status_code != 200:
        # Try registering
        ts = datetime.now().strftime("%H%M%S%f")
        email = f"TEST_dashtest_{ts}@bestpl.ai"
        reg = session.post(f"{API}/auth/register", json={
            "name": f"Dash Tester {ts}",
            "email": email,
            "password": "Test1234!"
        })
        if reg.status_code != 200:
            pytest.skip(f"Could not authenticate - login {resp.status_code}, register {reg.status_code}")
    return session

@pytest.fixture(scope="module")
def new_user_session():
    """Fresh session for a brand new user with no history"""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    ts = datetime.now().strftime("%H%M%S%f")
    email = f"TEST_newuser_{ts}@bestpl.ai"
    resp = s.post(f"{API}/auth/register", json={
        "name": f"New User {ts}",
        "email": email,
        "password": "Test1234!"
    })
    if resp.status_code != 200:
        pytest.skip(f"Could not register new user: {resp.status_code} - {resp.text}")
    return s


# ==================== Auth Tests ====================

class TestAuthEndpoints:
    """Test authentication: login + register return correct user data"""

    def test_login_returns_200_and_user_data(self, session):
        resp = session.post(f"{API}/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        data = resp.json()
        assert "user_id" in data
        assert "name" in data
        assert "email" in data
        assert data["email"] == TEST_USER_EMAIL
        assert "badge" in data
        print(f"Login OK - user: {data['name']}, badge: {data['badge']}")

    def test_login_sets_session_cookie(self, session):
        resp = session.post(f"{API}/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert resp.status_code == 200
        # Session cookie should be set
        assert "session_token" in session.cookies or resp.headers.get("set-cookie"), \
            "session_token cookie was not set after login"
        print("Session cookie set correctly after login")

    def test_register_new_user_returns_200(self):
        ts = datetime.now().strftime("%H%M%S%f")
        email = f"TEST_reg_{ts}@bestpl.ai"
        s = requests.Session()
        resp = s.post(f"{API}/auth/register", json={
            "name": f"TEST Register {ts}",
            "email": email,
            "password": "Test1234!"
        })
        assert resp.status_code == 200, f"Registration failed: {resp.text}"
        data = resp.json()
        assert "user_id" in data
        assert "name" in data
        assert data["email"] == email
        assert data["points"] == 0
        assert data["badge"] == "Bronze"
        print(f"Registration OK - user: {data['name']}, badge: {data['badge']}")

    def test_register_sets_session_cookie(self):
        ts = datetime.now().strftime("%H%M%S%f")
        email = f"TEST_regcookie_{ts}@bestpl.ai"
        s = requests.Session()
        resp = s.post(f"{API}/auth/register", json={
            "name": f"TEST CookieReg {ts}",
            "email": email,
            "password": "Test1234!"
        })
        assert resp.status_code == 200
        assert "session_token" in s.cookies or resp.headers.get("set-cookie"), \
            "session_token cookie was not set after registration"
        print("Session cookie set correctly after registration")

    def test_invalid_login_returns_401(self, session):
        resp = session.post(f"{API}/auth/login", json={
            "email": "nonexistent@bestpl.ai",
            "password": "WrongPass999"
        })
        assert resp.status_code == 401
        data = resp.json()
        assert "detail" in data
        print(f"Invalid login correctly returns 401: {data['detail']}")

    def test_get_me_when_authenticated(self, auth_session):
        resp = auth_session.get(f"{API}/auth/me")
        assert resp.status_code == 200
        data = resp.json()
        assert "user_id" in data
        assert "name" in data
        assert "badge" in data
        print(f"/auth/me OK - user: {data['name']}, badge: {data['badge']}")


# ==================== Dashboard Stats Tests ====================

class TestDashboardStats:
    """Test GET /api/dashboard/stats - new enhanced endpoint with last_ai_tool, last_challenge, activity_feed"""

    def test_dashboard_stats_returns_200(self, auth_session):
        resp = auth_session.get(f"{API}/dashboard/stats")
        assert resp.status_code == 200, f"Dashboard stats failed: {resp.text}"
        print("Dashboard stats returns 200 OK")

    def test_dashboard_stats_has_required_fields(self, auth_session):
        resp = auth_session.get(f"{API}/dashboard/stats")
        assert resp.status_code == 200
        data = resp.json()

        required_fields = [
            "total_members", "total_challenges", "total_answers",
            "user_points", "user_badge", "user_rank",
            "recent_challenges", "last_ai_tool", "last_challenge", "activity_feed"
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        print(f"All required fields present: {required_fields}")

    def test_dashboard_stats_user_badge_is_valid(self, auth_session):
        resp = auth_session.get(f"{API}/dashboard/stats")
        data = resp.json()
        valid_badges = ["Bronze", "Silver", "Gold", "Diamond"]
        assert data["user_badge"] in valid_badges, \
            f"Invalid badge: {data['user_badge']}, expected one of {valid_badges}"
        print(f"User badge is valid: {data['user_badge']}")

    def test_dashboard_stats_numeric_fields(self, auth_session):
        resp = auth_session.get(f"{API}/dashboard/stats")
        data = resp.json()
        assert isinstance(data["total_members"], int) and data["total_members"] >= 0
        assert isinstance(data["total_challenges"], int) and data["total_challenges"] >= 0
        assert isinstance(data["total_answers"], int) and data["total_answers"] >= 0
        assert isinstance(data["user_points"], int) and data["user_points"] >= 0
        assert isinstance(data["user_rank"], int)
        print(f"Numeric fields valid - members:{data['total_members']}, challenges:{data['total_challenges']}, rank:{data['user_rank']}")

    def test_dashboard_stats_recent_challenges_is_list(self, auth_session):
        resp = auth_session.get(f"{API}/dashboard/stats")
        data = resp.json()
        assert isinstance(data["recent_challenges"], list)
        # Max 5 per backend
        assert len(data["recent_challenges"]) <= 5
        print(f"recent_challenges is a list with {len(data['recent_challenges'])} items")

    def test_dashboard_stats_activity_feed_is_list(self, auth_session):
        resp = auth_session.get(f"{API}/dashboard/stats")
        data = resp.json()
        assert isinstance(data["activity_feed"], list)
        # Max 10 per backend
        assert len(data["activity_feed"]) <= 10
        print(f"activity_feed is a list with {len(data['activity_feed'])} items")

    def test_dashboard_stats_activity_feed_item_structure(self, auth_session):
        resp = auth_session.get(f"{API}/dashboard/stats")
        data = resp.json()
        feed = data["activity_feed"]
        if len(feed) == 0:
            pytest.skip("No activity feed items to validate structure")
        for item in feed:
            assert "type" in item, "Feed item missing 'type'"
            assert item["type"] in ["challenge", "answer"], f"Invalid feed type: {item['type']}"
            assert "challenge_id" in item, "Feed item missing 'challenge_id'"
            assert "author" in item, "Feed item missing 'author'"
            assert "created_at" in item, "Feed item missing 'created_at'"
        print(f"Activity feed item structure OK for {len(feed)} items")

    def test_dashboard_stats_last_ai_tool_structure(self, auth_session):
        resp = auth_session.get(f"{API}/dashboard/stats")
        data = resp.json()
        last_ai = data["last_ai_tool"]
        if last_ai is None:
            print("last_ai_tool is None (no AI history) - OK for new users")
            return
        # If present, validate fields
        assert "tool_type" in last_ai, "last_ai_tool missing 'tool_type'"
        assert "prompt" in last_ai, "last_ai_tool missing 'prompt'"
        assert "created_at" in last_ai, "last_ai_tool missing 'created_at'"
        print(f"last_ai_tool structure OK: tool_type={last_ai['tool_type']}")

    def test_dashboard_stats_last_challenge_structure(self, auth_session):
        resp = auth_session.get(f"{API}/dashboard/stats")
        data = resp.json()
        last_ch = data["last_challenge"]
        if last_ch is None:
            print("last_challenge is None (no challenge history) - OK for some users")
            return
        assert "challenge_id" in last_ch, "last_challenge missing 'challenge_id'"
        assert "title" in last_ch, "last_challenge missing 'title'"
        assert "interaction_type" in last_ch, "last_challenge missing 'interaction_type'"
        assert last_ch["interaction_type"] in ["posted", "answered"], \
            f"Invalid interaction_type: {last_ch['interaction_type']}"
        print(f"last_challenge structure OK: {last_ch['title']} ({last_ch['interaction_type']})")

    def test_new_user_has_null_last_ai_tool(self, new_user_session):
        """Brand new user should have no AI history"""
        resp = new_user_session.get(f"{API}/dashboard/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["last_ai_tool"] is None, \
            f"New user should have null last_ai_tool, got: {data['last_ai_tool']}"
        print("New user correctly has null last_ai_tool")

    def test_new_user_has_null_last_challenge(self, new_user_session):
        """Brand new user should have no challenge history"""
        resp = new_user_session.get(f"{API}/dashboard/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["last_challenge"] is None, \
            f"New user should have null last_challenge, got: {data['last_challenge']}"
        print("New user correctly has null last_challenge")

    def test_dashboard_stats_requires_auth(self):
        """Stats endpoint should return 401 without authentication"""
        s = requests.Session()
        resp = s.get(f"{API}/dashboard/stats")
        assert resp.status_code == 401, \
            f"Expected 401 for unauthenticated request, got {resp.status_code}"
        print("Dashboard stats correctly requires authentication (401)")

    def test_recent_challenges_have_author_field(self, auth_session):
        """Recent challenges in dashboard stats should include author info"""
        resp = auth_session.get(f"{API}/dashboard/stats")
        data = resp.json()
        recent = data["recent_challenges"]
        if len(recent) == 0:
            pytest.skip("No recent challenges to validate")
        for c in recent:
            assert "author" in c, "Challenge missing 'author' field"
            assert "challenge_id" in c
            assert "title" in c
        print(f"Recent challenges have author field - {len(recent)} challenges validated")

    def test_activity_feed_sorted_by_recent(self, auth_session):
        """Activity feed should be sorted newest first"""
        resp = auth_session.get(f"{API}/dashboard/stats")
        data = resp.json()
        feed = data["activity_feed"]
        if len(feed) < 2:
            pytest.skip("Not enough feed items to check ordering")
        # Dates should be in descending order
        dates = [item["created_at"] for item in feed]
        assert dates == sorted(dates, reverse=True), \
            f"Activity feed not sorted newest first: {dates[:3]}"
        print(f"Activity feed correctly sorted newest first ({len(feed)} items)")


# ==================== Leaderboard Test ====================

class TestLeaderboard:
    """Test /api/leaderboard"""

    def test_leaderboard_returns_users(self, auth_session):
        resp = auth_session.get(f"{API}/leaderboard")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) > 0
        for u in data[:3]:
            assert "rank" in u
            assert "badge" in u
            assert "points" in u
        print(f"Leaderboard OK - {len(data)} users, top: rank={data[0]['rank']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
