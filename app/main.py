"""
MahaSarthi Portal – FastAPI Application Entry Point
"""
from __future__ import annotations
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

from app.middleware.tenant import TenantMiddleware
from app.routes import schemes, village, jobs, search, chat

load_dotenv()

# ── Rate limiter ────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

# ── FastAPI app ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="MahaSarthi Portal API",
    description="महाराष्ट्र शासन योजना एकाच ठिकाणी – Centralized gateway for Maharashtra government schemes",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── Rate limit error handler ────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Tenant middleware ────────────────────────────────────────────────────────
app.add_middleware(TenantMiddleware)

# ── API Routes ───────────────────────────────────────────────────────────────
app.include_router(schemes.router)
app.include_router(village.router)
app.include_router(jobs.router)
app.include_router(search.router)
app.include_router(chat.router)

# ── Static files (frontend) ──────────────────────────────────────────────────
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.isdir(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/", include_in_schema=False)
async def root():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse({"message": "MahaSarthi Portal API Running", "docs": "/api/docs"})


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "MahaSarthi Portal", "version": "1.0.0"}
