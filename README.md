# Post-Purchase Concierge (PPC) — Front-end

A modern React + Tailwind CSS front-end for the **Post-Purchase Concierge** agentic AI system: track warranties and return windows from Gmail receipts, research retailer policies, and manage a purchase log.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 18 |
| **Build** | Vite 5 |
| **Styling** | Tailwind CSS 3 |
| **State** | React `useState` / `useCallback` (ready to plug in Redux or React Query when backend is connected) |

The UI is structured so you can later connect a **Python/FastAPI** backend: API proxy is configured in `vite.config.js` (`/api` → `http://localhost:8000`), and components use placeholder handlers that can be replaced with `fetch` calls to your agents.

---

## Features

- **Dashboard**
  - **Recent Purchases** table: Product name, price, retailer, purchase date.
  - **Warranty / Return Status** column: status badges (“X days left to return”, “Return window ended”) and visual countdown bars (Emerald = active, Amber = expiring soon, Slate = expired).
- **Ask the Concierge**
  - Text input for natural-language questions (e.g. “My TV has a dead pixel, am I still covered?”).
  - Display of the agent’s **reasoning** and **response**, plus **source URLs** when the agent researches a policy.
- **Key actions**
  - **Sync Inbox** — trigger Inbox Scout agent.
  - **Check Return Eligibility** — trigger Policy Researcher.
  - **Add to Calendar** — trigger Scheduler.
- **Sidebar**
  - Links: **Purchases**, **Active Claims**, **Settings**, **Policy Database** (Purchases is the main dashboard; other pages are placeholders).

---

## Design (FinTech-style)

- **Colors**: Deep Navy (`navy-900` sidebar, navy accents), Slate Gray (backgrounds/text), **Emerald** for “Active” status, **Amber** for “Expiring soon”.
- **Layout**: Fixed sidebar + scrollable main content; responsive and readable for non-technical users.
- **Accessibility**: Focus styles, `aria-label`s, semantic headings, and a visible focus ring for keyboard users.

---

## Screenshots

*(Add 1–2 screenshots of the UI here for your deliverable.)*

| Screenshot | Description |
|------------|-------------|
| `docs/Dashboard.png` | Dashboard: Recent Purchases table + warranty status + action buttons. |
| `docs/Agent response.png` | Ask the Concierge: sample question, reasoning, response, and source links. |

*(After running the app, capture the dashboard and the agent Q&A panel and save them in a `docs/` folder or paste into this README.)*

---

## Getting Started
### Prerequisites

- **Node.js (v18 or higher) and npm**: Required to run the React front-end. 
  - **Download:** You can download the LTS version directly from the [official Node.js website](https://nodejs.org/). (Note: npm is automatically installed alongside Node.js).
  - **Verify Installation:** After installing, open your terminal and run `node -v` and `npm -v` to confirm they are installed correctly.
### Prerequisites

- Node.js 18+ and npm (or yarn/pnpm).

### Install and run

```bash
cd ppc-frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The app loads **mock data** (e.g. Samsung 65" TV, Canon EOS R50) so the dashboard and agent reply appear populated without a backend.

### Build for production

```bash
npm run build
npm run preview   # optional: preview production build
```

---

## Project structure

```
ppc-frontend/
├── index.html
├── package.json
├── vite.config.js          # API proxy: /api → backend
├── tailwind.config.js      # Navy, slate, emerald, amber theme
├── postcss.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx             # Layout, routing, state
│   ├── index.css           # Tailwind imports
│   ├── data/
│   │   └── mockPurchases.js   # Mock purchases + sample agent response
│   └── components/
│       ├── Sidebar.jsx         # Nav: Purchases, Active Claims, Settings, Policy Database
│       ├── PurchasesTable.jsx  # Recent purchases + warranty column
│       ├── WarrantyStatus.jsx  # Badge + countdown bar
│       ├── AgentInteraction.jsx # Question input + reasoning/response/sources
│       └── ActionButtons.jsx   # Sync Inbox, Check Return, Add to Calendar
└── README.md
```

---

## Connecting your backend

1. **Agent Q&A**  
   In `App.jsx`, replace the `setTimeout` in `handleAskAgent` with a `fetch` to your FastAPI endpoint (e.g. `POST /api/agent/ask` with `{ question }`). Use the same response shape: `reasoning`, `response`, `sources` (array of `{ label, url }`).

2. **Purchases**  
   Replace `mockPurchases` with a `fetch` to your purchases API and pass the result into `<PurchasesTable purchases={…} />`.

3. **Actions**  
   In `ActionButtons.jsx` (or in `App.jsx` handlers), call your agent endpoints:
   - Sync Inbox → e.g. `POST /api/agents/inbox-scout`
   - Check Return → e.g. `POST /api/agents/policy-researcher` or open an eligibility flow
   - Add to Calendar → e.g. `POST /api/agents/scheduler`

---

## Milestone I — Deliverables

- [x] Web UI (React + Tailwind) to submit tasks and view agent responses.
- [x] Functional and clearly structured; usable by a non-technical user.
- [x] Short description (README) with tech stack and screenshot placeholders.
- [x] Code for the front-end in the repo (`ppc-frontend/`).

Screenshots to complete the deliverable are included in the compressed zipped file.
