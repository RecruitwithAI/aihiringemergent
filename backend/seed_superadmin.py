"""
Idempotent SuperAdmin seeder.

Reads SUPERADMIN_NAME / SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD from backend/.env.
- If the user doesn't exist: creates it with role=superadmin (same document shape
  as routers/auth.py register).
- If the user exists: promotes role to superadmin, ensures status=active, and
  resets the password hash to match the configured password.

Run:  cd /app/backend && python seed_superadmin.py
Safe to run repeatedly.
"""
import asyncio
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import bcrypt
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).parent))
load_dotenv(Path(__file__).parent / ".env")

from utils.database import db  # noqa: E402
from utils.helpers import make_user_id  # noqa: E402


async def seed_superadmin():
    name = os.environ.get("SUPERADMIN_NAME", "Super Admin")
    email = os.environ.get("SUPERADMIN_EMAIL")
    password = os.environ.get("SUPERADMIN_PASSWORD")
    if not email or not password:
        raise SystemExit("SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD must be set in backend/.env")

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    now = datetime.now(timezone.utc)

    existing = await db.users.find_one({"email": email}, {"_id": 0, "user_id": 1, "role": 1})
    if existing:
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "role": "superadmin",
                "status": "active",
                "password_hash": hashed,
                "updated_at": now.isoformat(),
            }},
        )
        print(f"UPDATED existing user {email} (user_id={existing['user_id']}) -> role=superadmin, password reset")
        return

    user_id = make_user_id()
    await db.users.insert_one({
        "user_id": user_id,
        "name": name,
        "email": email,
        "password_hash": hashed,
        "picture": None,
        "points": 0,
        "linkedin_url": "https://www.linkedin.com/in/noorussaba-alam",
        "title": None,
        "company": None,
        "phone_number": None,
        "city": None,
        "country": None,
        "about_me": None,
        "help_topics": [],
        "role": "superadmin",
        "status": "active",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "last_login_at": now.isoformat(),
    })
    print(f"CREATED superadmin {email} (user_id={user_id})")


if __name__ == "__main__":
    asyncio.run(seed_superadmin())
