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
from models.schemas import AIToolRequest, DownloadRequest, ExtractFileRequest, UserAPIKeyUpdate


router = APIRouter(prefix="/ai", tags=["ai"])

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
MASTER_OPENAI_KEY = os.environ.get("MASTER_OPENAI_KEY")
UPLOAD_DIR = Path("/tmp/bestpl_uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CHUNK_SIZE = 1 * 1024 * 1024  # 1 MB

DAILY_FREE_LIMIT = 3  # Free API key uses per user per day

TOOL_PROMPTS = {
    "jd-builder": "You are an expert recruiter. Generate a professional, detailed Job Description based on the user's input. Include: Role Title, Company Overview (if provided), Role Summary, Key Responsibilities, Required Qualifications, Preferred Qualifications, Compensation Range guidance, and Why Join section. Format it cleanly with headers.",
    "search-strategy": "You are a senior executive search strategist. Create a comprehensive Search Strategy for finding the ideal candidate. Include: Target Profile, Industry Mapping, Geographic Scope, Channel Strategy (LinkedIn, networks, databases), Boolean Search Strings, Competitor Companies to Target, Timeline, and KPIs for the search.",
    "candidate-research": "You are a talent intelligence analyst. Research and provide detailed insights about the candidate or candidate profile described. Include: Background Analysis, Career Trajectory, Key Achievements, Leadership Style indicators, Cultural Fit Assessment, Potential Red Flags, and Interview Focus Areas.",
    "dossier": """You are a senior executive recruiter preparing a candidate presentation for a client. 

CRITICAL INSTRUCTIONS:
1. If the user provides a "DESIRED OUTPUT FORMAT" or "Sample Output Format", you MUST follow that exact structure, style, section ordering, and formatting.
2. Match the tone, writing style, level of detail, and section headings from the provided format sample.
3. Preserve the same flow and organization as shown in the sample format.
4. If specific sections appear in the sample (e.g., "Executive Summary", "Professional Background", "Key Strengths"), use those EXACT section names and ordering.
5. Match the format's use of bullet points, paragraphs, metrics presentation, and any special formatting cues.

If NO sample format is provided, create a professional Candidate Dossier with: Executive Summary, Career Overview, Key Accomplishments with metrics, Leadership Competencies, Education & Certifications, Compensation Expectations, Availability, and Recommendation Summary.""",
    "client-research": "You are a business development researcher for an executive search firm. Research the potential client company described. Include: Company Overview, Leadership Team, Recent News & Developments, Growth Trajectory, Culture & Values, Likely Hiring Needs, Key Decision Makers, and Approach Strategy.",
}


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
            # Use master key - check daily limit
            usage = await check_daily_usage(user["user_id"])
            if not usage["can_use"]:
                raise HTTPException(
                    status_code=429,
                    detail=f"Daily free API limit reached ({DAILY_FREE_LIMIT} uses per day). Please add your own OpenAI API key to continue."
                )
            api_key_to_use = MASTER_OPENAI_KEY
            using_master_key = True

    system_prompt = TOOL_PROMPTS.get(req.tool_type, "You are a helpful recruiting AI assistant.")

    chat = LlmChat(
        api_key=api_key_to_use,
        session_id=f"ai_{user['user_id']}_{uuid.uuid4().hex[:8]}",
        system_message=system_prompt,
    ).with_model("openai", "gpt-5.2")

    full_prompt = req.prompt
    if req.context:
        full_prompt = f"{req.prompt}\n\nAdditional Context: {req.context}"

    response = await chat.send_message(UserMessage(text=full_prompt))

    # Record usage
    await record_usage(user["user_id"], using_master_key, req.tool_type)

    await db.ai_history.insert_one({
        "history_id": f"hist_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "tool_type": req.tool_type,
        "prompt": req.prompt,
        "response": response,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    await add_points(user["user_id"], 2)
    return {"response": response, "tool_type": req.tool_type}


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

    ext = req.filename.lower().rsplit(".", 1)[-1] if "." in req.filename else ""
    extracted = ""

    try:
        if ext == "txt":
            extracted = content.decode("utf-8", errors="ignore")

        elif ext == "pdf":
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(content))
            
            # Extract text with better formatting preservation
            pages_text = []
            for page_num, page in enumerate(reader.pages, 1):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    # Add page marker for multi-page documents to preserve structure
                    if len(reader.pages) > 1:
                        pages_text.append(f"[Page {page_num}]\n{page_text}")
                    else:
                        pages_text.append(page_text)
            
            extracted = "\n\n".join(pages_text)
            
            # Clean up common PDF extraction artifacts while preserving structure
            # Remove excessive whitespace but keep paragraph breaks
            extracted = re.sub(r'\n{3,}', '\n\n', extracted)  # Max 2 newlines
            extracted = re.sub(r'[ \t]+', ' ', extracted)  # Normalize spaces
            extracted = extracted.strip()

        elif ext == "docx":
            from docx import Document as DocxDoc
            doc = DocxDoc(io.BytesIO(content))
            extracted = "\n".join(p.text for p in doc.paragraphs)

        elif ext == "doc":
            try:
                from docx import Document as DocxDoc
                doc = DocxDoc(io.BytesIO(content))
                extracted = "\n".join(p.text for p in doc.paragraphs)
            except Exception:
                text = content.decode("latin-1", errors="ignore")
                extracted = " ".join(re.findall(r'[\x20-\x7E\n\r\t]{4,}', text))

        elif ext in ("mp3", "wav", "m4a", "ogg", "aac", "flac", "mp4", "mpeg", "mpga", "webm"):
            from emergentintegrations.llm.openai import OpenAISpeechToText
            stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
            with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
                tmp.write(content)
                tmp_path = tmp.name
            try:
                with open(tmp_path, "rb") as audio_file:
                    resp = await stt.transcribe(
                        file=audio_file, model="whisper-1", response_format="json", language="en",
                        prompt="Recruiting, job descriptions, executive search, candidate profiles.",
                    )
                extracted = resp.text
            finally:
                os.unlink(tmp_path)

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: .{ext}")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File extraction failed: {str(e)}")

    if not extracted.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from file. Try a different format.")

    return {"extracted_text": extracted.strip(), "filename": req.filename, "char_count": len(extracted)}


# ── Document Download Generation ──

def _add_bold_runs(paragraph, text: str):
    parts = re.split(r"\*\*(.*?)\*\*", text)
    for i, part in enumerate(parts):
        paragraph.add_run(part).bold = (i % 2 == 1)


def _parse_md_to_docx(content: str) -> bytes:
    from docx import Document
    doc = Document()
    for line in content.split("\n"):
        s = line.strip()
        if not s:
            doc.add_paragraph("")
        elif s.startswith("### "):
            doc.add_heading(s[4:], level=3)
        elif s.startswith("## "):
            doc.add_heading(s[3:], level=2)
        elif s.startswith("# "):
            doc.add_heading(s[2:], level=1)
        elif s.startswith(("- ", "* ", "\u2022 ")):
            p = doc.add_paragraph(style="List Bullet")
            _add_bold_runs(p, s[2:])
        else:
            p = doc.add_paragraph()
            _add_bold_runs(p, s)
    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf.read()


def _parse_md_to_pdf(content: str) -> bytes:
    from fpdf import FPDF

    def safe(t: str) -> str:
        # Replace problematic characters and encode safely
        t = t.replace('\u2022', '-').replace('\u2019', "'").replace('\u2018', "'")
        t = t.replace('\u201c', '"').replace('\u201d', '"').replace('\u2014', '-')
        t = t.replace('\u2013', '-').replace('\u00a0', ' ')
        # Handle other unicode characters more gracefully
        t = t.encode("latin-1", errors="replace").decode("latin-1")
        return t

    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_margins(15, 15, 15)

    # Page width minus margins
    effective_width = 210 - 30  # A4 width (210mm) minus left+right margins (15+15)

    for line in content.split("\n"):
        s = line.strip()
        
        # Skip truly empty lines
        if not s:
            pdf.ln(3)
            continue
        
        # Remove markdown bold markers for display
        clean = re.sub(r"\*\*(.*?)\*\*", r"\1", s)
        
        # Skip lines that are just special characters
        if not clean or len(clean.strip()) == 0:
            pdf.ln(2)
            continue

        # Process different line types
        if s.startswith("# ") and not s.startswith("##"):
            # H1 - Main heading
            pdf.set_font("Helvetica", "B", 16)
            text = safe(clean[2:].strip())
            if text:
                pdf.multi_cell(effective_width, 8, text, align='L')
                pdf.ln(3)
                
        elif s.startswith("### "):
            # H3 - Sub-subheading
            pdf.set_font("Helvetica", "B", 11)
            text = safe(clean[4:].strip())
            if text:
                pdf.multi_cell(effective_width, 6, text, align='L')
                pdf.ln(1)
                
        elif s.startswith("## "):
            # H2 - Subheading
            pdf.set_font("Helvetica", "B", 13)
            text = safe(clean[3:].strip())
            if text:
                pdf.multi_cell(effective_width, 7, text, align='L')
                pdf.ln(2)
                
        elif s.startswith(("- ", "* ", "\u2022 ")):
            # Bullet point
            pdf.set_font("Helvetica", "", 10)
            bullet_text = clean[2:].strip()
            if bullet_text:
                # Use proper bullet formatting with indentation
                x_before = pdf.get_x()
                y_before = pdf.get_y()
                
                # Add bullet symbol
                pdf.cell(5, 5, "-", align='L')
                
                # Add bullet text with proper wrapping
                pdf.set_x(x_before + 7)
                text = safe(bullet_text)
                pdf.multi_cell(effective_width - 7, 5, text, align='L')
                
        else:
            # Regular paragraph text
            pdf.set_font("Helvetica", "", 10)
            text = safe(clean)
            if text:
                pdf.multi_cell(effective_width, 5, text, align='L')
                pdf.ln(1)

    return bytes(pdf.output())


@router.post("/download")
async def download_document(req: DownloadRequest, user=Depends(get_current_user)):
    safe_name = re.sub(r"[^\w\- ]", "_", req.filename)[:60]
    if req.format == "txt":
        return Response(
            content=req.content.encode("utf-8"),
            media_type="text/plain; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}.txt"'},
        )
    elif req.format == "docx":
        return Response(
            content=_parse_md_to_docx(req.content),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}.docx"'},
        )
    elif req.format == "pdf":
        return Response(
            content=_parse_md_to_pdf(req.content),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}.pdf"'},
        )
    raise HTTPException(status_code=400, detail="Invalid format. Use txt, docx, or pdf.")



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
