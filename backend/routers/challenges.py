from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid

from utils.database import db
from utils.helpers import get_badge
from utils.auth import get_current_user, add_points
from models.schemas import ChallengeCreate, AnswerCreate


router = APIRouter(prefix="/challenges", tags=["challenges"])


@router.get("")
async def get_challenges(user=Depends(get_current_user), search: str = "", tags: str = ""):
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
    
    challenges = await db.challenges.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
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



@router.post("/{challenge_id}/pin")
async def pin_challenge(challenge_id: str, req: PinChallengeRequest, user=Depends(get_current_user)):
    """
    Pin or unpin a challenge (Admin only).
    Max 5 pinned challenges allowed.
    """
    # Check if user is admin
    if user.get("role") not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    challenge = await db.challenges.find_one({"challenge_id": challenge_id}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    if req.pinned:
        # Check current pinned count
        pinned_count = await db.challenges.count_documents({"pinned": True})
        if pinned_count >= 5 and not challenge.get("pinned", False):
            raise HTTPException(status_code=400, detail="Maximum 5 challenges can be pinned at once")
        
        # Pin the challenge
        await db.challenges.update_one(
            {"challenge_id": challenge_id},
            {"$set": {"pinned": True, "pin_order": req.pin_order or 0}}
        )
        return {"pinned": True, "message": "Challenge pinned successfully"}
    else:
        # Unpin the challenge
        await db.challenges.update_one(
            {"challenge_id": challenge_id},
            {"$set": {"pinned": False, "pin_order": 0}}
        )
        return {"pinned": False, "message": "Challenge unpinned successfully"}

    return {"upvoted": True}
