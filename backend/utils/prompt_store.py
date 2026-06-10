"""
Data access for the `tool_prompts` collection (SuperAdmin-editable system prompts).

Document shape:
  prompt_id      str  (uuid, unique)
  tool_id        str  (AITool, e.g. "jd-builder")
  system_prompt  str  (SystemPrompt)
  status         str  ("active" | "old" | "draft")
  version        int  (increments per tool on each activation/draft)
  updated_by     str  (user name or "system")
  created_at     str  (ISO)
  updated_at     str  (ISO)

Invariant: at most ONE doc per tool_id has status="active"
(enforced by partial unique index `uniq_active_per_tool` + demote logic).
"""
import logging
import uuid
from datetime import datetime, timezone

from utils.database import db
from utils.default_prompts import TOOL_PROMPTS

logger = logging.getLogger(__name__)

VALID_STATUSES = ("active", "old", "draft")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_prompt_doc(tool_id: str, system_prompt: str, status: str, version: int, updated_by: str) -> dict:
    now = _now()
    return {
        "prompt_id": f"prm_{uuid.uuid4().hex[:12]}",
        "tool_id": tool_id,
        "system_prompt": system_prompt,
        "status": status,
        "version": version,
        "updated_by": updated_by,
        "created_at": now,
        "updated_at": now,
    }


async def next_version(tool_id: str) -> int:
    """Next version number for a tool (max existing + 1)."""
    latest = await db.tool_prompts.find_one(
        {"tool_id": tool_id}, {"_id": 0, "version": 1}, sort=[("version", -1)]
    )
    return (latest["version"] + 1) if latest else 1


async def seed_default_prompts():
    """Idempotent: ensures every tool has an active prompt (seeded from defaults).

    Runs on every backend startup. Never overwrites existing prompts.
    """
    seeded = []
    for tool_id, prompt in TOOL_PROMPTS.items():
        existing = await db.tool_prompts.find_one(
            {"tool_id": tool_id, "status": "active"}, {"_id": 1}
        )
        if existing:
            continue
        version = await next_version(tool_id)
        await db.tool_prompts.insert_one(
            make_prompt_doc(tool_id, prompt, "active", version, "system (default)")
        )
        seeded.append(tool_id)
    if seeded:
        logger.info("Seeded default active prompts for: %s", seeded)
    return seeded


async def get_active_system_prompt(tool_id: str) -> str:
    """The prompt the LLM actually uses: active DB prompt, else hardcoded default."""
    doc = await db.tool_prompts.find_one(
        {"tool_id": tool_id, "status": "active"}, {"_id": 0, "system_prompt": 1}
    )
    if doc and doc.get("system_prompt", "").strip():
        return doc["system_prompt"]
    return TOOL_PROMPTS.get(tool_id, "You are a helpful recruiting AI assistant.")


async def activate_prompt_doc(prompt_id: str, updated_by: str):
    """Make the given prompt doc active; demote the tool's current active to 'old'.

    Returns the activated doc (without _id) or None if prompt_id not found.
    """
    target = await db.tool_prompts.find_one({"prompt_id": prompt_id}, {"_id": 0})
    if not target:
        return None

    # Demote current active first (keeps the partial-unique invariant)
    await db.tool_prompts.update_many(
        {"tool_id": target["tool_id"], "status": "active", "prompt_id": {"$ne": prompt_id}},
        {"$set": {"status": "old", "updated_at": _now()}},
    )
    await db.tool_prompts.update_one(
        {"prompt_id": prompt_id},
        {"$set": {"status": "active", "updated_by": updated_by, "updated_at": _now()}},
    )
    return await db.tool_prompts.find_one({"prompt_id": prompt_id}, {"_id": 0})
