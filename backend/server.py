from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM Config
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== PYDANTIC MODELS ====================

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class ChallengeCreate(BaseModel):
    title: str
    description: str
    tags: List[str] = []

class AnswerCreate(BaseModel):
    content: str

class AIToolRequest(BaseModel):
    tool_type: str
    prompt: str
    context: Optional[str] = ""

# ==================== HELPERS ====================

def get_badge(points):
    if points >= 500:
        return "Diamond"
    if points >= 200:
        return "Gold"
    if points >= 100:
        return "Silver"
    return "Bronze"

async def get_current_user(request: Request):
    # Check cookie first, then Authorization header
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    # Timezone-aware expiry check
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Normalize created_at to string
    if "created_at" in user and isinstance(user["created_at"], datetime):
        user["created_at"] = user["created_at"].isoformat()
    user["badge"] = get_badge(user.get("points", 0))
    return user

async def add_points(user_id: str, points: int):
    await db.users.update_one({"user_id": user_id}, {"$inc": {"points": points}})

def make_session_token():
    return f"session_{uuid.uuid4().hex}"

def make_user_id():
    return f"user_{uuid.uuid4().hex[:12]}"

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
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
        "created_at": now.isoformat(),
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

@api_router.post("/auth/login")
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

    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="lax", path="/", max_age=7*24*60*60)
    return {
        "user_id": existing["user_id"],
        "name": existing["name"],
        "email": existing["email"],
        "points": existing.get("points", 0),
        "badge": get_badge(existing.get("points", 0)),
        "picture": existing.get("picture"),
    }

@api_router.get("/auth/session")
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

    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="lax", path="/", max_age=7*24*60*60)

    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if "created_at" in user and isinstance(user["created_at"], datetime):
        user["created_at"] = user["created_at"].isoformat()
    user["badge"] = get_badge(user.get("points", 0))
    return user

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return user

@api_router.post("/auth/logout")
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

# ==================== CHALLENGES ROUTES ====================

@api_router.get("/challenges")
async def get_challenges(user=Depends(get_current_user)):
    challenges = await db.challenges.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for c in challenges:
        author = await db.users.find_one(
            {"user_id": c.get("author_id")},
            {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "points": 1},
        )
        if author:
            author["badge"] = get_badge(author.get("points", 0))
        c["author"] = author or {"name": "Unknown", "picture": None, "badge": "Bronze"}
        c["answers_count"] = await db.answers.count_documents({"challenge_id": c["challenge_id"]})
    return challenges

