"""
Symmetric encryption for sensitive at-rest fields (e.g. user OpenAI API keys).

Uses Fernet (AES-128-CBC + HMAC-SHA256) from `cryptography`. Each ciphertext is
authenticated, time-stamped, and tamper-evident.

Key handling:
- The encryption key is read from `API_KEY_ENCRYPTION_KEY` in backend/.env.
- Key format: 32-byte url-safe base64-encoded (generate via `Fernet.generate_key()`).
- Rotate by re-encrypting all rows under a new key (out of scope here).

API:
- `encrypt(plaintext)`  → ciphertext string (safe to store in MongoDB)
- `decrypt(ciphertext)` → plaintext string
- `is_encrypted(value)` → heuristic check used during the one-shot migration

Backward compatibility: existing PLAINTEXT keys in `users.openai_api_key` are
detected and migrated transparently on first access (see migration in
`utils/key_migration.py`).
"""
import os
import logging
from cryptography.fernet import Fernet, InvalidToken

logger = logging.getLogger(__name__)

# Sentinel prefix that lets us distinguish encrypted values from legacy plaintext
# OpenAI keys (which always start with "sk-").
ENCRYPTED_PREFIX = "enc:v1:"

_fernet: Fernet | None = None


def _get_fernet() -> Fernet:
    """Lazy-init Fernet from env. Raises clearly if the key is missing/invalid."""
    global _fernet
    if _fernet is not None:
        return _fernet
    key = os.environ.get("API_KEY_ENCRYPTION_KEY")
    if not key:
        raise RuntimeError(
            "API_KEY_ENCRYPTION_KEY is not set in backend/.env — "
            "generate one with `python -c 'from cryptography.fernet import Fernet; "
            "print(Fernet.generate_key().decode())'`"
        )
    try:
        _fernet = Fernet(key.encode() if isinstance(key, str) else key)
    except Exception as e:
        raise RuntimeError(f"Invalid API_KEY_ENCRYPTION_KEY: {e}") from e
    return _fernet


def encrypt(plaintext: str) -> str:
    """Encrypt a string. Returns `enc:v1:<token>`."""
    if not plaintext:
        return plaintext
    token = _get_fernet().encrypt(plaintext.encode("utf-8")).decode("ascii")
    return f"{ENCRYPTED_PREFIX}{token}"


def decrypt(value: str) -> str:
    """Decrypt a previously-encrypted value. Pass-through if not encrypted (legacy)."""
    if not value:
        return value
    if not value.startswith(ENCRYPTED_PREFIX):
        # Legacy plaintext value — returned as-is (migration will replace it later).
        return value
    token = value[len(ENCRYPTED_PREFIX):]
    try:
        return _get_fernet().decrypt(token.encode("ascii")).decode("utf-8")
    except InvalidToken:
        logger.error("Failed to decrypt API key — token is invalid or wrong key")
        raise


def is_encrypted(value: str) -> bool:
    """True iff `value` was produced by `encrypt()`."""
    return bool(value) and value.startswith(ENCRYPTED_PREFIX)
