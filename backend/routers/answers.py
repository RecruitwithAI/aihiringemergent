from fastapi import APIRouter, Depends, HTTPException
from utils.database import db
from utils.helpers import get_badge
from utils.auth import get_current_user, add_points


router = APIRouter(prefix="/answers", tags=["answers"])


@router.post("/{answer_id}/upvote")
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
