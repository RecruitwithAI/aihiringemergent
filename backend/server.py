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
from routers import auth, challenges, answers, ai_tools, dashboard
from utils.database import client

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


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
