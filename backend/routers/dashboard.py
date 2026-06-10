from fastapi import APIRouter, Depends
from utils.database import db
from utils.helpers import get_badge
from utils.auth import get_current_user


router = APIRouter(tags=["dashboard"])

_UNKNOWN_AUTHOR = {"name": "Unknown", "picture": None, "badge": "Bronze"}


# ============================================================
# Dashboard stats helpers (each independently testable)
# ============================================================

async def _get_author(user_id: str):
    """Fetch a lightweight author profile with badge, or a fallback."""
    author = await db.users.find_one(
        {"user_id": user_id},
        {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "points": 1},
    )
    if author:
        author["badge"] = get_badge(author.get("points", 0))
        return author
    return dict(_UNKNOWN_AUTHOR)


async def _get_global_counts() -> dict:
    return {
        "total_members": await db.users.count_documents({}),
        "total_challenges": await db.challenges.count_documents({}),
        "total_answers": await db.answers.count_documents({}),
    }


async def _get_recent_challenges(limit: int = 5) -> list:
    recent = await db.challenges.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    for c in recent:
        c["author"] = await _get_author(c.get("author_id"))
    return recent


async def _get_user_rank(user_id: str) -> int:
    user_rank_list = await db.users.find(
        {}, {"_id": 0, "user_id": 1, "points": 1}
    ).sort("points", -1).to_list(1000)
    return next((i + 1 for i, u in enumerate(user_rank_list) if u["user_id"] == user_id), 0)


async def _get_last_ai_tool(user_id: str):
    last_ai_list = await db.ai_history.find(
        {"user_id": user_id},
        {"_id": 0, "tool_type": 1, "prompt": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(1)
    return last_ai_list[0] if last_ai_list else None


async def _get_last_challenge_interaction(user_id: str):
    """Most recent challenge the user posted or answered."""
    last_posted_list = await db.challenges.find(
        {"author_id": user_id},
        {"_id": 0, "challenge_id": 1, "title": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(1)

    last_answered_list = await db.answers.find(
        {"author_id": user_id},
        {"_id": 0, "challenge_id": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(1)

    last_challenge = None
    if last_answered_list:
        ans = last_answered_list[0]
        ch = await db.challenges.find_one(
            {"challenge_id": ans["challenge_id"]},
            {"_id": 0, "challenge_id": 1, "title": 1}
        )
        if ch:
            last_challenge = {
                "challenge_id": ch["challenge_id"],
                "title": ch["title"],
                "interacted_at": ans["created_at"],
                "interaction_type": "answered",
            }
    if last_posted_list:
        posted = last_posted_list[0]
        if not last_challenge or posted["created_at"] > last_challenge.get("interacted_at", ""):
            last_challenge = {
                "challenge_id": posted["challenge_id"],
                "title": posted["title"],
                "interacted_at": posted["created_at"],
                "interaction_type": "posted",
            }
    return last_challenge


async def _build_activity_feed(limit: int = 10) -> list:
    """Recent community events (challenges + answers from all users), newest first."""
    feed_challenges = await db.challenges.find(
        {}, {"_id": 0, "challenge_id": 1, "title": 1, "author_id": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(8)

    feed_answers = await db.answers.find(
        {}, {"_id": 0, "answer_id": 1, "challenge_id": 1, "author_id": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(8)

    activity_feed = []
    for ch in feed_challenges:
        activity_feed.append({
            "type": "challenge",
            "challenge_id": ch["challenge_id"],
            "title": ch["title"],
            "author": await _get_author(ch["author_id"]),
            "created_at": ch["created_at"],
        })
    for ans in feed_answers:
        challenge_doc = await db.challenges.find_one(
            {"challenge_id": ans["challenge_id"]},
            {"_id": 0, "title": 1, "challenge_id": 1}
        )
        activity_feed.append({
            "type": "answer",
            "challenge_id": ans["challenge_id"],
            "challenge_title": challenge_doc["title"] if challenge_doc else "a challenge",
            "author": await _get_author(ans["author_id"]),
            "created_at": ans["created_at"],
        })

    activity_feed.sort(key=lambda x: x["created_at"], reverse=True)
    return activity_feed[:limit]


# ============================================================
# Endpoints
# ============================================================

@router.get("/dashboard/stats")
async def get_dashboard_stats(user=Depends(get_current_user)):
    counts = await _get_global_counts()
    return {
        **counts,
        "user_points": user.get("points", 0),
        "user_badge": get_badge(user.get("points", 0)),
        "user_rank": await _get_user_rank(user["user_id"]),
        "recent_challenges": await _get_recent_challenges(),
        "last_ai_tool": await _get_last_ai_tool(user["user_id"]),
        "last_challenge": await _get_last_challenge_interaction(user["user_id"]),
        "activity_feed": await _build_activity_feed(),
    }


@router.get("/leaderboard")
async def get_leaderboard(user=Depends(get_current_user)):
    users = await db.users.find(
        {}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "points": 1}
    ).sort("points", -1).to_list(50)
    for i, u in enumerate(users):
        u["rank"] = i + 1
        u["badge"] = get_badge(u.get("points", 0))
    return users


@router.get("/profile/stats")
async def get_profile_stats(user=Depends(get_current_user)):
    challenges_count = await db.challenges.count_documents({"author_id": user["user_id"]})
    answers_count = await db.answers.count_documents({"author_id": user["user_id"]})
    ai_uses = await db.ai_history.count_documents({"user_id": user["user_id"]})

    return {
        "challenges_posted": challenges_count,
        "answers_given": answers_count,
        "ai_tools_used": ai_uses,
        "points": user.get("points", 0),
        "badge": get_badge(user.get("points", 0)),
    }
