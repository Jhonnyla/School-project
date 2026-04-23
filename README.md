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

## Prerequisites

Before running locally you will need:

- **Node.js 18+** — download at [nodejs.org](https://nodejs.org)
- **Python 3.11+** — download at [python.org](https://python.org)
- **pip** — comes with Python 3.11+
- **A Google Gemini API key** — free at [aistudio.google.com](https://aistudio.google.com) → Get API Key
- **A Tavily API key** — free tier at [tavily.com](https://app.tavily.com) → sign up → copy API key

---

## Local Setup — Step by Step

### Step 1 — Clone or download the repository

```bash
git clone https://github.com/Jhonnyla/School-project.git
cd School-project
```

Or download the ZIP from GitHub and unzip it.

### Step 2 — Set up the backend

```bash
cd code/backend
pip install -r requirements.txt
```

Create a file called `.env` inside the `code/backend/` folder with your API keys:

```
GEMINI_API_KEY=your_gemini_key_here
TAVILY_API_KEY=your_tavily_key_here
```

> **Note:** Never commit this file. It is already listed in `.gitignore`.

Start the backend server:

```bash
cd code/backend
python3 -m uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

### Step 3 — Set up the frontend

Open a **second terminal window** and run:

```bash
cd code/frontend
npm install
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### Step 4 — Open the app

Open your browser and go to:

```
http://localhost:5173
```

The frontend proxies all `/api` requests to the backend on port 8000 automatically via `vite.config.js`.

---

## Running the Demo

1. **Upload a receipt** — click "Upload Receipt" on the Dashboard, select an image or PDF of any retail receipt
2. Wait ~15 seconds — Agent 1 reads the receipt and Agent 2 fetches the retailer's live policy
3. **Policy Database** — click "Policy Database" in the sidebar to see return window, conditions, warranty, and source link
4. **Ask Concierge** — click the "Ask Concierge" button on any purchase row, then type a natural language question (e.g. *"Can I return this if I opened the box?"*)
5. **Start Claim** — click "Start Claim" to log a claim to Active Claims

---

## Project Structure

```
School-project/
├── code/
│   ├── backend/
│   │   ├── main.py              # All three agents, endpoints, Gemini + Tavily calls
│   │   ├── requirements.txt     # Python dependencies
│   │   └── .env                 # GEMINI_API_KEY + TAVILY_API_KEY (not committed)
│   └── frontend/
│       ├── src/
│       │   ├── App.jsx                        # State, routing, action handlers
│       │   └── components/
│       │       ├── ReceiptUpload.jsx          # Upload UI + Vision trigger
│       │       ├── AgentInteraction.jsx       # Chat thread + concierge UI
│       │       ├── PurchasesTable.jsx         # Purchases + Ask Concierge per row
│       │       ├── PolicyDatabase.jsx         # Policy cards with source links
│       │       ├── ActiveClaims.jsx           # Claim history
│       │       ├── Settings.jsx               # Profile + notification preferences
│       │       ├── ActionButtons.jsx
│       │       ├── Sidebar.jsx
│       │       └── WarrantyStatus.jsx
│       ├── vite.config.js                     # API proxy /api → localhost:8000
│       └── package.json
├── docs/                                      # Architecture diagrams and reports
└── README.md
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `GEMINI_API_KEY not set` | Make sure `code/backend/.env` exists with your key |
| Backend won't start | Run `cd code/backend` first, then `python3 -m uvicorn main:app --port 8000` |
| Frontend blank page | Make sure backend is running on port 8000 before starting frontend |
| Upload spins forever | Backend is down — restart it |
| 503 from Gemini | Retry — the system has a 3-model fallback chain that handles this automatically |
| Policy Database empty after upload | Tavily hit a rate limit — wait 10 seconds and upload again |

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

### Agent 2 — Policy Research Agent

| Property | Detail |
|----------|--------|
| **Role** | Tool-using Policy Fetcher |
| **Model** | Gemini 2.5 Flash (function calling) |
| **Tool** | `web_search` via Tavily Search API |
| **Input** | Retailer name extracted by Agent 1 |
| **Output** | Return window (days), conditions, warranty summary, policy URL |
| **Trigger** | Runs automatically after every successful upload |

### Agent 3 — Purchase Concierge Agent

| Property | Detail |
|----------|--------|
| **Role** | Domain Expert / Q&A |
| **Model** | Gemini 2.5 Flash |
| **Tools** | None — reasoning only |
| **Input** | User question + purchase context + researched policy + chat history |
| **Output** | Plain English answer with source link |

---

## Security

| Concern | Mitigation |
|---------|------------|
| Prompt injection via receipt | Explicit `SECURITY RULE` in all system prompts |
| API abuse | SlowAPI rate limiting (30/min upload, 60/min ask) |
| CORS | Restricted to `localhost:5173` only |
| Input validation | Pydantic models with `min_length` / `max_length` on all fields |
| Model overload (503) | 2-pass retry with 3-model fallback chain + 3s sleep between passes |

---

## Production Roadmap

| Item | Description |
|------|-------------|
| **SQLite Policy Library** | Curated database of major retailer policies updated on a nightly schedule. Live search becomes fallback only for unknown retailers. |
| **Browser Extension** | Detect purchases at checkout — auto-log receipt, trigger pipeline without manual upload |
| **Retailer Portal Integration** | "Start Claim" triggers the retailer's return portal pre-filled with order number and reason |
| **Structured Policy Data** | Pre-cleaned, normalized policy data improves Concierge answer accuracy |

---

## Known Limitations

- Policy data quality depends on how well-structured the retailer's policy page is
- In-memory storage resets on backend restart — no persistence between sessions
- Claim execution is a logging placeholder only — no retailer portal integration
- Concierge answer quality is conditional on Agent 2's extraction quality
