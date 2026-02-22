from pydantic import BaseModel
from typing import List, Optional


class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class ChallengeCreate(BaseModel):
    title: str
    description: str
    tags: List[str] = []
    category: Optional[str] = None  # NEW: Challenge category


class AnswerCreate(BaseModel):
    content: str  # Now accepts HTML content from rich text editor


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
