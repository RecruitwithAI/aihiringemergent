from fastapi import APIRouter, Response, Request, Depends, HTTPException
from datetime import datetime, timezone, timedelta
import httpx
import bcrypt

from utils.database import db
from utils.helpers import get_badge, make_session_token, make_user_id
from utils.auth import get_current_user
from models.schemas import UserCreate, UserLogin


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(user: UserCreate, response: Response):
    existing = await db.users.find_one({"email": user.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    user_id = make_user_id()
    now = datetime.now(timezone.utc)

    await db.users.insert_one({
        "user_id": user_id,
        "name": user.name,
        "email": user.email,
        "password_hash": hashed,
        "picture": None,
        "points": 0,
        
        # New profile fields
        "linkedin_url": user.linkedin_url,
        "title": user.title,
        "company": user.company,
        "phone_number": user.phone_number,
        "city": user.city,
        "country": user.country,
        "about_me": user.about_me,
        "help_topics": user.help_topics or [],
        
        # Role and status (with defaults)
        "role": "user",  # Default role for new users
        "status": "active",  # Default status
        
        # Timestamps
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "last_login_at": now.isoformat(),
    })

    session_token = make_session_token()
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (now + timedelta(days=7)).isoformat(),
        "created_at": now.isoformat(),
    })

    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60)
    return {"user_id": user_id, "name": user.name, "email": user.email, "points": 0, "badge": "Bronze", "picture": None}


@router.post("/login")
async def login(user: UserLogin, response: Response):
    existing = await db.users.find_one({"email": user.email}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not existing.get("password_hash"):
        raise HTTPException(status_code=401, detail="Please use Google login for this account")
    if not bcrypt.checkpw(user.password.encode(), existing["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    now = datetime.now(timezone.utc)
    session_token = make_session_token()
    await db.user_sessions.insert_one({
        "user_id": existing["user_id"],
        "session_token": session_token,
        "expires_at": (now + timedelta(days=7)).isoformat(),
        "created_at": now.isoformat(),
    })

    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60)
    return {
        "user_id": existing["user_id"],
        "name": existing["name"],
        "email": existing["email"],
        "points": existing.get("points", 0),
        "badge": get_badge(existing.get("points", 0)),
        "picture": existing.get("picture"),
    }


@router.get("/session")
async def exchange_session(session_id: str, response: Response):
    """Exchange a Google OAuth session_id for our own session cookie."""
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google session")

    data = resp.json()
    email = data["email"]
    name = data.get("name", "")
    picture = data.get("picture", "")

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": name, "picture": picture}})
    else:
        user_id = make_user_id()
        await db.users.insert_one({
            "user_id": user_id,
            "name": name,
            "email": email,
            "picture": picture,
            "points": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    now = datetime.now(timezone.utc)
    session_token = make_session_token()
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (now + timedelta(days=7)).isoformat(),
        "created_at": now.isoformat(),
    })

    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60)

    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if "created_at" in user and isinstance(user["created_at"], datetime):
        user["created_at"] = user["created_at"].isoformat()
    user["badge"] = get_badge(user.get("points", 0))
    return user


@router.get("/me")
async def get_me(user=Depends(get_current_user)):
    return user


@router.post("/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}
