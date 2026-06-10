from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid

from utils.database import db
from utils.helpers import AUTHOR_LOOKUP, finalize_author
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
    
    # Single aggregation: challenges + author + answer count (replaces N+1 queries)
    pipeline = [
        {"$match": query},
        {"$sort": {"created_at": -1}},
        {"$limit": 100},
        AUTHOR_LOOKUP,
        {"$lookup": {
            "from": "answers",
            "localField": "challenge_id",
            "foreignField": "challenge_id",
            "as": "_answer_counts",
            "pipeline": [{"$count": "n"}],
        }},
        {"$addFields": {
            "answers_count": {"$ifNull": [{"$first": "$_answer_counts.n"}, 0]},
        }},
        {"$project": {"_id": 0, "_answer_counts": 0}},
    ]
    challenges = await db.challenges.aggregate(pipeline).to_list(100)
    for c in challenges:
        finalize_author(c)
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
    # Challenge + author in one aggregation
    challenge_list = await db.challenges.aggregate([
        {"$match": {"challenge_id": challenge_id}},
        {"$limit": 1},
        AUTHOR_LOOKUP,
        {"$project": {"_id": 0}},
    ]).to_list(1)
    if not challenge_list:
        raise HTTPException(status_code=404, detail="Challenge not found")
    challenge = finalize_author(challenge_list[0])

    # All answers + their authors in one aggregation (replaces per-answer lookups)
    answers = await db.answers.aggregate([
        {"$match": {"challenge_id": challenge_id}},
        {"$sort": {"upvotes": -1}},
        {"$limit": 100},
        AUTHOR_LOOKUP,
        {"$project": {"_id": 0}},
    ]).to_list(100)
    for a in answers:
        finalize_author(a)
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

