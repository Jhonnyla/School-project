# PPC — Agent Architecture Diagram

> Render this file in GitHub, VS Code (Markdown Preview), or any Mermaid-compatible viewer to see the diagram.

---

## System Overview

```mermaid
flowchart TD
    User(["👤 User\n(Browser — React)"])

    subgraph Frontend["Frontend  |  React 18 + Vite + Tailwind"]
        UI_Chat["Ask the Concierge\n(chat input)"]
        UI_Sync["Sync Inbox Button"]
        UI_Research["Research Policies Button"]
        UI_Pipeline["Pipeline Visualizer\n(step-by-step UI)"]
        UI_Claims["Active Claims View"]
        UI_Policy["Policy Database View"]
    end

    subgraph Backend["Backend  |  FastAPI (Python)"]

        subgraph Orchestrator["Orchestrator  —  POST /api/agent/ask"]
            O1["1. Intent Classifier\n(Groq · temp 0.1)\nOutputs: item_name, intent"]
        end

        subgraph Scout["Inbox Scout  —  no LLM"]
            S1["Keyword Receipt Lookup\n(pure Python)\nOutputs: retailer, purchase_date, item"]
        end

        subgraph Agent1["Agent 1 — Policy Research Agent\n(Tool-using Executor)"]
            A1a["Phase 1: Agentic Search Loop\n(Groq + web_search tool)\nUp to 3 iterations, 3 results each"]
            A1b["Phase 2: Structured Extraction\n(Groq · JSON mode)\nOutputs: policy JSON"]
            A1a --> A1b
        end

        subgraph Agent2["Agent 2 — Purchase Concierge Agent\n(Domain Expert / Explainer)"]
            A2["Synthesis  —  no tools\n(Groq · temp 0.7)\nOutputs: reasoning + response JSON"]
        end

        subgraph Claims["Claims Store"]
            C1["In-memory list\nPOST /api/claims\nGET  /api/claims"]
        end
    end

    subgraph External["External APIs"]
        Groq["Groq API\nLlama 3.3-70B Versatile"]
        Tavily["Tavily Search API\nLive web search"]
    end

    User -->|"Types question"| UI_Chat
    UI_Chat -->|"POST /api/agent/ask\n{ question }"| Orchestrator

    O1 -->|"Groq call — intent + item extraction"| Groq
    Groq -->|"{ item_name, intent }"| O1
    O1 --> Scout

    Scout -->|"{ retailer, purchase_date, item }"| Agent1

    A1a -->|"Groq function-calling —\ndecides what to search"| Groq
    Groq -->|"tool_call: web_search(query)"| A1a
    A1a -->|"Executes search query"| Tavily
    Tavily -->|"{ results: [title, url, content] }"| A1a
    A1a -->|"Injects results back as tool message"| Groq

    A1b -->|"Groq JSON-mode extraction call"| Groq
    Groq -->|"Structured policy JSON"| A1b

    Agent1 -->|"policy_research dict\n(conditions, window, sources, searches)"| Agent2

    A2 -->|"Groq JSON-mode synthesis call"| Groq
    Groq -->|"{ reasoning, response }"| A2

    Agent2 -->|"Full response + claim_context"| Orchestrator
    Orchestrator -->|"reasoning, response,\nsources, pipeline metadata,\nclaim_context"| UI_Pipeline

    UI_Pipeline --> UI_Chat
    UI_Pipeline -->|"If eligible"| UI_Claims

    UI_Sync -->|"POST /api/agents/inbox-scout"| Scout
    UI_Research -->|"POST /api/agents/research-policies\n(runs Agent 1 per retailer)"| Agent1
    Agent1 -->|"retailer_cards[]"| UI_Policy

    UI_Claims -->|"POST /api/claims"| Claims
    Claims -->|"claim object"| UI_Claims
```

---

## Fixed Pipeline — Step-by-Step

```mermaid
sequenceDiagram
    actor User
    participant Orch as Orchestrator
    participant Scout as Inbox Scout
    participant A1 as Agent 1<br/>Policy Research
    participant Tavily as Tavily API
    participant A2 as Agent 2<br/>Concierge
    participant Groq as Groq / Llama 3.3-70B

    User->>Orch: POST /api/agent/ask { question }

    Note over Orch,Groq: Step 1 — Intent Classification
    Orch->>Groq: classify intent + extract item name (temp 0.1)
    Groq-->>Orch: { item_name, intent }

    Note over Scout: Step 2 — Receipt Lookup (no LLM)
    Orch->>Scout: lookup(item_name)
    Scout-->>Orch: { retailer, purchase_date, item }

    Note over A1,Tavily: Step 3 — Policy Research (agentic loop, up to 3 iterations)
    Orch->>A1: research(retailer, product, membership, return_window)
    loop Agentic Search Loop
        A1->>Groq: tool-calling message
        Groq-->>A1: tool_call: web_search(query)
        A1->>Tavily: search(query, max_results=3)
        Tavily-->>A1: [{ title, url, content }]
        A1->>Groq: tool result message
    end
    A1->>Groq: extract structured JSON (JSON mode, no tools)
    Groq-->>A1: { return_window_days, conditions, sources, … }
    A1-->>Orch: policy_research dict

    Note over A2,Groq: Step 4 — Synthesis (no tools)
    Orch->>A2: synthesize(question, item, policy_research, intent)
    A2->>Groq: synthesis prompt (JSON mode, temp 0.7)
    Groq-->>A2: { reasoning, response }
    A2-->>Orch: concierge output

    Orch-->>User: { reasoning, response, sources, claim_context, pipeline }
```

---

## Data Schemas

```mermaid
erDiagram
    USER_PROFILE {
        string name
        string email
        string best_buy_tier "free | plus | total"
        string amazon_tier   "standard | prime"
    }

    PURCHASE {
        string id
        string productName
        float  price
        string retailer
        date   purchaseDate
        int    warrantyMonths
        int    returnWindowDays
        string membershipTier
    }

    POLICY_RESEARCH {
        string retailer
        string membership
        int    return_window_days
        string policy_summary
        string conditions
        string membership_benefit
        string warranty_summary
        string important_exclusions
        list   searches_made
        list   sources
    }

    CLAIM {
        string id           "PPC-YYYY-NNN"
        string item
        string retailer
        string status       "initiated | in_progress | closed"
        date   filedDate
        int    daysRemaining
        list   resources
    }

    CONCIERGE_RESPONSE {
        string reasoning
        string response
        list   sources
        object claim_context
        object pipeline
    }

    USER_PROFILE ||--o{ PURCHASE : "has purchases from"
    PURCHASE ||--|| POLICY_RESEARCH : "researched by Agent 1"
    POLICY_RESEARCH ||--|| CONCIERGE_RESPONSE : "synthesized by Agent 2"
    CONCIERGE_RESPONSE ||--o{ CLAIM : "may create"
    USER_PROFILE ||--o{ CLAIM : "owns"
```

---

## Agent Roles Summary

| Component | Type | LLM | Tool Access | Input | Output |
|---|---|---|---|---|---|
| **Orchestrator** | Controller | Groq (intent only) | None | User question | Directs pipeline |
| **Inbox Scout** | Data retrieval | None | None | Item name | Receipt data |
| **Agent 1 — Policy Research** | Tool-using Executor | Groq (× up to 4 calls) | `web_search` via Tavily | Retailer, product, membership | Structured policy JSON + sources |
| **Agent 2 — Purchase Concierge** | Domain Expert / Explainer | Groq (× 1 call) | None | Question + policy research | `reasoning` + `response` |
