"""
POST /chat – AI chatbot: Tavily search + Groq LLM → Marathi answer.
Rate limited to 10 requests/minute.
"""
from fastapi import APIRouter, Request, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.models.schemas import ChatRequest, ChatResponse
from app.services.tavily_service import tavily_search, parse_tavily_results
from app.services.groq_service import groq_chat
from app.utils.input_validator import validate_chat_message, sanitize_query

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/chat", response_model=ChatResponse, tags=["Chat"])
@limiter.limit("10/minute")
async def chat(
    request: Request,
    body: ChatRequest,
):
    # ── Validate input ─────────────────────────────────────────────────────
    is_valid, result = validate_chat_message(body.message)
    if not is_valid:
        raise HTTPException(status_code=400, detail=result)

    clean_msg = result
    language = body.language or "mr"

    # ── Tavily search ──────────────────────────────────────────────────────
    search_query = clean_msg
    if language == "mr":
        # Translate common Marathi terms for better search
        search_query = clean_msg.replace("योजना", "scheme").replace("शेतकरी", "farmer").replace("नोकरी", "job vacancy")

    raw = await tavily_search(search_query + " Maharashtra government scheme 2024", max_results=5)
    search_results = parse_tavily_results(raw)
    tavily_answer = raw.get("answer", "")

    # ── Build context from Tavily results ──────────────────────────────────
    context_parts = []
    if tavily_answer:
        context_parts.append(f"Web Search Answer: {tavily_answer}")
    for r in search_results[:3]:
        context_parts.append(f"Source: {r['url']}\n{r['content']}")
    context = "\n\n".join(context_parts)

    # ── Groq LLM call ──────────────────────────────────────────────────────
    answer = await groq_chat(
        user_message=clean_msg,
        context=context,
        language=language,
    )

    # ── Extract mentioned schemes ──────────────────────────────────────────
    from app.utils.schemes_data import SCHEMES
    mentioned = [s.name_mr for s in SCHEMES if s.name_mr.lower() in answer.lower() or s.name.lower() in answer.lower()]

    return ChatResponse(
        answer=answer,
        language=language,
        sources=[
            {"title": r["title"], "url": r["url"], "content": r["content"][:200]}
            for r in search_results[:3]
        ],
        schemes_mentioned=mentioned[:5],
    )


@router.post("/eligibility", tags=["Chat"])
@limiter.limit("10/minute")
async def check_eligibility(
    request: Request,
    body: dict,
):
    """AI eligibility checker – suggest schemes based on user profile."""
    role = sanitize_query(body.get("role", ""), 50)
    income = sanitize_query(body.get("income_range", ""), 50)
    district = sanitize_query(body.get("district", ""), 100)
    language = body.get("language", "mr")

    query = f"Maharashtra government schemes for {role} income {income} district {district}"
    raw = await tavily_search(query, max_results=4)
    context_parts = [raw.get("answer", "")]
    for r in parse_tavily_results(raw)[:3]:
        context_parts.append(f"{r['url']}: {r['content']}")

    if language == "mr":
        msg = f"मी एक {role} आहे. माझे वार्षिक उत्पन्न {income} आहे. मी {district} जिल्ह्यात राहतो. मला कोणत्या योजना मिळू शकतात?"
    else:
        msg = f"I am a {role} with annual income {income} from {district} district. Which government schemes am I eligible for?"

    answer = await groq_chat(user_message=msg, context="\n\n".join(context_parts), language=language)

    # Filter local schemes
    from app.services.schemes_service import filter_schemes
    local_schemes = filter_schemes(role=role, tenant_role=role)

    return {
        "ai_explanation": answer,
        "suggested_schemes": [s.dict() for s in local_schemes[:5]],
        "language": language,
    }
