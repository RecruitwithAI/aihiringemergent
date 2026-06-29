"""
Brute-force protection for /api/auth/login.

Strategy:
- `login_attempts` collection records every failed login (`email`, `timestamp`).
- A user is "locked out" if there have been >= MAX_FAILED_ATTEMPTS failures in
  the last WINDOW_MINUTES *AND* the most recent failure is within LOCKOUT_MINUTES.
- On successful login: all attempts for that email are cleared.
- A TTL index on `timestamp` auto-deletes attempt rows older than the window.

This protects against:
- Credential stuffing (per-email, attacker-IP-agnostic)
- Slow brute force (TTL is per-row, so attempts age out individually)

It does NOT protect against distributed attacks across many emails — that
needs a per-IP layer + WAF. Acceptable for current scale.

Email is normalized to lowercase before lookup to avoid case-bypass.
"""
import logging
from datetime import datetime, timezone, timedelta
from utils.database import db

logger = logging.getLogger(__name__)

MAX_FAILED_ATTEMPTS = 5
WINDOW_MINUTES = 15      # count failures in this rolling window
LOCKOUT_MINUTES = 15     # how long the account is locked after threshold breach


def _normalize(email: str) -> str:
    return (email or "").strip().lower()


async def is_locked_out(email: str) -> tuple[bool, int]:
    """Return (locked, seconds_remaining). 0 seconds when not locked."""
    norm = _normalize(email)
    if not norm:
        return (False, 0)
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=WINDOW_MINUTES)
    recent_count = await db.login_attempts.count_documents(
        {"email": norm, "timestamp": {"$gte": cutoff}}
    )
    if recent_count < MAX_FAILED_ATTEMPTS:
        return (False, 0)
    # Threshold reached — check if lockout window has elapsed since LAST attempt
    last = await db.login_attempts.find_one(
        {"email": norm}, sort=[("timestamp", -1)], projection={"_id": 0, "timestamp": 1}
    )
    if not last:
        return (False, 0)
    last_ts = last["timestamp"]
    if isinstance(last_ts, str):
        last_ts = datetime.fromisoformat(last_ts)
    if last_ts.tzinfo is None:
        last_ts = last_ts.replace(tzinfo=timezone.utc)
    unlock_at = last_ts + timedelta(minutes=LOCKOUT_MINUTES)
    now = datetime.now(timezone.utc)
    if now >= unlock_at:
        return (False, 0)
    return (True, int((unlock_at - now).total_seconds()))


async def record_failed_attempt(email: str) -> None:
    """Insert a failed-login marker for the given email."""
    norm = _normalize(email)
    if not norm:
        return
    await db.login_attempts.insert_one({
        "email": norm,
        "timestamp": datetime.now(timezone.utc),
    })


async def clear_attempts(email: str) -> None:
    """Reset failed-attempt counter on successful login."""
    norm = _normalize(email)
    if not norm:
        return
    await db.login_attempts.delete_many({"email": norm})
