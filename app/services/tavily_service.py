"""
Tavily API service – restricted to official Maharashtra government domains.
"""
from __future__ import annotations
import os
import httpx
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
TAVILY_URL = "https://api.tavily.com/search"

OFFICIAL_DOMAINS = [
    "maharashtra.gov.in",
    "mahadbt.maharashtra.gov.in",
    "krishi.maharashtra.gov.in",
    "mahajobs.maharashtra.gov.in",
    "aaplesarkar.mahaonline.gov.in",
    "mahaonline.gov.in",
    "jeevandayee.gov.in",
    "pmkisan.gov.in",
    "pmfby.gov.in",
    "pmgsy.nic.in",
    "jaljeevanmission.gov.in",
    "pmsvanidhi.mohua.gov.in",
    "scholarships.gov.in",
    "msdc.co.in",
    "mavim.maharashtra.gov.in",
    "mahapolice.gov.in",
]


async def tavily_search(
    query: str,
    domains: Optional[list[str]] = None,
    max_results: int = 5,
) -> dict:
    """
    Async Tavily search restricted to official government domains.
    Returns raw Tavily response dict.
    """
    if not TAVILY_API_KEY:
        return {"results": [], "answer": "Tavily API key not configured."}

    search_domains = domains or OFFICIAL_DOMAINS

    payload = {
        "api_key": TAVILY_API_KEY,
        "query": query,
        "search_depth": "advanced",
        "include_answer": True,
        "include_domains": search_domains,
        "max_results": max_results,
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(TAVILY_URL, json=payload)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        return {"results": [], "answer": f"Search error: {e.response.status_code}"}
    except Exception as e:
        return {"results": [], "answer": f"Search unavailable: {str(e)}"}


def parse_tavily_results(raw: dict) -> list[dict]:
    """Extract clean list of results from Tavily response."""
    results = []
    for item in raw.get("results", []):
        results.append({
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "content": item.get("content", "")[:800],
            "score": item.get("score"),
        })
    return results
