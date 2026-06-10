from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response
from datetime import datetime, timezone, timedelta
import uuid
import os
import io
import re
import tempfile
from pathlib import Path

from utils.database import db
from utils.helpers import get_badge
from utils.auth import get_current_user, add_points
from utils.file_extraction import extract_text, UnsupportedFileType
from utils.document_export import markdown_to_docx, markdown_to_pdf
from models.schemas import AIToolRequest, DownloadRequest, ExtractFileRequest, UserAPIKeyUpdate


router = APIRouter(prefix="/ai", tags=["ai"])

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
MASTER_OPENAI_KEY = os.environ.get("MASTER_OPENAI_KEY")
UPLOAD_DIR = Path("/tmp/bestpl_uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CHUNK_SIZE = 1 * 1024 * 1024  # 1 MB

DAILY_FREE_LIMIT = 3  # Free API key uses per user per day

TOOL_PROMPTS = {
    "jd-builder": "You are an expert recruiter. Generate a professional, detailed Job Description based on the user's input. Include: Role Title, Company Overview (if provided), Role Summary, Key Responsibilities, Required Qualifications, Preferred Qualifications, Compensation Range guidance, and Why Join section. Format it cleanly with headers. IMPORTANT: Provide ONLY the job description content. Do NOT include any conversational follow-ups, questions, or offers for additional help at the end.",
    "search-strategy": "You are a senior executive search strategist. Create a CONCISE and ACTIONABLE Search Strategy. Include ONLY: 1) Target Profile (2-3 sentences), 2) Key Industries & Companies (bullet list), 3) Geographic Scope, 4) Primary Search Channels (LinkedIn, networks, databases - be specific), 5) Boolean Search Strings (2-3 examples), 6) Timeline (simple milestones). Keep it tight and practical. IMPORTANT: Provide ONLY the strategy content. Do NOT include any conversational follow-ups.",
    "search-strategy-targets": """You are a senior executive search strategist creating a TARGET COMPANY LIST. Generate a comprehensive table of target organizations for recruitment.

OUTPUT FORMAT: Create a markdown table with these columns:
| Company Name | Location | Website | Organization Overview | Why Target | Key Roles | Headcount |

INSTRUCTIONS:
- List 15-20 relevant target companies based on the user's search criteria
- Location: City, State/Country format
- Website: Full URL (https://...)
- Organization Overview: 1-2 sentence description of what they do
- Why Target: Why they're a good source for candidates (1 sentence)
- Key Roles: Types of roles to target (e.g., \"Engineering Managers, Senior Developers\")
- Headcount: Approximate company size or department size

Make the table well-formatted, data-rich, and actionable. Focus on companies that match the search profile. IMPORTANT: Provide ONLY the table. Do NOT include conversational text before or after.""",
    "candidate-research": "You are a talent intelligence analyst. Research and provide detailed insights about the candidate or candidate profile described. Include: Background Analysis, Career Trajectory, Key Achievements, Leadership Style indicators, Cultural Fit Assessment, Potential Red Flags, and Interview Focus Areas. IMPORTANT: Provide ONLY the research content. Do NOT include any conversational follow-ups or questions at the end.",
    "dossier": """You are a senior executive recruiter preparing a candidate presentation for a client. 

CRITICAL INSTRUCTIONS:
1. If the user provides a \"DESIRED OUTPUT FORMAT\" or \"Sample Output Format\", you MUST follow that exact structure, style, section ordering, and formatting.
2. Match the tone, writing style, level of detail, and section headings from the provided format sample.
3. Preserve the same flow and organization as shown in the sample format.
4. If specific sections appear in the sample (e.g., \"Executive Summary\", \"Professional Background\", \"Key Strengths\"), use those EXACT section names and ordering.
5. Match the format's use of bullet points, paragraphs, metrics presentation, and any special formatting cues.

If NO sample format is provided, create a professional Candidate Dossier with: Executive Summary, Career Overview, Key Accomplishments with metrics, Leadership Competencies, Education & Certifications, Compensation Expectations, Availability, and Recommendation Summary.

IMPORTANT: Provide ONLY the dossier content. Do NOT include any conversational follow-ups, questions, or offers for additional help at the end.""",
    "client-research": "You are a business development researcher for an executive search firm. Research the potential client company described. Include: Company Overview, Leadership Team, Recent News & Developments, Growth Trajectory, Culture & Values, Likely Hiring Needs, Key Decision Makers, and Approach Strategy. IMPORTANT: Provide ONLY the research content. Do NOT include any conversational follow-ups or questions at the end.",
    "talent-scout": """You are an expert executive search consultant with 15+ years of experience in technology leadership recruitment.

YOUR EXPERTISE INCLUDES:
- Identifying leadership talent at VP+ levels across various industries
- Evaluating career trajectories, scope, and strategic impact
- Assessing cultural and organizational fit factors
- Maintaining high ethical standards in candidate research

PROFESSIONAL GUIDELINES:
- Only provide information that can be verified from public sources (LinkedIn, company websites, press releases, industry publications)
- Clearly indicate when information is inferred vs. confirmed (use the \"verification_notes\" field)
- Respect candidate privacy and professional boundaries
- Focus on professional achievements and qualifications, not personal information

RESPONSE QUALITY STANDARDS:
- Provide specific, concrete examples of achievements
- Include measurable outcomes (revenue impact, team growth, cost savings, etc.)
- Use realistic names with diverse representation (gender, ethnicity)
- Note any gaps or uncertainties in candidate information
- Ensure data_confidence field accurately reflects information availability

---

ROLE: Identify high-potential candidates who match the specified requirements.

PROCESS:
1. First, build a comprehensive role context based on the user's input (Target Role, Company, Geography, Compensation, Required Qualifications, Success Factors, Ideal Background, Exclusions)
2. Then identify realistic candidate profiles that match this context

OUTPUT FORMAT: Return ONLY a valid JSON array with exactly 5 candidate objects. Each candidate must follow this structure:

[
  {
    "name": "Full Name (realistic, diverse names)",
    "current_title": "Exact current job title",
    "current_employer": "Current company name",
    "location": "City, State/Country",
    "scope": "Detailed description of current responsibilities including team size, budget, key technologies/domains, reporting structure, and strategic impact",
    "achievements": "Specific, measurable achievements with concrete outcomes and business impact (use numbers, percentages, dollar amounts)",
    "previous_employers": ["Company1", "Company2", "Company3"],
    "education": "Degrees and institutions (e.g., MBA - Harvard Business School, BS Computer Science - Stanford)",
    "years_in_role": "X years (approximate tenure in current position)",
    "total_experience": "Y years (total relevant professional experience)",
    "data_confidence": "high|medium|low (based on how commonly available this type of profile information would be)",
    "verification_notes": "Any caveats, assumptions, or uncertainties about the data (e.g., 'Title inferred from company size', 'Scope estimated based on industry standards')"
  }
]

CRITICAL INSTRUCTIONS:
- Generate realistic, diverse, high-quality candidate profiles
- Make achievements specific and measurable (avoid generic statements)
- Scope should be detailed (100-150 words) covering team size, budget, technologies, impact
- Previous employers should show logical career progression
- Data confidence should reflect reality (not all information is equally available)
- Verification notes should be honest about assumptions
- Names should be diverse (gender, ethnicity)
- Return ONLY the JSON array, no additional text before or after
- Ensure the JSON is valid and properly formatted

If this is a REFINEMENT request (user provided feedback), adjust your search criteria based on their feedback while maintaining the JSON format.""",
}


def clean_ai_response(response: str) -> str:
    """
    Remove conversational follow-ups and questions from AI responses.
    Strips out common patterns like 'If you want...', 'Let me know...', etc.
    """
    # Split by lines
    lines = response.split('\n')
    cleaned_lines = []
    found_separator = False
    
    # Common patterns that indicate conversational follow-ups
    followup_patterns = [
        "if you want",
        "if you'd like",
        "would you like",
        "let me know",
        "feel free to",
        "i can help",
        "i can tailor",
        "i can create",
        "i can provide",
        "i can also",
        "shall i",
        "should i",
        "do you want",
        "would you prefer",
        "happy to help",
        "happy to assist",
        "need any changes",
        "need anything else",
        "anything else",
        "any questions",
    ]
    
    for line in lines:
        stripped = line.strip()
        lower_line = stripped.lower()
        
        # Check if this line starts a conversational section
        # Often preceded by \"---\" or empty lines
        if stripped == "---" or stripped == "***":
            # Check if the next content looks conversational
            found_separator = True
            continue
        
        # If we found a separator, check if subsequent non-empty lines are conversational
        if found_separator and stripped:
            is_conversational = any(pattern in lower_line for pattern in followup_patterns)
            if is_conversational:
                # Skip this and remaining lines (likely all conversational)
                break
            else:
                # False alarm, include the separator and continue
                if cleaned_lines and cleaned_lines[-1].strip() != "":
                    cleaned_lines.append("")  # Add spacing
                found_separator = False
        
        # Check if line itself starts with a conversational pattern
        is_conversational_start = any(
            lower_line.startswith(pattern) for pattern in followup_patterns
        )
        
        if is_conversational_start:
            # This line and everything after is likely conversational - stop here
            break
        
        cleaned_lines.append(line)
    
    # Join and clean up excessive blank lines at the end
    result = '\n'.join(cleaned_lines).rstrip('\n')
    
    # Remove trailing \"---\" if present
    while result.endswith('\n---') or result.endswith('\n***'):
        result = result.rsplit('\n', 1)[0].rstrip()
    
    return result


async def check_daily_usage(user_id: str) -> dict:
    """Check if user has remaining free API uses today"""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    usage_count = await db.api_usage.count_documents({
        "user_id": user_id,
        "used_master_key": True,
        "timestamp": {"$gte": today_start}
    })
    
    remaining = max(0, DAILY_FREE_LIMIT - usage_count)
    return {
        "used": usage_count,
        "remaining": remaining,
        "limit": DAILY_FREE_LIMIT,
        "can_use": remaining > 0
    }


async def record_usage(user_id: str, used_master_key: bool, tool_type: str):
    """Record API usage"""
    await db.api_usage.insert_one({
        "user_id": user_id,
        "used_master_key": used_master_key,
        "tool_type": tool_type,
        "timestamp": datetime.now(timezone.utc)
    })


@router.get("/usage")
async def get_usage_stats(user=Depends(get_current_user)):
    """Get user's API usage statistics"""
    usage = await check_daily_usage(user["user_id"])
    
    # Get user's stored API key status
    user_data = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "has_own_api_key": 1})
    has_own_key = user_data.get("has_own_api_key", False) if user_data else False
    
    return {
        "daily_usage": usage,
        "has_own_api_key": has_own_key
    }


