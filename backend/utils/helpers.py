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


# ── Shared aggregation helpers (author join via $lookup) ──

UNKNOWN_AUTHOR = {"name": "Unknown", "picture": None, "badge": "Bronze"}

# Reusable $lookup stage: joins lightweight author profile onto docs with author_id
AUTHOR_LOOKUP = {
    "$lookup": {
        "from": "users",
        "localField": "author_id",
        "foreignField": "user_id",
        "as": "author",
        "pipeline": [{"$project": {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "points": 1}}],
    }
}


def finalize_author(doc: dict) -> dict:
    """Unwrap the AUTHOR_LOOKUP array and attach badge (or Unknown fallback)."""
    author_list = doc.pop("author", None) or []
    author = author_list[0] if author_list else None
    if author:
        author["badge"] = get_badge(author.get("points", 0))
        doc["author"] = author
    else:
        doc["author"] = dict(UNKNOWN_AUTHOR)
    return doc
