"""
One-shot migration: encrypt any legacy plaintext `openai_api_key` values in
`users` so all keys at rest are Fernet-encrypted.

Runs on backend startup (idempotent — encrypted rows are skipped). Logs the
number of rows migrated.
"""
import logging
from utils.database import db
from utils.crypto import encrypt, is_encrypted

logger = logging.getLogger(__name__)


async def encrypt_legacy_api_keys() -> int:
    """Encrypt all plaintext `openai_api_key` values. Returns count migrated."""
    cursor = db.users.find(
        {"openai_api_key": {"$exists": True, "$nin": [None, ""]}},
        {"_id": 0, "user_id": 1, "openai_api_key": 1},
    )
    migrated = 0
    async for u in cursor:
        key = u.get("openai_api_key")
        if not key or is_encrypted(key):
            continue
        await db.users.update_one(
            {"user_id": u["user_id"]},
            {"$set": {"openai_api_key": encrypt(key)}},
        )
        migrated += 1
    if migrated:
        logger.info("Encrypted %d legacy plaintext API key(s) at rest.", migrated)
    return migrated
