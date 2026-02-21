"""
Schemes service – filter seed data + Tavily fallback.
"""
from __future__ import annotations
from typing import Optional
from app.models.schemas import Scheme
from app.utils.schemes_data import SCHEMES
from app.services.tavily_service import tavily_search, parse_tavily_results


def filter_schemes(
    role: Optional[str] = None,
    category: Optional[str] = None,
    district: Optional[str] = None,
    tenant_role: str = "general",
) -> list[Scheme]:
    results = SCHEMES

    # Apply role filter (merge tenant role + explicit role)
    effective_role = role or tenant_role
    if effective_role and effective_role != "general":
        results = [
            s for s in results
            if effective_role in s.roles or "general" in s.roles
        ]

    # Apply category filter
    if category and category != "all":
        results = [s for s in results if s.category == category]

    # Apply district filter (empty districts list = all districts)
    if district:
        results = [
            s for s in results
            if not s.districts or district.lower() in [d.lower() for d in s.districts]
        ]

    return results


async def get_schemes_with_fallback(
    role: Optional[str] = None,
    category: Optional[str] = None,
    district: Optional[str] = None,
    village: Optional[str] = None,
    tenant_role: str = "general",
) -> list[Scheme]:
    """Filter local data; no Tavily for schemes listing (seed data is sufficient)."""
    return filter_schemes(role=role, category=category, district=district, tenant_role=tenant_role)
