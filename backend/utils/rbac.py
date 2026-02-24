"""
Role-Based Access Control (RBAC) utilities for user authorization.

Roles:
- superadmin: Full system access (all features + codebase)
- admin: User management and database access (no codebase)
- user: Standard access (own data only)
"""

from fastapi import HTTPException, Depends
from typing import List, Optional
from functools import wraps

from utils.auth import get_current_user


class Roles:
    """Role constants"""
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    USER = "user"
    
    @classmethod
    def all(cls) -> List[str]:
        return [cls.SUPERADMIN, cls.ADMIN, cls.USER]
    
    @classmethod
    def admin_roles(cls) -> List[str]:
        """Roles with admin privileges"""
        return [cls.SUPERADMIN, cls.ADMIN]


class UserStatus:
    """User status constants"""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    BANNED = "banned"
    
    @classmethod
    def all(cls) -> List[str]:
        return [cls.ACTIVE, cls.SUSPENDED, cls.BANNED]


def require_role(allowed_roles: List[str]):
    """
    Decorator to require specific roles for endpoint access.
    
    Usage:
        @router.get("/admin/users")
        @require_role([Roles.SUPERADMIN, Roles.ADMIN])
        async def list_users(current_user=Depends(get_current_user)):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user=None, **kwargs):
            if current_user is None:
                # Try to extract from kwargs (FastAPI injects it)
                current_user = kwargs.get('user') or kwargs.get('current_user')
            
            if not current_user:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            user_role = current_user.get("role", Roles.USER)
            
            # Check if user is active
            user_status = current_user.get("status", UserStatus.ACTIVE)
            if user_status != UserStatus.ACTIVE:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Account is {user_status}. Please contact support."
                )
            
            # Check role permission
            if user_role not in allowed_roles:
                raise HTTPException(
                    status_code=403,
                    detail=f"This action requires one of the following roles: {', '.join(allowed_roles)}"
                )
            
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator


def is_admin(user: dict) -> bool:
    """Check if user has admin privileges (admin or superadmin)"""
    role = user.get("role", Roles.USER)
    return role in Roles.admin_roles()


def is_superadmin(user: dict) -> bool:
    """Check if user is a superadmin"""
    return user.get("role") == Roles.SUPERADMIN


def check_user_active(user: dict) -> bool:
    """Check if user account is active"""
    return user.get("status", UserStatus.ACTIVE) == UserStatus.ACTIVE


def can_modify_user(current_user: dict, target_user_id: str) -> bool:
    """
    Check if current user can modify target user.
    
    Rules:
    - Users can modify their own profile
    - Admins can modify any user (except role changes to superadmin)
    - SuperAdmins can modify anyone
    """
    if current_user.get("user_id") == target_user_id:
        return True
    
    return is_admin(current_user)


def can_change_role(current_user: dict, target_role: str, target_current_role: Optional[str] = None) -> bool:
    """
    Check if current user can change someone's role to target_role.
    
    Rules:
    - SuperAdmin can change anyone to any role
    - Admin can change users to user/admin, but NOT to superadmin
    - Admin cannot demote or modify superadmin accounts
    - Regular users cannot change roles
    """
    current_role = current_user.get("role", Roles.USER)
    
    # Regular users cannot change roles
    if current_role == Roles.USER:
        return False
    
    # SuperAdmin can do anything
    if current_role == Roles.SUPERADMIN:
        return True
    
    # Admin restrictions
    if current_role == Roles.ADMIN:
        # Cannot promote to superadmin
        if target_role == Roles.SUPERADMIN:
            return False
        
        # Cannot modify existing superadmin accounts
        if target_current_role == Roles.SUPERADMIN:
            return False
        
        return True
    
    return False


def can_view_user(current_user: dict, target_user_id: str) -> bool:
    """
    Check if current user can view target user's profile.
    
    Rules:
    - Users can view their own profile
    - Admins can view any user
    - SuperAdmins can view anyone
    """
    if current_user.get("user_id") == target_user_id:
        return True
    
    return is_admin(current_user)


def sanitize_user_for_admin(user: dict) -> dict:
    """
    Remove sensitive fields from user object for admin view.
    Admins should NOT see API keys.
    """
    user_copy = user.copy()
    
    # Remove API key (only user can see their own key)
    user_copy.pop("openai_api_key", None)
    
    # Keep has_own_api_key flag (admins can see if user has a key, but not the key itself)
    # Keep all other fields
    
    return user_copy


def sanitize_user_for_public(user: dict) -> dict:
    """
    Remove sensitive fields for public/limited view.
    Used when showing user info in challenges, leaderboards, etc.
    """
    return {
        "user_id": user.get("user_id"),
        "name": user.get("name"),
        "picture": user.get("picture"),
        "badge": user.get("badge"),
        "points": user.get("points"),
        "title": user.get("title"),
        "company": user.get("company"),
        "city": user.get("city"),
        "country": user.get("country"),
    }


# Dependency for FastAPI routes that require admin access
async def require_admin(user=Depends(get_current_user)):
    """FastAPI dependency to require admin role"""
    if not is_admin(user):
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required"
        )
    
    if not check_user_active(user):
        raise HTTPException(
            status_code=403,
            detail=f"Account is {user.get('status')}. Please contact support."
        )
    
    return user


# Dependency for FastAPI routes that require superadmin access
async def require_superadmin(user=Depends(get_current_user)):
    """FastAPI dependency to require superadmin role"""
    if not is_superadmin(user):
        raise HTTPException(
            status_code=403,
            detail="SuperAdmin privileges required"
        )
    
    if not check_user_active(user):
        raise HTTPException(
            status_code=403,
            detail=f"Account is {user.get('status')}. Please contact support."
        )
    
    return user
