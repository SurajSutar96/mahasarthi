# 🌿 MahaSarthi Portal

> **महाराष्ट्र शासन योजना एकाच ठिकाणी** — Centralized digital gateway for Maharashtra government schemes

A production-ready multi-tenant web application for Maharashtra citizens, featuring AI-powered chatbot (Groq + Tavily), real-time search for government schemes, job listings, village fund data, and multilingual (Marathi/English) support.

---

## 🚀 Quick Start

### 1. Clone & setup

```bash
cd C:\Users\hp\Desktop\MahaSarthiPortal

# Virtual environment (already created)
venv\Scripts\activate

# Install dependencies (already installed)
pip install -r requirements.txt
```

### 2. Configure environment

The `.env` file contains your API keys. Template is in `.env.example`:

```
TAVILY_API_KEY=your_key
GROQ_API_KEY=your_key
```

### 3. Run the server

```bash
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

Open: **http://localhost:8000**

---

## 📁 Project Structure

```
MahaSarthiPortal/
├── app/
│   ├── main.py                  # FastAPI entry point
│   ├── middleware/
│   │   └── tenant.py            # Multi-tenancy middleware
│   ├── models/
│   │   └── schemas.py           # Pydantic models
│   ├── routes/
│   │   ├── schemes.py           # GET /schemes
│   │   ├── village.py           # GET /village-donations/{village}
│   │   ├── jobs.py              # GET /jobs
│   │   ├── search.py            # GET /search?q=
│   │   └── chat.py              # POST /chat & POST /eligibility
│   ├── services/
│   │   ├── tavily_service.py    # Tavily API integration
│   │   ├── groq_service.py      # Groq LLM integration
│   │   ├── schemes_service.py   # Scheme filtering logic
│   │   ├── village_service.py   # Village donation data
│   │   └── jobs_service.py      # Government job listings
│   └── utils/
│       ├── schemes_data.py      # 18+ seed schemes + village data
│       └── input_validator.py   # Input sanitization
├── static/
│   ├── index.html               # Main frontend page
│   ├── style.css                # Complete styling (Poppins, animations)
│   ├── app.js                   # Vanilla JS frontend logic
│   ├── sw.js                    # Service worker (offline cache)
│   └── manifest.json            # PWA manifest
├── .env                         # API keys (do not commit)
├── .env.example                 # Template
├── requirements.txt
└── README.md
```

---

## 🌐 API Endpoints

| Endpoint                       | Method | Description                                      |
| ------------------------------ | ------ | ------------------------------------------------ |
| `/schemes`                     | GET    | List schemes (filters: role, category, district) |
| `/village-donations/{village}` | GET    | Year-wise donations for a village                |
| `/jobs`                        | GET    | Real-time Maharashtra govt job listings          |
| `/search?q=`                   | GET    | Tavily web search on govt portals                |
| `/chat`                        | POST   | AI chatbot (Groq + Tavily, Marathi default)      |
| `/eligibility`                 | POST   | AI eligibility checker                           |
| `/health`                      | GET    | Health check                                     |
| `/api/docs`                    | GET    | Swagger UI                                       |

---

## 🎯 Multi-Tenancy (No Login Required)

Access tenant-specific views via URL:

- `http://localhost:8000?role=farmer` — Farmer schemes only
- `http://localhost:8000?role=student` — Student scholarships
- `http://localhost:8000?tenant=pune-haveli` — Custom tenant badge
- `http://localhost:8000?role=jobseeker&district=pune` — Jobs in Pune

---

## 🤖 AI Chatbot

The chatbot uses a **Tavily → Groq** pipeline:

1. User asks a question
2. Backend searches official Maharashtra govt portals via Tavily
3. Results injected as context into Groq LLaMA 3.3 70B prompt
4. Answer returned in Marathi (configurable)

**Rate limit:** 10 messages/minute per IP

---

## ✨ Features

- 🌾 **Schemes**: Shetkari Yojna, Karjamaphi, Pik Vima, Anudaan, Namo Shetkari, and more
- 🎓 **Students**: MahaDBT, Swadhar Gruh, Rajyasar, Eklavya scholarships
- 💼 **Jobs**: Real-time Maharashtra govt vacancies via Tavily
- 🏘️ **Village Funds**: Year-wise donation records + Tavily fallback
- 🤖 **AI Chat**: Marathi-first chatbot with Groq + Tavily
- ⚖️ **Comparison**: Side-by-side scheme comparison tool
- 🌐 **Bilingual**: Marathi / English toggle
- 📱 **PWA**: Offline mode with service worker

---

## 🔒 Security

- API keys loaded via `.env` (never hardcoded)
- Rate limiting on chat endpoint (SlowAPI)
- Input sanitization + prompt injection prevention
- HTML escaping in all frontend rendering
