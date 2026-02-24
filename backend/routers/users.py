"""
User Management Router
Handles admin operations for user CRUD, role management, and status updates.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timezone
from typing import Optional

from utils.database import db
from utils.auth import get_current_user
from utils.rbac import (
    require_admin, 
    require_superadmin,
    can_modify_user, 
    can_change_role,
    can_view_user,
    sanitize_user_for_admin,
    Roles,
    UserStatus,
    is_admin
)
from models.schemas import UserProfileUpdate, UserRoleUpdate, UserStatusUpdate


router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    role: Optional[str] = Query(None, description="Filter by role"),
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    current_user=Depends(require_admin)
):
    """
    List all users (Admin/SuperAdmin only).
    Supports pagination, filtering, and search.
    """
    # Build query
    query = {}
    
    if role:
        query["role"] = role
    
    if status:
        query["status"] = status
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    # Get total count
    total = await db.users.count_documents(query)
    
    # Get paginated users
    skip = (page - 1) * limit
    users = await db.users.find(
        query, 
        {"_id": 0, "password_hash": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Sanitize users (remove API keys from admin view)
    sanitized_users = [sanitize_user_for_admin(user) for user in users]
    
    return {
        "users": sanitized_users,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/{user_id}")
async def get_user(user_id: str, current_user=Depends(get_current_user)):
    """
    Get user details.
    Users can view their own profile.
    Admins can view any user.
    """
    if not can_view_user(current_user, user_id):
        raise HTTPException(status_code=403, detail="Not authorized to view this user")
    
    user = await db.users.find_one(
        {"user_id": user_id}, 
        {"_id": 0, "password_hash": 0}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # If viewing own profile, return everything (including API key status)
    if current_user["user_id"] == user_id:
        return user
    
    # If admin viewing other user, sanitize (remove API key)
    return sanitize_user_for_admin(user)


@router.put("/{user_id}")
async def update_user_profile(
    user_id: str, 
    updates: UserProfileUpdate,
    current_user=Depends(get_current_user)
):
    """
    Update user profile.
    Users can update their own profile.
    Admins can update any user profile.
    """
    if not can_modify_user(current_user, user_id):
        raise HTTPException(status_code=403, detail="Not authorized to modify this user")
    
    # Check if user exists
    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build update dict (only include fields that were provided)
    update_data = {}
    for field, value in updates.dict(exclude_unset=True).items():
        if value is not None:
            update_data[field] = value
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Add updated_at timestamp
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Update user
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="No changes made")
    
    # Return updated user
    updated_user = await db.users.find_one(
        {"user_id": user_id}, 
        {"_id": 0, "password_hash": 0}
    )
    
    # Sanitize if admin is viewing another user
    if current_user["user_id"] != user_id and is_admin(current_user):
        updated_user = sanitize_user_for_admin(updated_user)
    
    return updated_user


@router.put("/{user_id}/role")
async def update_user_role(
    user_id: str,
    role_update: UserRoleUpdate,
    current_user=Depends(get_current_user)
):
    """
    Update user role (Admin/SuperAdmin only).
    Admins cannot promote users to superadmin.
    Admins cannot modify superadmin accounts.
    """
    # Check if admin has permission
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    # Get target user
    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    target_current_role = target_user.get("role", Roles.USER)
    
    # Check if current user can change to target role
    if not can_change_role(current_user, role_update.role, target_current_role):
        raise HTTPException(
            status_code=403, 
            detail="Not authorized to change role to this level"
        )
    
    # Prevent users from changing their own role
    if current_user["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    
    # Update role
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "role": role_update.role,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Return updated user
    updated_user = await db.users.find_one(
        {"user_id": user_id}, 
        {"_id": 0, "password_hash": 0}
    )
    
    return sanitize_user_for_admin(updated_user)


@router.put("/{user_id}/status")
async def update_user_status(
    user_id: str,
    status_update: UserStatusUpdate,
    current_user=Depends(require_admin)
):
    """
    Update user status (Admin/SuperAdmin only).
    Can suspend or ban users.
    """
    # Get target user
    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent admins from suspending superadmins (only superadmin can do this)
    if target_user.get("role") == Roles.SUPERADMIN and current_user.get("role") != Roles.SUPERADMIN:
        raise HTTPException(
            status_code=403, 
            detail="Only SuperAdmin can change SuperAdmin status"
        )
    
    # Prevent users from changing their own status
    if current_user["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot change your own status")
    
    # Update status
    update_data = {
        "status": status_update.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Add status change reason if provided
    if status_update.reason:
        update_data["status_reason"] = status_update.reason
        update_data["status_changed_at"] = datetime.now(timezone.utc).isoformat()
        update_data["status_changed_by"] = current_user["user_id"]
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    # Return updated user
    updated_user = await db.users.find_one(
        {"user_id": user_id}, 
        {"_id": 0, "password_hash": 0}
    )
    
    return sanitize_user_for_admin(updated_user)


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user=Depends(require_admin)
):
    """
    Delete user (Admin/SuperAdmin only).
    This is a soft delete - we keep the user data but mark as deleted.
    """
    # Get target user
    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent admins from deleting superadmins
    if target_user.get("role") == Roles.SUPERADMIN and current_user.get("role") != Roles.SUPERADMIN:
        raise HTTPException(
            status_code=403, 
            detail="Only SuperAdmin can delete SuperAdmin accounts"
        )
    
    # Prevent users from deleting themselves
    if current_user["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Soft delete: set status to "deleted"
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "status": "deleted",
            "deleted_at": datetime.now(timezone.utc).isoformat(),
            "deleted_by": current_user["user_id"]
        }}
    )
    
    # Also delete all user sessions
    await db.user_sessions.delete_many({"user_id": user_id})
    
    return {"message": "User deleted successfully", "user_id": user_id}


@router.get("/{user_id}/activity")
async def get_user_activity(
    user_id: str,
    limit: int = Query(50, ge=1, le=200),
    current_user=Depends(require_admin)
):
    """
    Get user activity logs (Admin/SuperAdmin only).
    Shows AI tool usage, challenges, answers, etc.
    """
    # Check if user exists
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get AI history
    ai_history = await db.ai_history.find(
        {"user_id": user_id}, 
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Get API usage stats
    api_usage = await db.api_usage.find(
        {"user_id": user_id}, 
        {"_id": 0}
    ).sort("date", -1).limit(30).to_list(30)
    
    # Get challenges created
    challenges_count = await db.challenges.count_documents({"author_id": user_id})
    
    # Get answers created
    answers_count = await db.answers.count_documents({"author_id": user_id})
    
    return {
        "user_id": user_id,
        "user_name": user.get("name"),
        "user_email": user.get("email"),
        "ai_history": ai_history,
        "api_usage": api_usage,
        "challenges_created": challenges_count,
        "answers_created": answers_count,
        "total_points": user.get("points", 0),
        "has_own_api_key": user.get("has_own_api_key", False),
        "account_created": user.get("created_at"),
        "last_login": user.get("last_login_at"),
    }
