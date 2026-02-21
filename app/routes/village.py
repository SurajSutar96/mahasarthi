"""
GET /village-donations/{village} – year-wise donation records.
"""
from fastapi import APIRouter, Path
from app.services.village_service import get_village_donations

router = APIRouter()


@router.get("/village-donations/{village}", tags=["Village"])
async def village_donations(
    village: str = Path(..., description="Village name e.g. nashik, pune, aurangabad"),
):
    return await get_village_donations(village)
