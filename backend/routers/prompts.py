"""
SuperAdmin-only CRUD endpoints for managing AI tool system prompts.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from utils.database import db
from utils.auth import get_current_user
from utils.rbac import require_superadmin
from utils.prompts import DEFAULT_PROMPTS, get_all_prompts, get_default_prompt

router = APIRouter(prefix="/prompts", tags=["prompts"])


class PromptUpdate(BaseModel):
    system_prompt: str
    description: Optional[str] = None


# ── Public (authenticated) — list active tool names ──

@router.get("/tools")
async def list_tool_names(user=Depends(get_current_user)):
    """Return minimal list of active tools (for dropdowns etc.)."""
    docs = await db.system_prompts.find(
        {"is_active": True},
        {"_id": 0, "tool_type": 1, "tool_name": 1, "description": 1},
    ).sort("tool_name", 1).to_list(100)
    return docs


# ── SuperAdmin — full CRUD ──

@router.get("")
async def list_prompts(user=Depends(require_superadmin)):
    """List all system prompts with full detail."""
    prompts = await get_all_prompts()
    return prompts


@router.get("/{tool_type}")
async def get_prompt_detail(tool_type: str, user=Depends(require_superadmin)):
    """Get a single prompt's full detail including the default for comparison."""
    doc = await db.system_prompts.find_one({"tool_type": tool_type}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Prompt not found")

    default_text = await get_default_prompt(tool_type)
    doc["default_prompt"] = default_text
    return doc


@router.put("/{tool_type}")
async def update_prompt(tool_type: str, body: PromptUpdate, user=Depends(require_superadmin)):
    """Update a system prompt (SuperAdmin only)."""
    existing = await db.system_prompts.find_one({"tool_type": tool_type})
    if not existing:
        raise HTTPException(status_code=404, detail="Prompt not found")

    update_fields = {
        "system_prompt": body.system_prompt,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": user["user_id"],
        "version": existing.get("version", 1) + 1,
    }
    if body.description is not None:
        update_fields["description"] = body.description

    await db.system_prompts.update_one(
        {"tool_type": tool_type},
        {"$set": update_fields},
    )
    return {"success": True, "message": "Prompt updated", "version": update_fields["version"]}


@router.post("/{tool_type}/reset")
async def reset_prompt(tool_type: str, user=Depends(require_superadmin)):
    """Reset a prompt back to the built-in default."""
    default = DEFAULT_PROMPTS.get(tool_type)
    if not default:
        raise HTTPException(status_code=404, detail="No default exists for this tool type")

    existing = await db.system_prompts.find_one({"tool_type": tool_type})
    version = (existing.get("version", 1) + 1) if existing else 1

    await db.system_prompts.update_one(
        {"tool_type": tool_type},
        {"$set": {
            "system_prompt": default["system_prompt"],
            "description": default["description"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": user["user_id"],
            "version": version,
        }},
        upsert=True,
    )
    return {"success": True, "message": "Prompt reset to default", "version": version}
