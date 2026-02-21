"""
GET /jobs – real-time Maharashtra government job vacancies.
"""
from fastapi import APIRouter, Query
from typing import Optional
from app.services.jobs_service import get_government_jobs

router = APIRouter()


@router.get("/jobs", tags=["Jobs"])
async def government_jobs(
    district: Optional[str] = Query(None, description="Filter by district"),
):
    return await get_government_jobs(district=district or "")