@router.post("/generate")
async def ai_generate(req: AIToolRequest, user=Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    # Determine which API key to use
    api_key_to_use = None
    using_master_key = False
    
    if req.use_own_key and req.own_api_key:
        # User provided their own API key for this request
        api_key_to_use = req.own_api_key
        using_master_key = False
    else:
        # Check if user has a saved API key
        user_data = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "openai_api_key": 1})
        if user_data and user_data.get("openai_api_key"):
            api_key_to_use = user_data["openai_api_key"]
            using_master_key = False
        else:
            # Use SuperAdmin's API key for free usages - check daily limit
            usage = await check_daily_usage(user["user_id"])
            if not usage["can_use"]:
                raise HTTPException(
                    status_code=429,
                    detail=f"Daily free API limit reached ({DAILY_FREE_LIMIT} uses per day). Please add your own OpenAI API key to continue."
                )
            
            # Get SuperAdmin's API key
            superadmin = await db.users.find_one({"role": "superadmin"}, {"_id": 0, "openai_api_key": 1})
            if superadmin and superadmin.get("openai_api_key"):
                api_key_to_use = superadmin["openai_api_key"]
                using_master_key = True
            else:
                raise HTTPException(
                    status_code=503,
                    detail="System API key not configured. Please contact administrator or add your own OpenAI API key."
                )

    system_prompt = TOOL_PROMPTS.get(req.tool_type, "You are a helpful recruiting AI assistant.")

    chat = LlmChat(
        api_key=api_key_to_use,
        session_id=f"ai_{user['user_id']}_{uuid.uuid4().hex[:8]}",
        system_message=system_prompt,
    ).with_model("openai", "gpt-4o")

    full_prompt = req.prompt
    if req.context:
        full_prompt = f"{req.prompt}\n\nAdditional Context: {req.context}"

    response = await chat.send_message(UserMessage(text=full_prompt))
    
    # Clean up conversational follow-ups from the response
    cleaned_response = clean_ai_response(response)

    # Record usage
    await record_usage(user["user_id"], using_master_key, req.tool_type)

    await db.ai_history.insert_one({
        "history_id": f"hist_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "tool_type": req.tool_type,
        "prompt": req.prompt,
        "response": cleaned_response,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    await add_points(user["user_id"], 2)
    return {"response": cleaned_response, "tool_type": req.tool_type}


@router.get("/history")
async def get_ai_history(user=Depends(get_current_user)):
    history = await db.ai_history.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return history


# ── File Upload & Extraction ──

@router.post("/upload-chunk")
async def upload_chunk(
    chunk: UploadFile = File(...),
    upload_id: str = Form(...),
    chunk_index: str = Form(...),
    total_chunks: str = Form(...),
    filename: str = Form(...),
    user=Depends(get_current_user),
):
    chunk_dir = UPLOAD_DIR / f"{user['user_id']}_{upload_id}"
    chunk_dir.mkdir(parents=True, exist_ok=True)
    data = await chunk.read()
    (chunk_dir / f"chunk_{int(chunk_index):05d}").write_bytes(data)
    return {"chunk": int(chunk_index), "total": int(total_chunks), "ok": True}

@router.post("/extract-file")
async def extract_file(req: ExtractFileRequest, user=Depends(get_current_user)):
    """Reassemble uploaded chunks and extract text (per-type handlers in utils/file_extraction)."""
    chunk_dir = UPLOAD_DIR / f"{user['user_id']}_{req.upload_id}"
    if not chunk_dir.exists():
        raise HTTPException(status_code=404, detail="Upload session not found")

    chunks = sorted(chunk_dir.glob("chunk_*"))
    if not chunks:
        raise HTTPException(status_code=400, detail="No chunks received")

    content = b"".join(c.read_bytes() for c in chunks)
    for c in chunks:
        c.unlink()
    chunk_dir.rmdir()

    try:
        extracted = await extract_text(content, req.filename, llm_key=EMERGENT_LLM_KEY)
    except UnsupportedFileType as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File extraction failed: {str(e)}")

    if not extracted.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from file. Try a different format.")

    return {"extracted_text": extracted.strip(), "filename": req.filename, "char_count": len(extracted)}



@router.post("/download")
async def download_document(req: DownloadRequest, user=Depends(get_current_user)):
    safe_name = re.sub(r"[^\w\- ]", "_", req.filename)[:60]
    
    if req.format == "txt":
        return Response(
            content=req.content.encode("utf-8"),
            media_type="text/plain; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}.txt"'},
        )
    
    elif req.format == "csv":
        # CSV export for talent-scout (expects JSON array of candidates)
        import csv
        import json
        
        try:
            candidates = json.loads(req.content)
            if not isinstance(candidates, list):
                raise ValueError("Content must be a JSON array")
            
            # Create CSV in memory
            output = io.StringIO()
            if candidates:
                writer = csv.DictWriter(output, fieldnames=candidates[0].keys())
                writer.writeheader()
                
                for candidate in candidates:
                    # Flatten arrays/lists for CSV
                    row = {}
                    for key, value in candidate.items():
                        if isinstance(value, list):
                            row[key] = ", ".join(str(v) for v in value)
                        else:
                            row[key] = value
                    writer.writerow(row)
            
            csv_content = output.getvalue()
            output.close()
            
            return Response(
                content=csv_content.encode("utf-8"),
                media_type="text/csv; charset=utf-8",
                headers={"Content-Disposition": f'attachment; filename="{safe_name}.csv"'},
            )
        except (json.JSONDecodeError, ValueError):
            # Fallback: treat as plain text CSV
            return Response(
                content=req.content.encode("utf-8"),
                media_type="text/csv; charset=utf-8",
                headers={"Content-Disposition": f'attachment; filename="{safe_name}.csv"'},
            )
    
    elif req.format == "docx":
        return Response(
            content=markdown_to_docx(req.content),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}.docx"'},
        )
    
    elif req.format == "pdf":
        return Response(
            content=markdown_to_pdf(req.content),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}.pdf"'},
        )
    
    raise HTTPException(status_code=400, detail="Invalid format. Use txt, csv, docx, or pdf.")



@router.post("/save-api-key")
async def save_user_api_key(req: UserAPIKeyUpdate, user=Depends(get_current_user)):
    """Save user's personal OpenAI API key"""
    if not req.api_key or len(req.api_key.strip()) < 10:
        raise HTTPException(status_code=400, detail="Invalid API key")
    
    # Update user's API key in database (stored securely)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "openai_api_key": req.api_key.strip(),
            "has_own_api_key": True,
            "api_key_updated_at": datetime.now(timezone.utc)
        }}
    )
    
    return {"success": True, "message": "API key saved successfully"}


@router.delete("/delete-api-key")
async def delete_user_api_key(user=Depends(get_current_user)):
    """Remove user's personal OpenAI API key"""
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$unset": {"openai_api_key": ""}, "$set": {"has_own_api_key": False}}
    )
    
    return {"success": True, "message": "API key removed successfully"}
