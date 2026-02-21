"""
MahaSarthi Portal – FastAPI Backend
Pydantic models / schemas
"""
from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field


# ──────────────── Scheme ────────────────

class Scheme(BaseModel):
    id: str
    name: str
    name_mr: str                   # Marathi name
    description: str
    description_mr: str
    eligibility: str
    eligibility_mr: str
    official_link: str
    category: str                  # farmer | student | job | village | general
    roles: List[str] = []
    districts: List[str] = []      # empty = all districts
    tags: List[str] = []
    last_updated: Optional[str] = None


class SchemesResponse(BaseModel):
    tenant: str
    role: Optional[str]
    total: int
    schemes: List[Scheme]


# ──────────────── Jobs ────────────────

class Job(BaseModel):
    title: str
    department: str
    link: str
    deadline: Optional[str] = None
    district: Optional[str] = None
    source: str = "mahajobs.maharashtra.gov.in"


class JobsResponse(BaseModel):
    total: int
    jobs: List[Job]
    source_query: str


# ──────────────── Village Donations ────────────────

class VillageDonationRecord(BaseModel):
    year: str
    amount: str
    scheme: str
    description: str
    source: str = "Static"


class VillageDonationResponse(BaseModel):
    village: str
    total_records: int
    records: List[VillageDonationRecord]


# ──────────────── Search ────────────────

class SearchResult(BaseModel):
    title: str
    url: str
    content: str
    score: Optional[float] = None


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    answer: Optional[str] = None


# ──────────────── Chat ────────────────

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    language: str = Field(default="mr")   # mr = Marathi, en = English
    tenant: Optional[str] = None
    role: Optional[str] = None
    district: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    language: str
    sources: List[SearchResult] = []
    schemes_mentioned: List[str] = []


# ──────────────── Eligibility Checker ────────────────

class EligibilityRequest(BaseModel):
    role: str                     # farmer | student | jobseeker
    income_range: str             # e.g. "0-1L", "1L-3L", "3L-5L", "5L+"
    district: str
    language: str = "mr"


class EligibilityResponse(BaseModel):
    suggested_schemes: List[Scheme]
    ai_explanation: str
    language: str
