"""
Groq API service – LLM completions for AI chatbot.
"""
from __future__ import annotations
import os
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
DEFAULT_MODEL = "llama-3.3-70b-versatile"

_client: AsyncGroq | None = None


def get_groq_client() -> AsyncGroq:
    global _client
    if _client is None:
        _client = AsyncGroq(api_key=GROQ_API_KEY)
    return _client


SYSTEM_PROMPT_MR = """तुम्ही MahaSarthi Portal चे AI सहाय्यक आहात.
तुम्ही महाराष्ट्र शासनाच्या योजना, अनुदान, नोकऱ्या आणि गाव निधी याबाबत मदत करता.
नेहमी मराठीत उत्तर द्या. उत्तर स्पष्ट, संक्षिप्त आणि सहाय्यकारी असावे.
जर योजना आढळली, तर अधिकृत लिंक, पात्रता आणि लाभ सांगा.
कोणत्याही अशासकीय किंवा चुकीच्या माहितीपासून दूर राहा.
उत्तर 300-500 शब्दांत द्या."""

SYSTEM_PROMPT_EN = """You are the AI assistant for MahaSarthi Portal.
You help Maharashtra citizens with government schemes, subsidies, jobs, and village funds.
Always answer clearly, concisely, and helpfully.
If a scheme is found, mention official link, eligibility, and benefits.
Stay factual – only share verified government information.
Keep answers between 300-500 words."""


async def groq_chat(
    user_message: str,
    context: str = "",
    language: str = "mr",
    model: str = DEFAULT_MODEL,
) -> str:
    """
    Call Groq API with optional Tavily context injected.
    Returns generated text.
    """
    if not GROQ_API_KEY:
        return "Groq API key not configured." if language == "en" else "Groq API की कॉन्फिगर केलेली नाही."

    system_prompt = SYSTEM_PROMPT_MR if language == "mr" else SYSTEM_PROMPT_EN

    # Inject Tavily search context if available
    messages = []
    if context:
        context_msg = (
            f"खालील अधिकृत माहिती वापरा:\n{context}" if language == "mr"
            else f"Use the following official information:\n{context}"
        )
        messages.append({"role": "system", "content": context_msg})

    messages.append({"role": "user", "content": user_message})

    try:
        client = get_groq_client()
        completion = await client.chat.completions.create(
            model=model,
            messages=[{"role": "system", "content": system_prompt}] + messages,
            temperature=0.4,
            max_tokens=800,
        )
        return completion.choices[0].message.content or ""
    except Exception as e:
        err_msg = f"AI service error: {str(e)}"
        return err_msg if language == "en" else f"AI सेवा त्रुटी: {str(e)}"
