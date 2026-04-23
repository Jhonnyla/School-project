# Post-Purchase Concierge (PPC)

A full-stack agentic AI system that reads purchase receipts using computer vision, automatically researches live retailer return and warranty policies, tracks return windows in real time, and answers natural language eligibility questions — all powered by a three-agent pipeline running on Google Gemini.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + Vite 5 |
| **Styling** | Tailwind CSS 3 |
| **Backend** | Python 3.13 + FastAPI |
| **Vision / LLM** | Google Gemini 2.5 Flash (multimodal) |
| **Web Search** | Tavily Search API |
| **Rate Limiting** | SlowAPI |
| **Agent Coordination** | Fixed pipeline — Vision → Policy Research → Concierge |

---

## Architecture — Three Agents

```
User uploads receipt (image or PDF)
          │
          ▼
  Agent 1 — Gemini Vision
  Reads any receipt format
  Extracts: product, retailer, date, price, order #
          │
          ▼
  Agent 2 — Policy Research Agent
  Tavily searches retailer's live policy page
  Gemini extracts: return window, conditions,
  warranty summary, policy URL
  → Saved to Policy Database
          │
          ▼
  Dashboard — purchase tracked, window counting down
          │
          ▼
  User clicks "Ask Concierge" on a purchase row
          │
          ▼
  Agent 3 — Concierge Agent
  Loads purchase context + researched policy
  Answers natural language questions in plain English
  with source link
          │
          ▼
  User clicks "Start Claim" → logged to Active Claims
```

---

## Agent Details

### Agent 1 — Gemini Vision

| Property | Detail |
|----------|--------|
| **Role** | Receipt Reader |
| **Model** | Gemini 2.5 Flash (multimodal) |
| **Input** | Receipt image or PDF (any format, any retailer) |
| **Output** | Structured JSON: product, retailer, date, price, order # |
| **Fallback** | 2-pass retry across 3 Gemini model variants on 503 |

Reads receipts as raw image bytes — no OCR template required. Handles printed receipts, email screenshots, and PDFs from any retailer. Injects today's date into the prompt to correctly handle receipts without an explicit year.

### Agent 2 — Policy Research Agent

| Property | Detail |
|----------|--------|
| **Role** | Tool-using Policy Fetcher |
| **Model** | Gemini 2.5 Flash (function calling) |
| **Tool** | `web_search` via Tavily Search API |
| **Input** | Retailer name extracted by Agent 1 |
| **Output** | Return window (days), conditions, warranty summary, policy URL |
| **Trigger** | Runs automatically after every successful upload |

Runs up to 4 live Tavily searches per retailer, extracts structured policy data from the retailer's actual policy page, and saves it to the in-memory Policy Database keyed by retailer. If the policy page is unreachable, returns sensible defaults rather than crashing.

### Agent 3 — Purchase Concierge Agent

| Property | Detail |
|----------|--------|
| **Role** | Domain Expert / Q&A |
| **Model** | Gemini 2.5 Flash |
| **Tools** | None — reasoning only |
| **Input** | User question + purchase context + researched policy + chat history |
| **Output** | Plain English answer with source link and claim CTA |

Pre-loaded with the exact purchase the user clicked "Ask Concierge" on — no guessing. Maintains conversation history (last 6 messages) for context. If asked about a brand with no recorded purchase, searches the brand's policy and answers with a clear disclaimer.

---

## Features

- **Receipt Upload** — drag and drop or click to upload; Gemini Vision reads it instantly
- **Automatic Policy Research** — triggers immediately after upload, no manual button
- **Policy Database** — cards with return window, conditions, warranty, and a direct link to the retailer's policy page
- **Return Window Tracking** — days remaining calculated in real time on every load
- **Ask Concierge per row** — click the button on any purchase to pre-load its context into the chat
- **Chat History** — conversation memory across multiple questions in a session
- **Start Claim** — logs claims to Active Claims with purchase details
- **Brand-only fallback** — if no purchase found, live-searches the brand's policy and answers with disclaimer

---

## Security

| Concern | Mitigation |
|---------|------------|
| Prompt injection via receipt | Explicit `SECURITY RULE` in all system prompts |
| API abuse | SlowAPI rate limiting (30/min upload, 60/min ask) |
| CORS | Restricted to `localhost:5173` only |
| Input validation | Pydantic models with `min_length` / `max_length` on all request fields |
| Model overload (503) | 2-pass retry with 3-model fallback chain + 3s sleep between passes |

---

## Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **Python 3.11+** and pip
- A **Google Gemini API key** — free at [aistudio.google.com](https://aistudio.google.com)
- A **Tavily API key** — free tier at [tavily.com](https://tavily.com)

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:
```
GEMINI_API_KEY=your_gemini_key_here
TAVILY_API_KEY=your_tavily_key_here
```

Start the server:
```bash
cd backend
python3 -m uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Demo Flow

1. **Upload a receipt** (image or PDF) → Gemini Vision reads it → purchase appears in the table
2. **Policy Database** populates automatically — return window, conditions, warranty, source link
3. Click **Ask Concierge** on any purchase row → type a natural language question (e.g. *"Can I return this if I opened the box?"*)
4. View the plain English answer with a link to the retailer's policy page
5. Click **Start Claim** → logged to Active Claims

---

## Project Structure

```
PPC/
├── backend/
│   ├── main.py              # All three agents, endpoints, Gemini + Tavily calls
│   ├── requirements.txt
│   └── .env                 # GEMINI_API_KEY + TAVILY_API_KEY (not committed)
├── frontend/
│   ├── src/
│   │   ├── App.jsx                        # State, routing, action handlers
│   │   └── components/
│   │       ├── ReceiptUpload.jsx          # Upload UI + Vision trigger
│   │       ├── AgentInteraction.jsx       # Chat thread + concierge UI
│   │       ├── PurchasesTable.jsx         # Purchases + Ask Concierge button per row
│   │       ├── PolicyDatabase.jsx         # Policy cards with source links
│   │       ├── ActiveClaims.jsx           # Claim history
│   │       ├── Settings.jsx               # Profile + notification preferences
│   │       ├── ActionButtons.jsx
│   │       ├── Sidebar.jsx
│   │       └── WarrantyStatus.jsx
│   ├── vite.config.js                     # API proxy /api → localhost:8000
│   └── package.json
└── README.md
```

---

## Production Roadmap

| Item | Description |
|------|-------------|
| **SQLite Policy Library** | Replace live scraping with a curated database of major retailer policies, updated on a nightly schedule. Live Tavily search becomes fallback for unknown retailers only. |
| **Browser Extension** | Detect purchases at checkout in real time — auto-log receipt, trigger pipeline without manual upload |
| **Retailer Portal Integration** | "Start Claim" triggers the retailer's actual return portal, pre-filled with order number and reason |
| **Structured Policy Data** | Pre-cleaned, normalized policy data per retailer improves Concierge answer accuracy and consistency |

---

## Known Limitations (Demo)

- Policy data quality depends on how well-structured the retailer's policy page is — messy pages produce less precise answers
- In-memory storage resets on backend restart — no persistence between sessions
- Claim execution is a logging placeholder — no retailer portal integration yet
- Concierge answer quality is conditional on Agent 2's extraction quality (output chains)
