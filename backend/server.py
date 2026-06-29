from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send
from pathlib import Path
import logging
import sys

# Add backend directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import routers
from routers import auth, challenges, answers, ai_tools, dashboard, users, prompts
from utils.database import client
from utils.indexes import ensure_indexes
from utils.prompt_store import seed_default_prompts
from utils.key_migration import encrypt_legacy_api_keys

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Register all routers
api_router.include_router(auth.router)
api_router.include_router(challenges.router)
api_router.include_router(answers.router)
api_router.include_router(ai_tools.router)
api_router.include_router(dashboard.router)
api_router.include_router(users.router)
api_router.include_router(prompts.router)

# Wire up the main API router
app.include_router(api_router)

# ==================== CORS MIDDLEWARE ====================

class CORSOriginReflectMiddleware:
    """Wraps the app and rewrites 'access-control-allow-origin: *' to the actual request origin."""
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Extract Origin header from request
        request_origin = None
        for header_name, header_value in scope.get("headers", []):
            if header_name == b"origin":
                request_origin = header_value.decode("latin-1")
                break

        async def send_wrapper(message):
            if message["type"] == "http.response.start" and request_origin:
                headers = list(message.get("headers", []))
                new_headers = []
                for name, value in headers:
                    if name == b"access-control-allow-origin" and value == b"*":
                        new_headers.append((name, request_origin.encode("latin-1")))
                    else:
                        new_headers.append((name, value))
                message["headers"] = new_headers
            await send(message)

        await self.app(scope, receive, send_wrapper)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["set-cookie"],
)
# This wraps CORSMiddleware — runs AFTER CORS sets headers, rewrites "*" to actual origin
app.add_middleware(CORSOriginReflectMiddleware)


# ==================== SECURITY HEADERS MIDDLEWARE ====================

class SecurityHeadersMiddleware:
    """Append modern security headers to every HTTP response.

    Headers:
      - Strict-Transport-Security: force HTTPS for 2 years incl. subdomains
      - X-Content-Type-Options: block MIME-sniffing
      - X-Frame-Options: SAMEORIGIN so Emergent preview iframe still works
      - Referrer-Policy: avoid leaking full URLs to 3rd parties
      - Permissions-Policy: lock down dangerous browser APIs we don't use
      - Cross-Origin-Opener-Policy: isolate browsing context (XS-Leak defense)
    NOTE: We intentionally do NOT set Content-Security-Policy here — the React
    app currently uses inline styles + data: URLs (avatars) + cross-origin
    images, and a misconfigured CSP would break the UI. CSP belongs on the
    frontend host (set in index.html / Emergent's edge config) once the policy
    is profiled.
    """
    HEADERS = {
        b"strict-transport-security": b"max-age=63072000; includeSubDomains; preload",
        b"x-content-type-options": b"nosniff",
        b"x-frame-options": b"SAMEORIGIN",
        b"referrer-policy": b"strict-origin-when-cross-origin",
        b"permissions-policy": b"camera=(), microphone=(), geolocation=(), payment=()",
        b"cross-origin-opener-policy": b"same-origin",
    }

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                existing = {h[0] for h in headers}
                for name, value in self.HEADERS.items():
                    if name not in existing:
                        headers.append((name, value))
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_wrapper)


app.add_middleware(SecurityHeadersMiddleware)


@app.on_event("startup")
async def startup_ensure_indexes():
    """Idempotent index creation — registry lives in utils/indexes.py (see /app/aboutindexes.md)."""
    await ensure_indexes()
    await seed_default_prompts()  # ensure every AI tool has an active system prompt
    await encrypt_legacy_api_keys()  # one-shot: encrypt any plaintext OpenAI keys at rest


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
