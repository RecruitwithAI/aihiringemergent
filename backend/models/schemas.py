from pydantic import BaseModel, Field, validator
from typing import List, Optional
import re


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    linkedin_url: str  # Mandatory field
    
    # Optional profile fields
    title: Optional[str] = None
    company: Optional[str] = None
    phone_number: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    about_me: Optional[str] = None
    help_topics: Optional[List[str]] = []
    
    @validator('linkedin_url')
    def validate_linkedin_url(cls, v):
        if not v:
            raise ValueError('LinkedIn URL is required')
        if 'linkedin.com' not in v.lower():
            raise ValueError('Must be a valid LinkedIn URL')
        return v
    
    @validator('phone_number')
    def validate_phone(cls, v):
        if v and not re.match(r'^\+\d{1,3}-\d{5,15}$', v):
            raise ValueError('Phone number must be in format: +XX-XXXXXXXXX')
        return v


class UserLogin(BaseModel):
    email: str
    password: str


class ChallengeCreate(BaseModel):
    title: str
    description: str
    tags: List[str] = []


class AnswerCreate(BaseModel):
    content: str


# ========================================
# USER MANAGEMENT SCHEMAS
# ========================================

class UserProfileUpdate(BaseModel):
    """Schema for updating user profile (by user or admin)"""
    name: Optional[str] = None
    linkedin_url: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    phone_number: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    about_me: Optional[str] = None
    help_topics: Optional[List[str]] = None
    
    @validator('linkedin_url')
    def validate_linkedin_url(cls, v):
        if v and 'linkedin.com' not in v.lower():
            raise ValueError('Must be a valid LinkedIn URL')
        return v
    
    @validator('phone_number')
    def validate_phone(cls, v):
        if v and not re.match(r'^\+\d{1,3}-\d{5,15}$', v):
            raise ValueError('Phone number must be in format: +XX-XXXXXXXXX')
        return v


class UserRoleUpdate(BaseModel):
    """Schema for updating user role (admin only)"""
    role: str = Field(..., description="New role: superadmin, admin, or user")
    
    @validator('role')
    def validate_role(cls, v):
        if v not in ['superadmin', 'admin', 'user']:
            raise ValueError('Role must be: superadmin, admin, or user')
        return v


class UserStatusUpdate(BaseModel):
    """Schema for updating user status (admin only)"""
    status: str = Field(..., description="New status: active, suspended, or banned")
    reason: Optional[str] = None  # Reason for suspension/ban
    
    @validator('status')
    def validate_status(cls, v):
        if v not in ['active', 'suspended', 'banned']:
            raise ValueError('Status must be: active, suspended, or banned')
        return v


class UserListQuery(BaseModel):
    """Query parameters for listing users"""
    page: int = 1
    limit: int = 50
    role: Optional[str] = None
    status: Optional[str] = None
    search: Optional[str] = None  # Search by name or email



class AIToolRequest(BaseModel):
    tool_type: str
    prompt: str
    context: Optional[str] = ""
    use_own_key: Optional[bool] = False
    own_api_key: Optional[str] = None


class UserAPIKeyUpdate(BaseModel):
    api_key: str  # User's personal OpenAI API key



class DownloadRequest(BaseModel):
    content: str
    format: str  # "txt" | "docx" | "pdf"
    filename: str = "output"


class ExtractFileRequest(BaseModel):
    upload_id: str
    filename: str
