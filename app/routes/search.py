"""
GET /search?q= – real-time search via Tavily across official Maharashtra portals.
"""
from fastapi import APIRouter, Query, HTTPException
from app.services.tavily_service import tavily_search, parse_tavily_results
from app.utils.input_validator import sanitize_query

router = APIRouter()


@router.get("/search", tags=["Search"])
async def search(
    q: str = Query(..., min_length=2, max_length=300, description="Search query"),
):
    clean_q = sanitize_query(q)
    if not clean_q:
        raise HTTPException(status_code=400, detail="Invalid query")

    raw = await tavily_search(clean_q, max_results=8)
    results = parse_tavily_results(raw)
    answer = raw.get("answer", "")

    return {
        "query": clean_q,
        "results": results,
        "answer": answer,
        "total": len(results),
    }
