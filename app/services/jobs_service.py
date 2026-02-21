"""
Jobs service – real-time via Tavily from mahajobs.maharashtra.gov.in
"""
from __future__ import annotations
from app.services.tavily_service import tavily_search, parse_tavily_results

JOB_DOMAINS = [
    "mahajobs.maharashtra.gov.in",
    "mahaonline.gov.in",
    "maharashtra.gov.in",
    "mpsc.gov.in",
]


async def get_government_jobs(district: str = "") -> dict:
    query = "Maharashtra government job vacancy recruitment 2024 2025"
    if district:
        query += f" {district} district"

    raw = await tavily_search(query, domains=JOB_DOMAINS, max_results=8)
    results = parse_tavily_results(raw)
    answer = raw.get("answer", "")

    jobs = []
    for r in results:
        jobs.append({
            "title": r["title"],
            "department": r["url"].split("/")[2] if "/" in r["url"] else "महाराष्ट्र शासन",
            "link": r["url"],
            "deadline": None,
            "district": district or "All Maharashtra",
            "source": r["url"],
            "description": r["content"][:300],
        })

    return {
        "total": len(jobs),
        "jobs": jobs,
        "source_query": query,
        "tavily_answer": answer,
    }
