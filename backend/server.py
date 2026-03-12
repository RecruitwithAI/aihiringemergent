from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

class MandateCreate(BaseModel):
    role: str
    target_companies: List[str]
    geography: str
    must_haves: Optional[str] = ""
    no_go_constraints: Optional[str] = ""
    compensation_band: Optional[str] = ""
    reporting_line: Optional[str] = ""
    ideal_backgrounds: str

class Mandate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str
    target_companies: List[str]
    geography: str
    must_haves: str
    no_go_constraints: str
    compensation_band: str
    reporting_line: str
    ideal_backgrounds: str
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    candidate_count: int = 0

class Company(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mandate_id: str
    name: str
    sector: Optional[str] = ""
    size: Optional[str] = ""
    growth_stage: Optional[str] = ""
    leadership_structure: Optional[str] = ""
    researched: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Evidence(BaseModel):
    source_url: str
    snippet: str
    field_name: str
    confidence: float

class Candidate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mandate_id: str
    company_name: str
    name: str
    current_title: str
    current_employer: str
    previous_employers: List[str] = []
    location: str = ""
    education: str = ""
    scope: str = ""
    achievements: str = ""
    evidence: List[Evidence] = []
    fit_score: float = 0.0
    confidence_score: float = 0.0
    gaps: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SearchLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mandate_id: str
    query: str
    results_count: int
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SettingsUpdate(BaseModel):
    ai_model: str

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "default"
    ai_model: str = "gpt-5.2"

@api_router.post("/mandates", response_model=Mandate)
async def create_mandate(input: MandateCreate):
    mandate_dict = input.model_dump()
    mandate = Mandate(**mandate_dict)
    
    doc = mandate.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.mandates.insert_one(doc)
    
    for company_name in input.target_companies:
        company = Company(mandate_id=mandate.id, name=company_name)
        company_doc = company.model_dump()
        company_doc['created_at'] = company_doc['created_at'].isoformat()
        await db.companies.insert_one(company_doc)
    
    return mandate

@api_router.get("/mandates", response_model=List[Mandate])
async def get_mandates():
    mandates = await db.mandates.find({}, {"_id": 0}).to_list(1000)
    for mandate in mandates:
        if isinstance(mandate['created_at'], str):
            mandate['created_at'] = datetime.fromisoformat(mandate['created_at'])
    return mandates

@api_router.get("/mandates/{mandate_id}", response_model=Mandate)
async def get_mandate(mandate_id: str):
    mandate = await db.mandates.find_one({"id": mandate_id}, {"_id": 0})
    if not mandate:
        raise HTTPException(status_code=404, detail="Mandate not found")
    if isinstance(mandate['created_at'], str):
        mandate['created_at'] = datetime.fromisoformat(mandate['created_at'])
    return mandate

@api_router.get("/mandates/{mandate_id}/candidates", response_model=List[Candidate])
async def get_mandate_candidates(mandate_id: str):
    candidates = await db.candidates.find({"mandate_id": mandate_id}, {"_id": 0}).sort("fit_score", -1).to_list(1000)
    for candidate in candidates:
        if isinstance(candidate['created_at'], str):
            candidate['created_at'] = datetime.fromisoformat(candidate['created_at'])
    return candidates

@api_router.get("/candidates/{candidate_id}", response_model=Candidate)
async def get_candidate(candidate_id: str):
    candidate = await db.candidates.find_one({"id": candidate_id}, {"_id": 0})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if isinstance(candidate['created_at'], str):
        candidate['created_at'] = datetime.fromisoformat(candidate['created_at'])
    return candidate

class SearchRequest(BaseModel):
    mandate_id: str

@api_router.post("/search/orchestrate")
async def orchestrate_search(request: SearchRequest):
    mandate = await db.mandates.find_one({"id": request.mandate_id}, {"_id": 0})
    if not mandate:
        raise HTTPException(status_code=404, detail="Mandate not found")
    
    companies = await db.companies.find({"mandate_id": request.mandate_id, "researched": False}, {"_id": 0}).to_list(10)
    
    if not companies:
        return {"status": "complete", "message": "All companies have been researched"}
    
    openai_key = os.environ.get('OPENAI_API_KEY')
    if not openai_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    for company in companies:
        try:
            chat = LlmChat(
                api_key=openai_key,
                session_id=f"search_{company['id']}",
                system_message="You are an expert executive recruiter researching leadership candidates."
            ).with_model("openai", "gpt-5.2")
            
            search_query = f"""Research leadership candidates for the role of {mandate['role']} from {company['name']}.
            
Looking for candidates with:
- Geography: {mandate['geography']}
- Must-haves: {mandate['must_haves']}
- Ideal backgrounds: {mandate['ideal_backgrounds']}

Provide 2-3 likely candidates in JSON format with fields:
- name
- current_title
- location
- scope (describe their responsibilities)
- achievements
- previous_employers (list)
- education

Return ONLY valid JSON array."""
            
            message = UserMessage(text=search_query)
            response = await chat.send_message(message)
            
            try:
                candidates_data = json.loads(response)
                if not isinstance(candidates_data, list):
                    candidates_data = [candidates_data]
            except:
                candidates_data = []
            
            for cand_data in candidates_data:
                evidence = [
                    Evidence(
                        source_url="AI Generated",
                        snippet=f"Based on research query for {company['name']}",
                        field_name="general",
                        confidence=0.7
                    )
                ]
                
                fit_score = calculate_fit_score(
                    cand_data.get('current_title', ''),
                    mandate['role'],
                    mandate['ideal_backgrounds']
                )
                
                candidate = Candidate(
                    mandate_id=request.mandate_id,
                    company_name=company['name'],
                    name=cand_data.get('name', 'Unknown'),
                    current_title=cand_data.get('current_title', ''),
                    current_employer=company['name'],
                    previous_employers=cand_data.get('previous_employers', []),
                    location=cand_data.get('location', ''),
                    education=cand_data.get('education', ''),
                    scope=cand_data.get('scope', ''),
                    achievements=cand_data.get('achievements', ''),
                    evidence=evidence,
                    fit_score=fit_score,
                    confidence_score=0.7,
                    gaps="Requires recruiter validation for current role and availability"
                )
                
                cand_doc = candidate.model_dump()
                cand_doc['created_at'] = cand_doc['created_at'].isoformat()
                await db.candidates.insert_one(cand_doc)
            
            await db.companies.update_one(
                {"id": company['id']},
                {"$set": {"researched": True}}
            )
            
            log = SearchLog(
                mandate_id=request.mandate_id,
                query=f"Research for {company['name']}",
                results_count=len(candidates_data)
            )
            log_doc = log.model_dump()
            log_doc['timestamp'] = log_doc['timestamp'].isoformat()
            await db.search_logs.insert_one(log_doc)
            
        except Exception as e:
            logging.error(f"Error researching {company['name']}: {str(e)}")
            continue
    
    candidate_count = await db.candidates.count_documents({"mandate_id": request.mandate_id})
    await db.mandates.update_one(
        {"id": request.mandate_id},
        {"$set": {"candidate_count": candidate_count}}
    )
    
    return {"status": "processing", "message": f"Researched {len(companies)} companies", "candidates_found": candidate_count}

def calculate_fit_score(candidate_title: str, target_role: str, ideal_backgrounds: str) -> float:
    score = 50.0
    
    candidate_title_lower = candidate_title.lower()
    target_role_lower = target_role.lower()
    
    if target_role_lower in candidate_title_lower:
        score += 20
    
    leadership_terms = ['director', 'vp', 'head', 'chief', 'president', 'manager', 'lead']
    for term in leadership_terms:
        if term in candidate_title_lower:
            score += 10
            break
    
    if ideal_backgrounds:
        background_terms = ideal_backgrounds.lower().split()
        for term in background_terms:
            if len(term) > 3 and term in candidate_title_lower:
                score += 5
    
    return min(score, 95.0)

@api_router.get("/settings", response_model=Settings)
async def get_settings():
    settings = await db.settings.find_one({"id": "default"}, {"_id": 0})
    if not settings:
        default_settings = Settings()
        await db.settings.insert_one(default_settings.model_dump())
        return default_settings
    return settings

@api_router.put("/settings", response_model=Settings)
async def update_settings(input: SettingsUpdate):
    await db.settings.update_one(
        {"id": "default"},
        {"$set": {"ai_model": input.ai_model}},
        upsert=True
    )
    return Settings(ai_model=input.ai_model)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()