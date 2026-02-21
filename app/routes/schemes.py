"""
GET /schemes – list and filter government schemes.
"""
from fastapi import APIRouter, Request, Query
from typing import Optional
from app.services.schemes_service import get_schemes_with_fallback
from app.models.schemas import SchemesResponse

router = APIRouter()


@router.get("/schemes", response_model=SchemesResponse, tags=["Schemes"])
async def list_schemes(
    request: Request,
    role: Optional[str] = Query(None, description="farmer | student | jobseeker | general"),
    category: Optional[str] = Query(None, description="farmer | student | job | village | general"),
    district: Optional[str] = Query(None, description="District name e.g. pune, nashik"),
    village: Optional[str] = Query(None, description="Village name"),
):
    tenant_role = getattr(request.state, "tenant_role", "general")
    tenant_id = getattr(request.state, "tenant_id", "general")

    schemes = await get_schemes_with_fallback(
        role=role,
        category=category,
        district=district,
        village=village,
        tenant_role=tenant_role,
    )

    return SchemesResponse(
        tenant=tenant_id,
        role=role or tenant_role,
        total=len(schemes),
        schemes=schemes,
    )
