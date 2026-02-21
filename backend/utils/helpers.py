import uuid
from datetime import datetime, timezone


def get_badge(points: int) -> str:
    if points >= 500:
        return "Diamond"
    if points >= 200:
        return "Gold"
    if points >= 100:
        return "Silver"
    return "Bronze"


def make_session_token() -> str:
    return f"session_{uuid.uuid4().hex}"


def make_user_id() -> str:
    return f"user_{uuid.uuid4().hex[:12]}"
