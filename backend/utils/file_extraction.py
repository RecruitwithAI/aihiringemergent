"""
Text extraction from uploaded files — one small handler per file type.

Used by routers/ai_tools.py :: extract_file endpoint.
Raises:
  UnsupportedFileType — file extension has no handler (router maps to 400)
  Exception           — any extraction failure (router maps to 500)
"""
import io
import os
import re
import tempfile

AUDIO_EXTENSIONS = ("mp3", "wav", "m4a", "ogg", "aac", "flac", "mp4", "mpeg", "mpga", "webm")


class UnsupportedFileType(Exception):
    pass


def _extract_txt(content: bytes) -> str:
    return content.decode("utf-8", errors="ignore")


def _extract_pdf(content: bytes) -> str:
    import pypdf
    reader = pypdf.PdfReader(io.BytesIO(content))

    # Extract text with better formatting preservation
    pages_text = []
    for page_num, page in enumerate(reader.pages, 1):
        page_text = page.extract_text() or ""
        if not page_text.strip():
            continue
        # Add page marker for multi-page documents to preserve structure
        if len(reader.pages) > 1:
            pages_text.append(f"[Page {page_num}]\n{page_text}")
        else:
            pages_text.append(page_text)

    extracted = "\n\n".join(pages_text)

    # Clean up common PDF extraction artifacts while preserving structure
    extracted = re.sub(r'\n{3,}', '\n\n', extracted)  # Max 2 newlines
    extracted = re.sub(r'[ \t]+', ' ', extracted)  # Normalize spaces
    return extracted.strip()


def _extract_docx(content: bytes) -> str:
    from docx import Document as DocxDoc
    doc = DocxDoc(io.BytesIO(content))
    return "\n".join(p.text for p in doc.paragraphs)


def _extract_doc(content: bytes) -> str:
    """Legacy .doc — try docx parser first, fall back to printable-text scraping."""
    try:
        return _extract_docx(content)
    except Exception:
        text = content.decode("latin-1", errors="ignore")
        return " ".join(re.findall(r'[\x20-\x7E\n\r\t]{4,}', text))


async def _extract_audio(content: bytes, ext: str, llm_key: str) -> str:
    """Transcribe audio/video via Whisper (emergentintegrations)."""
    from emergentintegrations.llm.openai import OpenAISpeechToText
    stt = OpenAISpeechToText(api_key=llm_key)
    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name
    try:
        with open(tmp_path, "rb") as audio_file:
            resp = await stt.transcribe(
                file=audio_file, model="whisper-1", response_format="json", language="en",
                prompt="Recruiting, job descriptions, executive search, candidate profiles.",
            )
        return resp.text
    finally:
        os.unlink(tmp_path)


_TEXT_EXTRACTORS = {
    "txt": _extract_txt,
    "pdf": _extract_pdf,
    "docx": _extract_docx,
    "doc": _extract_doc,
}


async def extract_text(content: bytes, filename: str, llm_key: str = None) -> str:
    """Dispatch extraction by file extension. Returns raw extracted text."""
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    handler = _TEXT_EXTRACTORS.get(ext)
    if handler:
        return handler(content)

    if ext in AUDIO_EXTENSIONS:
        return await _extract_audio(content, ext, llm_key)

    raise UnsupportedFileType(f"Unsupported file type: .{ext}")
