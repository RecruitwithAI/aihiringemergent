from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid

from utils.database import db
from utils.helpers import get_badge
from utils.auth import get_current_user, add_points
from models.schemas import ChallengeCreate, AnswerCreate


router = APIRouter(prefix="/challenges", tags=["challenges"])


@router.get("")
async def get_challenges(user=Depends(get_current_user), search: str = "", tags: str = "", category: str = ""):
    # Build query filter
    query = {}
    
    # Search in title and description
    if search.strip():
        query["$or"] = [
            {"title": {"$regex": search.strip(), "$options": "i"}},
            {"description": {"$regex": search.strip(), "$options": "i"}},
        ]
    
    # Filter by tags (comma-separated)
    if tags.strip():
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        if tag_list:
            query["tags"] = {"$in": tag_list}
    
    # Filter by category
    if category.strip():
        query["category"] = category.strip()
    
    # Fetch challenges and sort: pinned first (by pin_order), then by date
    challenges = await db.challenges.find(query, {"_id": 0}).to_list(100)
    
    # Sort: pinned challenges first (by pin_order), then by created_at
    challenges.sort(
        key=lambda c: (
            not c.get("pinned", False),  # False (not pinned) comes after True (pinned)
            -c.get("pin_order", 0) if c.get("pinned", False) else 0,  # Higher pin_order first
            -int(datetime.fromisoformat(c["created_at"]).timestamp())  # Newer first
        )
    )
    
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


@router.post("")
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


@router.get("/{challenge_id}")
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


@router.post("/{challenge_id}/answers")
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


@router.post("/{challenge_id}/upvote")
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
