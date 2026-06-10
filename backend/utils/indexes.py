"""
Central MongoDB index registry + idempotent creator.

HOW TO ADD A NEW INDEX (future reference):
  1. Add an entry to INDEX_REGISTRY under the target collection:
       {"keys": [("field", 1)], "options": {"name": "ix_field", ...}}
  2. Restart the backend — ensure_indexes() runs on startup and is idempotent.
  3. Document the new index in /app/aboutindexes.md.

NOTES:
  - Every index MUST have an explicit "name" so changes are detectable/manageable.
  - create_index() is a no-op when an identical index already exists.
  - If you CHANGE the keys/options of an existing index name, Mongo raises a
    conflict error. ensure_indexes() catches it, drops the old index by name,
    and recreates it with the new definition (safe, automatic migration).
  - TTL index on user_sessions.expires_at requires the field to be a BSON Date
    (Python datetime), NOT an ISO string. routers/auth.py stores it as datetime.
"""
import logging
from pymongo import ASCENDING, DESCENDING, TEXT
from pymongo.errors import OperationFailure

from utils.database import db

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Declarative index registry — single source of truth for all DB indexes.
# ---------------------------------------------------------------------------
INDEX_REGISTRY = {
    "users": [
        # Primary app-level identifier (UUID) — used by every auth'd request
        {"keys": [("user_id", ASCENDING)],
         "options": {"name": "uniq_user_id", "unique": True}},
        # Login + uniqueness guarantee
        {"keys": [("email", ASCENDING)],
         "options": {"name": "uniq_email", "unique": True}},
        # Admin user-list filters
        {"keys": [("role", ASCENDING)], "options": {"name": "ix_role"}},
        {"keys": [("status", ASCENDING)], "options": {"name": "ix_status"}},
        # Leaderboard sort + rank computation (points DESC)
        {"keys": [("points", DESCENDING)], "options": {"name": "ix_points_desc"}},
        # Admin list default sort
        {"keys": [("created_at", DESCENDING)], "options": {"name": "ix_created_desc"}},
    ],

    "user_sessions": [
        # HOT PATH: looked up on every authenticated API request
        {"keys": [("session_token", ASCENDING)],
         "options": {"name": "uniq_session_token", "unique": True}},
        # Logout-all / per-user session management
        {"keys": [("user_id", ASCENDING)], "options": {"name": "ix_user_id"}},
        # TTL: Mongo auto-deletes session docs once expires_at passes.
        # REQUIRES expires_at stored as datetime (see routers/auth.py).
        {"keys": [("expires_at", ASCENDING)],
         "options": {"name": "ttl_expires_at", "expireAfterSeconds": 0}},
    ],

    "challenges": [
        {"keys": [("challenge_id", ASCENDING)],
         "options": {"name": "uniq_challenge_id", "unique": True}},
        # List page default sort
        {"keys": [("created_at", DESCENDING)], "options": {"name": "ix_created_desc"}},
        # "My challenges" / dashboard last-posted (covers author_id-only queries too)
        {"keys": [("author_id", ASCENDING), ("created_at", DESCENDING)],
         "options": {"name": "ix_author_created"}},
        # Tag filtering (multikey)
        {"keys": [("tags", ASCENDING)], "options": {"name": "ix_tags"}},
        # Full-text search (future replacement for unindexed $regex search)
        {"keys": [("title", TEXT), ("description", TEXT)],
         "options": {"name": "txt_title_description",
                     "weights": {"title": 10, "description": 5}}},
    ],

    "answers": [
        {"keys": [("answer_id", ASCENDING)],
         "options": {"name": "uniq_answer_id", "unique": True}},
        # Challenge detail page: answers for a challenge sorted by upvotes DESC
        {"keys": [("challenge_id", ASCENDING), ("upvotes", DESCENDING)],
         "options": {"name": "ix_challenge_upvotes"}},
        # "My answers" / dashboard last-answered
        {"keys": [("author_id", ASCENDING), ("created_at", DESCENDING)],
         "options": {"name": "ix_author_created"}},
        # Global activity feed
        {"keys": [("created_at", DESCENDING)], "options": {"name": "ix_created_desc"}},
    ],

    "ai_history": [
        # Per-user AI history, newest first
        {"keys": [("user_id", ASCENDING), ("created_at", DESCENDING)],
         "options": {"name": "ix_user_created"}},
    ],

    "api_usage": [
        # One usage doc per user per day (daily free-tier limit)
        {"keys": [("user_id", ASCENDING), ("date", ASCENDING)],
         "options": {"name": "uniq_user_date", "unique": True}},
    ],

    "tool_prompts": [
        # Hot path: ai_generate fetches the active prompt per tool
        {"keys": [("tool_id", ASCENDING), ("status", ASCENDING)],
         "options": {"name": "ix_tool_status"}},
        {"keys": [("prompt_id", ASCENDING)],
         "options": {"name": "uniq_prompt_id", "unique": True}},
        # Invariant: at most one ACTIVE prompt per tool (partial unique)
        {"keys": [("tool_id", ASCENDING)],
         "options": {"name": "uniq_active_per_tool", "unique": True,
                     "partialFilterExpression": {"status": "active"}}},
    ],
}


async def ensure_indexes() -> dict:
    """Create all registry indexes. Idempotent; safe to run on every startup.

    Returns a summary dict: {collection: [index names ensured]}.
    Never raises — a failed index must not block app startup.
    """
    summary = {}
    for collection_name, specs in INDEX_REGISTRY.items():
        collection = db[collection_name]
        ensured = []
        for spec in specs:
            name = spec["options"]["name"]
            try:
                await collection.create_index(spec["keys"], **spec["options"])
                ensured.append(name)
            except OperationFailure as e:
                # Index exists with same name but different definition →
                # drop by name and recreate with the new spec.
                logger.warning(
                    "Index conflict on %s.%s (%s) — recreating", collection_name, name, e
                )
                try:
                    await collection.drop_index(name)
                    await collection.create_index(spec["keys"], **spec["options"])
                    ensured.append(name)
                except Exception as e2:
                    logger.error(
                        "Failed to recreate index %s.%s: %s", collection_name, name, e2
                    )
            except Exception as e:
                logger.error(
                    "Failed to create index %s.%s: %s", collection_name, name, e
                )
        summary[collection_name] = ensured
    logger.info("MongoDB indexes ensured: %s", summary)
    return summary
