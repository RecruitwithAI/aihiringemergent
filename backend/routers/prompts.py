"""
SuperAdmin System Prompt Management for AI tools.

All endpoints require superadmin. Live prompts come from the `tool_prompts`
collection; routers/ai_tools.py reads the ACTIVE prompt per tool at request time.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from utils.database import db
from utils.rbac import require_superadmin
from utils.default_prompts import TOOL_PROMPTS, TOOL_LABELS
from utils.prompt_store import (
    make_prompt_doc, next_version, activate_prompt_doc, _now,
)

router = APIRouter(prefix="/admin/prompts", tags=["prompt-management"])

HISTORY_LIMIT = 20  # old versions returned per tool


class PromptCreate(BaseModel):
    system_prompt: str = Field(..., min_length=10, description="The system prompt text")
    status: str = Field("draft", description='"draft" or "active"')


class PromptUpdate(BaseModel):
    system_prompt: str = Field(..., min_length=10)


def _validate_tool(tool_id: str):
    if tool_id not in TOOL_PROMPTS:
        raise HTTPException(status_code=404, detail=f"Unknown tool: {tool_id}")


@router.get("")
async def list_prompts(current_user=Depends(require_superadmin)):
    """All tools grouped: active prompt + drafts + recent old versions."""
    docs = await db.tool_prompts.find({}, {"_id": 0}).sort([("tool_id", 1), ("version", -1)]).to_list(1000)

    grouped = {}
    for tool_id in TOOL_PROMPTS:
        grouped[tool_id] = {
            "tool_id": tool_id,
            "label": TOOL_LABELS.get(tool_id, tool_id),
            "default_prompt": TOOL_PROMPTS[tool_id],
            "active": None,
            "drafts": [],
            "history": [],
        }
    for d in docs:
        g = grouped.get(d["tool_id"])
        if not g:
            continue  # prompt for a removed tool
        if d["status"] == "active":
            g["active"] = d
        elif d["status"] == "draft":
            g["drafts"].append(d)
        elif len(g["history"]) < HISTORY_LIMIT:
            g["history"].append(d)

    return {"tools": list(grouped.values())}


@router.post("/{tool_id}")
async def create_prompt_version(tool_id: str, body: PromptCreate, current_user=Depends(require_superadmin)):
    """Create a new prompt version for a tool, as draft or directly activated."""
    _validate_tool(tool_id)
    if body.status not in ("draft", "active"):
        raise HTTPException(status_code=400, detail='status must be "draft" or "active"')

    doc = make_prompt_doc(
        tool_id, body.system_prompt.strip(), "draft",
        await next_version(tool_id), current_user.get("name", "superadmin"),
    )
    await db.tool_prompts.insert_one(doc)
    doc.pop("_id", None)

    if body.status == "active":
        doc = await activate_prompt_doc(doc["prompt_id"], current_user.get("name", "superadmin"))
    return doc


@router.put("/{prompt_id}")
async def update_draft(prompt_id: str, body: PromptUpdate, current_user=Depends(require_superadmin)):
    """Edit the text of a DRAFT prompt (active/old versions are immutable)."""
    doc = await db.tool_prompts.find_one({"prompt_id": prompt_id}, {"_id": 0, "status": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Prompt not found")
    if doc["status"] != "draft":
        raise HTTPException(status_code=400, detail="Only draft prompts can be edited. Create a new version instead.")

    await db.tool_prompts.update_one(
        {"prompt_id": prompt_id},
        {"$set": {
            "system_prompt": body.system_prompt.strip(),
            "updated_by": current_user.get("name", "superadmin"),
            "updated_at": _now(),
        }},
    )
    return await db.tool_prompts.find_one({"prompt_id": prompt_id}, {"_id": 0})


@router.post("/{prompt_id}/activate")
async def activate_prompt(prompt_id: str, current_user=Depends(require_superadmin)):
    """Activate a draft or restore an old version. Current active becomes 'old'."""
    doc = await activate_prompt_doc(prompt_id, current_user.get("name", "superadmin"))
    if not doc:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return doc


@router.delete("/{prompt_id}")
async def delete_draft(prompt_id: str, current_user=Depends(require_superadmin)):
    """Delete a DRAFT prompt. Active and old versions are kept for audit."""
    doc = await db.tool_prompts.find_one({"prompt_id": prompt_id}, {"_id": 0, "status": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Prompt not found")
    if doc["status"] != "draft":
        raise HTTPException(status_code=400, detail="Only draft prompts can be deleted")
    await db.tool_prompts.delete_one({"prompt_id": prompt_id})
    return {"deleted": True, "prompt_id": prompt_id}


@router.post("/{tool_id}/reset")
async def reset_to_default(tool_id: str, current_user=Depends(require_superadmin)):
    """Create + activate a new version containing the original default prompt."""
    _validate_tool(tool_id)
    doc = make_prompt_doc(
        tool_id, TOOL_PROMPTS[tool_id], "draft",
        await next_version(tool_id), current_user.get("name", "superadmin"),
    )
    await db.tool_prompts.insert_one(doc)
    return await activate_prompt_doc(doc["prompt_id"], current_user.get("name", "superadmin"))