@api_router.post("/challenges")
async def create_challenge(challenge: ChallengeCreate, user=Depends(get_current_user)):
    doc = {
        "challenge_id": f"ch_{uuid.uuid4().hex[:12]}",
        "title": challenge.title,
        "description": challenge.description,
        "tags": challenge.tags,
        "author_id": user["user_id"],
        "upvotes": 0,
        "upvoted_by": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.challenges.insert_one(doc)
    await add_points(user["user_id"], 5)
    doc.pop("_id", None)
    return doc

@api_router.get("/challenges/{challenge_id}")
async def get_challenge(challenge_id: str, user=Depends(get_current_user)):
    challenge = await db.challenges.find_one({"challenge_id": challenge_id}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    author = await db.users.find_one(
        {"user_id": challenge.get("author_id")},
        {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "points": 1},
    )
    if author:
        author["badge"] = get_badge(author.get("points", 0))
    challenge["author"] = author or {"name": "Unknown", "picture": None, "badge": "Bronze"}

    answers = await db.answers.find({"challenge_id": challenge_id}, {"_id": 0}).sort("upvotes", -1).to_list(100)
    for a in answers:
        ans_author = await db.users.find_one(
            {"user_id": a.get("author_id")},
            {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "points": 1},
        )
        if ans_author:
            ans_author["badge"] = get_badge(ans_author.get("points", 0))
        a["author"] = ans_author or {"name": "Unknown", "picture": None, "badge": "Bronze"}
    challenge["answers"] = answers
    return challenge

@api_router.post("/challenges/{challenge_id}/answers")
async def create_answer(challenge_id: str, answer: AnswerCreate, user=Depends(get_current_user)):
    challenge = await db.challenges.find_one({"challenge_id": challenge_id}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    doc = {
        "answer_id": f"ans_{uuid.uuid4().hex[:12]}",
        "challenge_id": challenge_id,
        "content": answer.content,
        "author_id": user["user_id"],
        "upvotes": 0,
        "upvoted_by": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.answers.insert_one(doc)
    await add_points(user["user_id"], 10)
    doc.pop("_id", None)
    return doc

@api_router.post("/challenges/{challenge_id}/upvote")
async def upvote_challenge(challenge_id: str, user=Depends(get_current_user)):
    challenge = await db.challenges.find_one({"challenge_id": challenge_id}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    if user["user_id"] in challenge.get("upvoted_by", []):
        await db.challenges.update_one(
            {"challenge_id": challenge_id},
            {"$pull": {"upvoted_by": user["user_id"]}, "$inc": {"upvotes": -1}},
        )
        await add_points(challenge["author_id"], -3)
        return {"upvoted": False}

    await db.challenges.update_one(
        {"challenge_id": challenge_id},
        {"$push": {"upvoted_by": user["user_id"]}, "$inc": {"upvotes": 1}},
    )
    await add_points(challenge["author_id"], 3)
    return {"upvoted": True}

@api_router.post("/answers/{answer_id}/upvote")
async def upvote_answer(answer_id: str, user=Depends(get_current_user)):
    answer = await db.answers.find_one({"answer_id": answer_id}, {"_id": 0})
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")

    if user["user_id"] in answer.get("upvoted_by", []):
        await db.answers.update_one(
            {"answer_id": answer_id},
            {"$pull": {"upvoted_by": user["user_id"]}, "$inc": {"upvotes": -1}},
        )
        await add_points(answer["author_id"], -3)
        return {"upvoted": False}

    await db.answers.update_one(
        {"answer_id": answer_id},
        {"$push": {"upvoted_by": user["user_id"]}, "$inc": {"upvotes": 1}},
    )
    await add_points(answer["author_id"], 3)
    return {"upvoted": True}

# ==================== AI TOOLS ROUTES ====================

TOOL_PROMPTS = {
    "jd-builder": "You are an expert recruiter. Generate a professional, detailed Job Description based on the user's input. Include: Role Title, Company Overview (if provided), Role Summary, Key Responsibilities, Required Qualifications, Preferred Qualifications, Compensation Range guidance, and Why Join section. Format it cleanly with headers.",
    "search-strategy": "You are a senior executive search strategist. Create a comprehensive Search Strategy for finding the ideal candidate. Include: Target Profile, Industry Mapping, Geographic Scope, Channel Strategy (LinkedIn, networks, databases), Boolean Search Strings, Competitor Companies to Target, Timeline, and KPIs for the search.",
    "candidate-research": "You are a talent intelligence analyst. Research and provide detailed insights about the candidate or candidate profile described. Include: Background Analysis, Career Trajectory, Key Achievements, Leadership Style indicators, Cultural Fit Assessment, Potential Red Flags, and Interview Focus Areas.",
    "dossier": "You are a senior executive recruiter preparing a candidate presentation for a client. Create a professional Candidate Dossier that includes: Executive Summary, Career Overview, Key Accomplishments with metrics, Leadership Competencies, Education & Certifications, Compensation Expectations, Availability, and Recommendation Summary.",
    "client-research": "You are a business development researcher for an executive search firm. Research the potential client company described. Include: Company Overview, Leadership Team, Recent News & Developments, Growth Trajectory, Culture & Values, Likely Hiring Needs, Key Decision Makers, and Approach Strategy.",
}

@api_router.post("/ai/generate")
async def ai_generate(req: AIToolRequest, user=Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    system_prompt = TOOL_PROMPTS.get(req.tool_type, "You are a helpful recruiting AI assistant.")

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"ai_{user['user_id']}_{uuid.uuid4().hex[:8]}",
        system_message=system_prompt,
    ).with_model("openai", "gpt-5.2")

    full_prompt = req.prompt
    if req.context:
        full_prompt = f"{req.prompt}\n\nAdditional Context: {req.context}"

    response = await chat.send_message(UserMessage(text=full_prompt))

    await db.ai_history.insert_one({
        "history_id": f"hist_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "tool_type": req.tool_type,
        "prompt": req.prompt,
        "response": response,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    await add_points(user["user_id"], 2)
    return {"response": response, "tool_type": req.tool_type}

@api_router.get("/ai/history")
async def get_ai_history(user=Depends(get_current_user)):
    history = await db.ai_history.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return history

# ==================== DASHBOARD & LEADERBOARD & PROFILE ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user=Depends(get_current_user)):
    total_members = await db.users.count_documents({})
    total_challenges = await db.challenges.count_documents({})
    total_answers = await db.answers.count_documents({})

    recent_challenges = await db.challenges.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
    for c in recent_challenges:
        author = await db.users.find_one(
            {"user_id": c.get("author_id")},
            {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "points": 1},
        )
        if author:
            author["badge"] = get_badge(author.get("points", 0))
        c["author"] = author or {"name": "Unknown", "picture": None, "badge": "Bronze"}

    user_rank_list = await db.users.find({}, {"_id": 0, "user_id": 1, "points": 1}).sort("points", -1).to_list(1000)
    user_rank = next((i + 1 for i, u in enumerate(user_rank_list) if u["user_id"] == user["user_id"]), 0)

    # Last AI tool used by this user
    last_ai_list = await db.ai_history.find(
        {"user_id": user["user_id"]},
        {"_id": 0, "tool_type": 1, "prompt": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(1)
    last_ai_tool = last_ai_list[0] if last_ai_list else None

    # Last challenge interacted with (posted or answered) — pick most recent
    last_posted_list = await db.challenges.find(
        {"author_id": user["user_id"]},
        {"_id": 0, "challenge_id": 1, "title": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(1)

    last_answered_list = await db.answers.find(
        {"author_id": user["user_id"]},
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

    # Activity feed — recent community events (challenges + answers from all users)
    feed_challenges = await db.challenges.find(
        {}, {"_id": 0, "challenge_id": 1, "title": 1, "author_id": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(8)

    feed_answers = await db.answers.find(
        {}, {"_id": 0, "answer_id": 1, "challenge_id": 1, "author_id": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(8)

    activity_feed = []
    for ch in feed_challenges:
        author = await db.users.find_one(
            {"user_id": ch["author_id"]},
            {"_id": 0, "name": 1, "picture": 1, "points": 1}
        )
        if author:
            author["badge"] = get_badge(author.get("points", 0))
        activity_feed.append({
            "type": "challenge",
            "challenge_id": ch["challenge_id"],
            "title": ch["title"],
            "author": author or {"name": "Unknown", "picture": None},
            "created_at": ch["created_at"],
        })
    for ans in feed_answers:
        author = await db.users.find_one(
            {"user_id": ans["author_id"]},
            {"_id": 0, "name": 1, "picture": 1, "points": 1}
        )
        if author:
            author["badge"] = get_badge(author.get("points", 0))
        challenge_doc = await db.challenges.find_one(
            {"challenge_id": ans["challenge_id"]},
            {"_id": 0, "title": 1, "challenge_id": 1}
        )
        activity_feed.append({
            "type": "answer",
            "challenge_id": ans["challenge_id"],
            "challenge_title": challenge_doc["title"] if challenge_doc else "a challenge",
            "author": author or {"name": "Unknown", "picture": None},
            "created_at": ans["created_at"],
        })

    activity_feed.sort(key=lambda x: x["created_at"], reverse=True)
    activity_feed = activity_feed[:10]

    return {
        "total_members": total_members,
        "total_challenges": total_challenges,
        "total_answers": total_answers,
        "user_points": user.get("points", 0),
        "user_badge": get_badge(user.get("points", 0)),
        "user_rank": user_rank,
        "recent_challenges": recent_challenges,
        "last_ai_tool": last_ai_tool,
        "last_challenge": last_challenge,
        "activity_feed": activity_feed,
    }

@api_router.get("/leaderboard")
async def get_leaderboard(user=Depends(get_current_user)):
    users = await db.users.find(
        {}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "points": 1}
    ).sort("points", -1).to_list(50)
    for i, u in enumerate(users):
        u["rank"] = i + 1
        u["badge"] = get_badge(u.get("points", 0))
    return users

@api_router.get("/profile/stats")
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

# ==================== WIRE UP ====================

app.include_router(api_router)

# CORS: Must reflect actual origin (not "*") when credentials are used.
from starlette.types import ASGIApp, Receive, Scope, Send

class CORSOriginReflectMiddleware:
    """Wraps the app and rewrites 'access-control-allow-origin: *' to the actual request origin."""
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Extract Origin header from request
        request_origin = None
        for header_name, header_value in scope.get("headers", []):
            if header_name == b"origin":
                request_origin = header_value.decode("latin-1")
                break

        async def send_wrapper(message):
            if message["type"] == "http.response.start" and request_origin:
                headers = list(message.get("headers", []))
                new_headers = []
                for name, value in headers:
                    if name == b"access-control-allow-origin" and value == b"*":
                        new_headers.append((name, request_origin.encode("latin-1")))
                    else:
                        new_headers.append((name, value))
                message["headers"] = new_headers
            await send(message)

        await self.app(scope, receive, send_wrapper)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["set-cookie"],
)
# This wraps CORSMiddleware — runs AFTER CORS sets headers, rewrites "*" to actual origin
app.add_middleware(CORSOriginReflectMiddleware)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
