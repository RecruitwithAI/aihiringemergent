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




@router.get("/admin/architecture-docs")
async def get_architecture_docs(current_user=Depends(require_superadmin)):
    """
    Get comprehensive system architecture documentation.
    SuperAdmin only.
    """
    
    docs = {
        "title": "Bestpl.ai - System Architecture Documentation",
        "version": "1.0.0",
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "accessed_by": current_user.get("name"),
        
        "overview": {
            "application": "Bestpl.ai - AI-Powered Executive Search & Recruiting Platform",
            "architecture_type": "Full-Stack SPA (Single Page Application)",
            "pattern": "REST API + Client-Side Rendering",
            "environment": "Kubernetes Cluster (Emergent Platform)"
        },
        
        "tech_stack": {
            "frontend": {
                "framework": "React 18.2.0",
                "routing": "React Router v6",
                "styling": "Tailwind CSS 3.x",
                "ui_components": "shadcn/ui (Radix UI)",
                "icons": "Lucide React",
                "http_client": "Axios",
                "notifications": "Sonner (toast)",
                "package_manager": "Yarn"
            },
            "backend": {
                "framework": "FastAPI 0.104+",
                "language": "Python 3.11+",
                "async_runtime": "asyncio + uvicorn",
                "database_driver": "Motor (async MongoDB)",
                "validation": "Pydantic v2",
                "authentication": "bcrypt + httpOnly cookies",
                "process_manager": "Supervisor"
            },
            "database": {
                "database": "MongoDB (async)",
                "driver": "Motor",
                "indexes": "8 performance indexes"
            },
            "external_integrations": {
                "ai": "OpenAI GPT-5.2 (via Emergent LLM Key)",
                "auth": "Emergent-managed Google OAuth",
                "file_processing": ["pypdfium2", "python-docx", "fpdf2"],
                "audio": "OpenAI Whisper (emergentintegrations)"
            }
        },
        
        "architecture": {
            "layers": [
                {
                    "name": "Frontend Layer",
                    "port": 3000,
                    "technology": "React + Tailwind CSS",
                    "hot_reload": True,
                    "responsibilities": ["UI Rendering", "Client-side routing", "State management", "API calls"]
                },
                {
                    "name": "API Layer",
                    "port": 8001,
                    "technology": "FastAPI",
                    "hot_reload": True,
                    "responsibilities": ["Business logic", "Authentication", "Authorization", "Data validation", "AI integration"]
                },
                {
                    "name": "Data Layer",
                    "technology": "MongoDB",
                    "responsibilities": ["Data persistence", "Indexing", "Aggregations"]
                }
            ],
            "communication": {
                "frontend_to_backend": "HTTPS REST API",
                "authentication": "Cookie-based sessions (httpOnly)",
                "api_prefix": "/api"
            }
        },
        
        "database_schema": {
            "collections": {
                "users": {
                    "description": "User accounts and profiles",
                    "key_fields": [
                        "user_id (String, unique)",
                        "email (String, unique, indexed)",
                        "name (String)",
                        "password_hash (String | null)",
                        "picture (String | null)",
                        "linkedin_url (String | null) - NEW",
                        "title (String | null) - NEW",
                        "company (String | null) - NEW",
                        "phone_number (String | null) - NEW",
                        "city (String | null) - NEW",
                        "country (String | null) - NEW",
                        "about_me (String | null) - NEW",
                        "help_topics (Array<String>) - NEW",
                        "role (String: superadmin|admin|user, indexed) - NEW",
                        "status (String: active|suspended|banned, indexed) - NEW",
                        "openai_api_key (String | null) - PRIVATE",
                        "has_own_api_key (Boolean)",
                        "points (Number)",
                        "created_at (ISO DateTime, indexed)",
                        "updated_at (ISO DateTime) - NEW",
                        "last_login_at (ISO DateTime) - NEW"
                    ],
                    "indexes": ["email (unique)", "role", "status", "created_at (desc)"],
                    "total_documents": "15 users"
                },
                "user_sessions": {
                    "description": "Authentication sessions",
                    "key_fields": [
                        "session_token (String, unique, indexed)",
                        "user_id (String, indexed)",
                        "expires_at (ISO DateTime, TTL index)",
                        "created_at (ISO DateTime)"
                    ],
                    "ttl": "7 days"
                },
                "api_usage": {
                    "description": "AI API usage tracking",
                    "key_fields": [
                        "user_id (String)",
                        "date (String YYYY-MM-DD)",
                        "master_key_count (Number)",
                        "own_key_count (Number)",
                        "total_count (Number)"
                    ],
                    "indexes": ["(user_id, date) unique compound"]
                },
                "ai_history": {
                    "description": "AI tool generation history",
                    "key_fields": [
                        "history_id (String, unique)",
                        "user_id (String, indexed)",
                        "tool_type (String)",
                        "prompt (String)",
                        "response (String)",
                        "created_at (ISO DateTime, indexed)"
                    ],
                    "indexes": ["(user_id, created_at) compound"]
                },
                "challenges": {
                    "description": "Community challenges (Q&A)",
                    "key_fields": [
                        "challenge_id (String, unique)",
                        "title (String)",
                        "description (String)",
                        "author_id (String)",
                        "tags (Array<String>)",
                        "created_at (ISO DateTime)"
                    ]
                },
                "answers": {
                    "description": "Challenge responses",
                    "key_fields": [
                        "answer_id (String, unique)",
                        "challenge_id (String)",
                        "author_id (String)",
                        "content (String)",
                        "created_at (ISO DateTime)"
                    ]
                }
            }
        },
        
        "api_endpoints": {
            "authentication": {
                "prefix": "/api/auth",
                "endpoints": [
                    {"method": "POST", "path": "/register", "auth": "public", "description": "Create new user (email/password)"},
                    {"method": "POST", "path": "/login", "auth": "public", "description": "Login (email/password)"},
                    {"method": "GET", "path": "/session", "auth": "public", "description": "Exchange Google OAuth session"},
                    {"method": "GET", "path": "/me", "auth": "required", "description": "Get current user"},
                    {"method": "POST", "path": "/logout", "auth": "required", "description": "Logout (delete session)"}
                ]
            },
            "user_management": {
                "prefix": "/api/users",
                "endpoints": [
                    {"method": "GET", "path": "/", "auth": "admin", "description": "List all users (paginated)"},
                    {"method": "GET", "path": "/{user_id}", "auth": "admin|self", "description": "Get user details"},
                    {"method": "PUT", "path": "/{user_id}", "auth": "admin|self", "description": "Update profile"},
                    {"method": "PUT", "path": "/{user_id}/role", "auth": "admin", "description": "Change role"},
                    {"method": "PUT", "path": "/{user_id}/status", "auth": "admin", "description": "Change status"},
                    {"method": "DELETE", "path": "/{user_id}", "auth": "admin", "description": "Delete user"},
                    {"method": "GET", "path": "/{user_id}/activity", "auth": "admin", "description": "View activity"},
                    {"method": "GET", "path": "/admin/architecture-docs", "auth": "superadmin", "description": "System architecture docs"}
                ]
            },
            "ai_tools": {
                "prefix": "/api/ai",
                "endpoints": [
                    {"method": "POST", "path": "/generate", "auth": "required", "description": "Generate AI content"},
                    {"method": "GET", "path": "/history", "auth": "required", "description": "Get user's AI history"},
                    {"method": "POST", "path": "/upload-chunk", "auth": "required", "description": "Upload file chunks"},
                    {"method": "POST", "path": "/extract-file", "auth": "required", "description": "Extract text from files"},
                    {"method": "POST", "path": "/download", "auth": "required", "description": "Download as CSV/PDF/DOCX/TXT"},
                    {"method": "PUT", "path": "/api-key", "auth": "required", "description": "Save user's API key"},
                    {"method": "DELETE", "path": "/api-key", "auth": "required", "description": "Remove user's API key"},
                    {"method": "GET", "path": "/api-key", "auth": "required", "description": "Get API key status"}
                ]
            },
            "challenges": {
                "prefix": "/api/challenges",
                "endpoints": [
                    {"method": "GET", "path": "/", "auth": "required", "description": "List challenges"},
                    {"method": "POST", "path": "/", "auth": "required", "description": "Create challenge"},
                    {"method": "GET", "path": "/{id}", "auth": "required", "description": "Get challenge details"},
                    {"method": "PUT", "path": "/{id}", "auth": "required", "description": "Update challenge"},
                    {"method": "DELETE", "path": "/{id}", "auth": "required", "description": "Delete challenge"}
                ]
            },
            "answers": {
                "prefix": "/api/answers",
                "endpoints": [
                    {"method": "POST", "path": "/", "auth": "required", "description": "Create answer"},
                    {"method": "PUT", "path": "/{id}", "auth": "required", "description": "Update answer"},
                    {"method": "DELETE", "path": "/{id}", "auth": "required", "description": "Delete answer"}
                ]
            },
            "dashboard": {
                "prefix": "/api/dashboard",
                "endpoints": [
                    {"method": "GET", "path": "/", "auth": "required", "description": "Get dashboard stats"}
                ]
            }
        },
        
        "rbac_system": {
            "roles": {
                "superadmin": {
                    "description": "Full system access",
                    "permissions": ["All operations", "User management", "Role management", "System docs access"],
                    "count": 1
                },
                "admin": {
                    "description": "User management and database access",
                    "permissions": ["View all users", "Edit users", "Change roles (limited)", "Suspend/ban users", "View analytics"],
                    "restrictions": ["Cannot promote to superadmin", "Cannot modify superadmin accounts", "Cannot view API keys"],
                    "count": 1
                },
                "user": {
                    "description": "Standard user access",
                    "permissions": ["AI tools", "Challenges", "Own profile", "Own data"],
                    "restrictions": ["Cannot view other users", "Cannot access admin panel"],
                    "count": 13
                }
            },
            "status_types": ["active", "suspended", "banned"],
            "implementation": {
                "middleware": "require_admin(), require_superadmin() FastAPI dependencies",
                "utilities": "rbac.py with permission checking functions",
                "frontend_guards": "AdminRoute, ProtectedRoute components"
            }
        },
        
        "features": {
            "ai_tools": {
                "count": 6,
                "tools": [
                    {
                        "id": "jd-builder",
                        "name": "JD Builder",
                        "description": "Generate professional job descriptions",
                        "ai_model": "GPT-5.2"
                    },
                    {
                        "id": "search-strategy",
                        "name": "Search Strategy",
                        "description": "Create recruitment search strategies",
                        "ai_model": "GPT-5.2"
                    },
                    {
                        "id": "talent-scout",
                        "name": "Talent Scout",
                        "description": "Interactive candidate identification with feedback loops",
                        "ai_model": "GPT-5.2",
                        "special_features": ["Iterative refinement", "5 candidates at a time", "CSV export"]
                    },
                    {
                        "id": "candidate-research",
                        "name": "Candidate Research",
                        "description": "Research candidate backgrounds",
                        "ai_model": "GPT-5.2"
                    },
                    {
                        "id": "dossier",
                        "name": "Candidate Dossier",
                        "description": "Create professional candidate presentations",
                        "ai_model": "GPT-5.2",
                        "special_features": ["Custom format upload", "Sample format matching"]
                    },
                    {
                        "id": "client-research",
                        "name": "Client Research",
                        "description": "Research potential client companies",
                        "ai_model": "GPT-5.2"
                    }
                ],
                "export_formats": ["CSV", "PDF", "DOCX", "TXT"],
                "file_upload_support": True,
                "audio_transcription": True
            },
            "community": {
                "challenges": "Q&A platform for recruiting questions",
                "answers": "Community responses with points system",
                "gamification": "Points, badges (Bronze/Silver/Gold), leaderboard"
            },
            "user_management": {
                "profile_fields": 11,
                "mandatory_fields": ["name", "email", "linkedin_url"],
                "optional_fields": ["title", "company", "phone", "city", "country", "about_me", "help_topics"],
                "api_key_management": True,
                "usage_tracking": "3 free uses/day on master key"
            },
            "admin_panel": {
                "user_list": "Paginated, searchable, filterable",
                "role_management": True,
                "status_management": True,
                "activity_viewer": True,
                "analytics": "User stats, API usage, activity logs"
            }
        },
        
        "security": {
            "authentication": {
                "method": "Session-based with httpOnly cookies",
                "password_hashing": "bcrypt",
                "session_duration": "7 days",
                "oauth_provider": "Google (Emergent-managed)"
            },
            "authorization": {
                "method": "Role-Based Access Control (RBAC)",
                "middleware": "FastAPI dependencies",
                "frontend_guards": "Protected routes"
            },
            "data_protection": {
                "api_keys": "Never exposed in API responses",
                "passwords": "bcrypt hashed, never stored plain",
                "sessions": "httpOnly cookies (XSS protection)",
                "cors": "Credential reflection for cross-origin"
            },
            "privacy": {
                "api_key_privacy": "Only owner can view their own key",
                "admin_restrictions": "Admins cannot see user API keys",
                "audit_trail": "Status changes logged with timestamp and admin_id"
            }
        },
        
        "deployment": {
            "platform": "Kubernetes Cluster (Emergent)",
            "containers": {
                "frontend": {"port": 3000, "process_manager": "Supervisor"},
                "backend": {"port": 8001, "process_manager": "Supervisor"},
                "mongodb": {"persistent_storage": True}
            },
            "ingress_rules": {
                "/api/*": "Redirects to backend:8001",
                "/*": "Redirects to frontend:3000"
            },
            "environment_variables": {
                "REACT_APP_BACKEND_URL": "Production external URL",
                "MONGO_URL": "MongoDB connection string",
                "DB_NAME": "Database name",
                "EMERGENT_LLM_KEY": "Universal AI key"
            },
            "hot_reload": "Enabled for both frontend and backend"
        },
        
        "performance": {
            "optimizations": [
                "MongoDB indexes (8 total)",
                "Async I/O (Motor driver)",
                "Connection pooling",
                "Pagination (users, challenges)"
            ],
            "known_issues": [
                "N+1 queries in challenges/dashboard endpoints",
                "No caching layer",
                "No CDN for static assets"
            ]
        },
        
        "file_structure": {
            "backend": {
                "entry_point": "server.py",
                "routers": ["auth.py", "users.py", "ai_tools.py", "challenges.py", "answers.py", "dashboard.py"],
                "utils": ["database.py", "auth.py", "rbac.py", "helpers.py"],
                "models": ["schemas.py"]
            },
            "frontend": {
                "entry_point": "App.js",
                "pages": ["LandingPage.js", "Dashboard.js", "AITools.js", "Challenges.js", "Profile.js", "ProfileSettings.js", "AdminPanel.js", "APIKeySettings.js"],
                "components": ["Navbar.js", "ThemeToggle.js", "ai_tools/*", "ui/*"]
            }
        },
        
        "credentials": {
            "superadmin": {
                "email": "noorussaba.alam@gmail.com",
                "role": "superadmin"
            },
            "test_users": {
                "admin": {"email": "saba@bestpl.ai", "role": "admin"},
                "regular_user": {"count": 13, "role": "user"}
            }
        }
    }
    
    return docs
