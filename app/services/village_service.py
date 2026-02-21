"""
Village donation service – seed data + Tavily fallback.
"""
from __future__ import annotations
from app.utils.schemes_data import VILLAGE_DONATIONS
from app.services.tavily_service import tavily_search, parse_tavily_results


async def get_village_donations(village: str) -> dict:
    key = village.lower()
    if key in VILLAGE_DONATIONS:
        records = VILLAGE_DONATIONS[key]
        return {
            "village": village,
            "total_records": len(records),
            "records": [
                {**r, "source": "Local Database"}
                for r in records
            ],
        }

    # Fallback to Tavily real-time search
    query = f"Maharashtra village {village} government donation funds grant 2023 2024"
    raw = await tavily_search(query, max_results=5)
    results = parse_tavily_results(raw)
    answer = raw.get("answer", "")

    if results:
        records = []
        for i, r in enumerate(results[:5]):
            records.append({
                "year": "2023-24",
                "amount": "माहिती उपलब्ध नाही",
                "scheme": r["title"],
                "description": r["content"][:200],
                "source": r["url"],
            })
        return {
            "village": village,
            "total_records": len(records),
            "records": records,
            "tavily_answer": answer,
        }

    return {
        "village": village,
        "total_records": 0,
        "records": [],
        "message": f"'{village}' साठी डेटा उपलब्ध नाही.",
    }
