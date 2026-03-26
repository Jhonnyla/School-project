import os
import re
import json
from datetime import date, timedelta

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq

# ---------------------------------------------------------------------------
# Bootstrap — Groq client is created lazily so the server starts even
# without a key (the 3 non-chat endpoints work either way).
# ---------------------------------------------------------------------------

load_dotenv()

_api_key = os.getenv("GROQ_API_KEY")
_client: Groq | None = None

def _get_client() -> Groq:
    global _client
    if _client is None:
        if not _api_key:
            raise HTTPException(
                status_code=503,
                detail="GROQ_API_KEY is not set. Add it to your .env file to enable the chat endpoint.",
            )
        _client = Groq(api_key=_api_key)
    return _client

def _llm_generate(prompt: str, temperature: float = 0.2) -> str:
    """
    Call Llama 3.3 via Groq.
    Use low temperature (0.1-0.2) for structured extraction tasks.
    Use higher temperature (0.7) for synthesis / natural-language answers.
    """
    client = _get_client()
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=temperature,
    )
    return completion.choices[0].message.content

app = FastAPI(title="Post-Purchase Concierge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# User profile — membership tiers drive return-window calculations.
# ---------------------------------------------------------------------------

USER_PROFILE = {
    "name": "Jhonatan Lopez",
    "email": "jhonatan@gmail.com",
    "memberships": {
        # Best Buy tiers: "standard" (15d) | "plus" (30d) | "total" (45d)
        "best_buy": "plus",
        # Amazon: "standard" | "prime" — both 30d, Prime just easier process
        "amazon": "prime",
        # Oura: "standard" | "member" — both 30d
        "oura": "member",
    },
}

# ---------------------------------------------------------------------------
# Real return-window rules per retailer × membership tier
# ---------------------------------------------------------------------------

RETAILER_POLICIES = {
    "best_buy": {
        "label": "Best Buy Return & Exchange Policy",
        "url": "https://www.bestbuy.com/site/help-topics/return-exchange-policy/pcmcat260800050014.c",
        "tiers": {
            "standard": {"days": 15, "label": "Standard Member"},
            "plus":     {"days": 30, "label": "My Best Buy Plus"},
            "total":    {"days": 45, "label": "My Best Buy Total"},
        },
        "default_tier": "standard",
    },
    "amazon": {
        "label": "Amazon Return Policy",
        "url": "https://www.amazon.com/gp/help/customer/display.html?nodeId=GKM69DUUYKQWKWX7",
        "tiers": {
            "standard": {"days": 30, "label": "Standard"},
            "prime":    {"days": 30, "label": "Amazon Prime"},
        },
        "default_tier": "standard",
    },
    "oura": {
        "label": "Oura Return & Refund Policy",
        "url": "https://ouraring.com/policies/refund-policy",
        "tiers": {
            "standard": {"days": 30, "label": "Standard"},
            "member":   {"days": 30, "label": "Oura Member"},
        },
        "default_tier": "standard",
    },
}

def _retailer_key(retailer: str) -> str:
    """Normalize a retailer name to a RETAILER_POLICIES key."""
    r = retailer.lower()
    if "best buy" in r:
        return "best_buy"
    if "amazon" in r:
        return "amazon"
    if "oura" in r:
        return "oura"
    return "unknown"

# ---------------------------------------------------------------------------
# Mock purchase database
# Return windows are computed using the user's real membership tier.
# ---------------------------------------------------------------------------

def _build_purchases():
    today = date.today()
    raw = [
        {
            "id": "1",
            "productName": 'Samsung 65" Class QN90F Series Neo QLED 4K Smart TV',
            "price": 1299.99,
            "retailer": "Best Buy",
            "purchaseDate": (today - timedelta(days=12)).isoformat(),
            "warrantyMonths": 12,
            "currency": "USD",
        },
        {
            "id": "2",
            "productName": "Canon EOS R50 4K Video Mirrorless Camera",
            "price": 699.99,
            "retailer": "Best Buy",
            "purchaseDate": (today - timedelta(days=8)).isoformat(),
            "warrantyMonths": 12,
            "currency": "USD",
        },
        {
            "id": "3",
            "productName": "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones",
            "price": 399.99,
            "retailer": "Amazon",
            "purchaseDate": (today - timedelta(days=45)).isoformat(),
            "warrantyMonths": 12,
            "currency": "USD",
        },
        {
            "id": "4",
            "productName": "Oura Ring 4 Midnight Ceramic - Size 7",
            "price": 449.99,
            "retailer": "Oura",
            "purchaseDate": (today - timedelta(days=1)).isoformat(),
            "warrantyMonths": 24,
            "currency": "USD",
        },
        {
            "id": "5",
            "productName": "Oura Ring 4 Midnight Ceramic - Size 8",
            "price": 449.99,
            "retailer": "Oura",
            "purchaseDate": (today - timedelta(days=1)).isoformat(),
            "warrantyMonths": 24,
            "currency": "USD",
        },
    ]
    # Attach membership-aware return window to every purchase
    for p in raw:
        pol = policy_researcher(p["retailer"])
        p["returnWindowDays"] = pol["return_window_days"]
        p["membershipTier"]   = pol["membership_tier_label"]
    return raw

# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class AskRequest(BaseModel):
    question: str

# ---------------------------------------------------------------------------
# Agent 1 — Inbox Scout
# Single-item lookup used by the Orchestrator chat.
# ---------------------------------------------------------------------------

def inbox_scout(product_name: str) -> dict:
    today = date.today()
    q = product_name.lower()

    if "samsung" in q or ("tv" in q and "sony" not in q):
        return {
            "found": True,
            "retailer": "Best Buy",
            "purchase_date": (today - timedelta(days=12)).isoformat(),
            "item": 'Samsung 65" Class QN90F Series Neo QLED 4K Smart TV',
        }
    if "canon" in q or "camera" in q or "r50" in q:
        return {
            "found": True,
            "retailer": "Best Buy",
            "purchase_date": (today - timedelta(days=8)).isoformat(),
            "item": "Canon EOS R50 4K Video Mirrorless Camera",
        }
    if "sony" in q or "headphone" in q or "xm5" in q:
        return {
            "found": True,
            "retailer": "Amazon",
            "purchase_date": (today - timedelta(days=45)).isoformat(),
            "item": "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones",
        }
    if "oura" in q or "ring" in q:
        size = "8" if ("size 8" in q or " 8" in q) else "7"
        return {
            "found": True,
            "retailer": "Oura",
            "purchase_date": (today - timedelta(days=1)).isoformat(),
            "item": f"Oura Ring 4 Midnight Ceramic - Size {size}",
        }

    return {"found": False}

# ---------------------------------------------------------------------------
# Agent 2 — Policy Researcher
# Looks up the real return window for a retailer using the user's membership.
# ---------------------------------------------------------------------------

def policy_researcher(retailer: str) -> dict:
    key = _retailer_key(retailer)
    pol = RETAILER_POLICIES.get(key)

    if pol is None:
        # Unknown retailer — safe default
        return {
            "return_window_days": 30,
            "membership_tier": "standard",
            "membership_tier_label": "Standard",
            "policy_label": f"{retailer} Return Policy",
            "policy_url": "https://example.com/return-policy",
            "membership_note": "Default 30-day window applied (retailer not in database).",
        }

    # Look up the user's tier for this retailer
    user_tier = USER_PROFILE["memberships"].get(key, pol["default_tier"])
    tier_info = pol["tiers"].get(user_tier, pol["tiers"][pol["default_tier"]])
    standard_days = pol["tiers"][pol["default_tier"]]["days"]

    membership_note = ""
    if tier_info["days"] > standard_days:
        membership_note = (
            f"Your {tier_info['label']} membership extends the return window "
            f"from {standard_days} days (standard) to {tier_info['days']} days."
        )
    else:
        membership_note = f"Return window: {tier_info['days']} days ({tier_info['label']})."

    return {
        "return_window_days": tier_info["days"],
        "membership_tier": user_tier,
        "membership_tier_label": tier_info["label"],
        "policy_label": pol["label"],
        "policy_url": pol["url"],
        "membership_note": membership_note,
    }

# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------

def _parse_llm_json(text: str) -> dict:
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass
    cleaned = re.sub(r"```(?:json)?\s*", "", text).strip().rstrip("`").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    match = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError(f"No JSON object found in response: {text[:300]}")

# ---------------------------------------------------------------------------
# REST — GET /api/user/profile  (Settings page & Policy Database use this)
# ---------------------------------------------------------------------------

@app.get("/api/user/profile")
async def get_user_profile():
    memberships_detail = []
    for retailer_key, tier in USER_PROFILE["memberships"].items():
        pol = RETAILER_POLICIES.get(retailer_key)
        if pol:
            tier_info = pol["tiers"].get(tier, {})
            memberships_detail.append({
                "retailer": retailer_key.replace("_", " ").title(),
                "tier": tier,
                "tierLabel": tier_info.get("label", tier.title()),
                "returnWindowDays": tier_info.get("days", 30),
                "policyUrl": pol["url"],
            })
    return {**USER_PROFILE, "memberships_detail": memberships_detail}

# ---------------------------------------------------------------------------
# REST — POST /api/agents/inbox-scout  (Sync Inbox button)
# ---------------------------------------------------------------------------

@app.post("/api/agents/inbox-scout")
async def agents_inbox_scout():
    purchases = _build_purchases()
    return {
        "purchases": purchases,
        "scanned": 1_243,
        "found": len(purchases),
    }

# ---------------------------------------------------------------------------
# REST — POST /api/agents/policy-researcher  (Check Return Eligibility button)
# ---------------------------------------------------------------------------

@app.post("/api/agents/policy-researcher")
async def agents_policy_researcher():
    today = date.today()
    purchases = _build_purchases()
    sources_seen: set[str] = set()
    sources = []
    lines = []
    eligible = []
    expired = []

    for p in purchases:
        purchase_date  = date.fromisoformat(p["purchaseDate"])
        days_elapsed   = (today - purchase_date).days
        days_remaining = p["returnWindowDays"] - days_elapsed
        still_open     = days_remaining > 0

        policy = policy_researcher(p["retailer"])
        if policy["policy_url"] not in sources_seen:
            sources_seen.add(policy["policy_url"])
            sources.append({"label": policy["policy_label"], "url": policy["policy_url"]})

        tier_note = f" [{policy['membership_tier_label']}]" if policy["membership_tier"] != "standard" else ""

        if still_open:
            lines.append(
                f"• {p['productName']} ({p['retailer']}{tier_note}): "
                f"purchased {days_elapsed} day(s) ago, "
                f"{days_remaining} day(s) remaining — ✅ ELIGIBLE for return."
            )
            eligible.append(p["productName"])
        else:
            lines.append(
                f"• {p['productName']} ({p['retailer']}{tier_note}): "
                f"purchased {days_elapsed} day(s) ago, "
                f"return window closed {abs(days_remaining)} day(s) ago — ❌ NOT ELIGIBLE."
            )
            expired.append(p["productName"])

    reasoning = "\n".join(lines)

    if eligible:
        response = (
            f"You have {len(eligible)} item(s) still within their return window: "
            + ", ".join(eligible)
            + ". Contact the retailer to start a return."
        )
        if expired:
            response += (
                f" Unfortunately, {len(expired)} item(s) are past their return window: "
                + ", ".join(expired) + "."
            )
    else:
        response = "None of your purchases are currently within their return window."

    return {"reasoning": reasoning, "response": response, "sources": sources}

# ---------------------------------------------------------------------------
# REST — POST /api/agents/scheduler  (Add to Calendar button)
# ---------------------------------------------------------------------------

@app.post("/api/agents/scheduler")
async def agents_scheduler():
    today     = date.today()
    purchases = _build_purchases()
    events    = []

    for p in purchases:
        purchase_date = date.fromisoformat(p["purchaseDate"])
        deadline      = purchase_date + timedelta(days=p["returnWindowDays"])
        days_remaining = (deadline - today).days

        if days_remaining > 0:
            events.append({
                "item":          p["productName"],
                "retailer":      p["retailer"],
                "memberTier":    p["membershipTier"],
                "deadline":      deadline.isoformat(),
                "daysRemaining": days_remaining,
            })

    if events:
        message = (
            f"📅 Added {len(events)} return deadline(s) to your calendar. "
            "You'll get a reminder 2 days before each one expires."
        )
    else:
        message = "No active return windows to schedule — nothing was added."

    return {"events": events, "message": message}

# ---------------------------------------------------------------------------
# REST — POST /api/agent/ask  (Orchestrator — chat box)
# ---------------------------------------------------------------------------

@app.post("/api/agent/ask")
async def ask(payload: AskRequest):
    question = payload.question.strip()
    today    = date.today().isoformat()

    # Step 1 — extract item name AND classify question intent via LLM
    extraction_prompt = f"""
You are a post-purchase assistant intake agent. Analyse the user's question and return ONLY valid JSON:

{{
  "item_name": "<the specific product the user is asking about>",
  "intent": "<one of: return_eligibility | return_reasons | return_process | policy_summary | warranty | general>"
}}

Intent definitions:
- return_eligibility : user wants to know IF they can still return the item (date math)
- return_reasons     : user wants to know WHY / what reasons are accepted for a return
- return_process     : user wants to know HOW to return the item (steps, process)
- policy_summary     : user wants a full summary of the return policy
- warranty           : user is asking about warranty coverage, not returns
- general            : any other post-purchase question

User question: "{question}"
""".strip()

    try:
        raw_text   = _llm_generate(extraction_prompt, temperature=0.1)
        parsed     = _parse_llm_json(raw_text)
        item_name  = parsed.get("item_name") or question
        intent     = parsed.get("intent", "general")
    except Exception:
        item_name = question
        intent    = "general"

    # Step 2 — Inbox Scout
    scout = inbox_scout(item_name)

    if not scout.get("found"):
        return {
            "reasoning": (
                f"I searched your email receipts for '{item_name}' but found no matching purchase. "
                "Without a confirmed receipt I cannot determine return eligibility."
            ),
            "response": (
                "I couldn't find a receipt matching that product. "
                "Could you clarify the product name or the retailer you bought it from?"
            ),
            "sources": [],
        }

    retailer:      str = scout["retailer"]
    purchase_date: str = scout["purchase_date"]
    item:          str = scout["item"]

    # Step 3 — Policy Researcher (membership-aware)
    policy = policy_researcher(retailer)

    # Step 4 — Groq (Llama 3.3) synthesizes the final answer
    # Intent-specific instruction injected into the prompt so every question
    # type gets a genuinely different, tailored answer.
    intent_instructions = {
        "return_eligibility": (
            "Calculate exactly how many days have passed since the purchase date and how many days remain "
            "in the return window. State clearly whether the item IS or IS NOT eligible for return. "
            "Mention the membership benefit if it extended the standard window."
        ),
        "return_reasons": (
            f"List and explain the accepted reasons for returning an item at {retailer}. "
            "Cover: defective/damaged item, wrong item received, changed mind, item not as described, "
            "shipping damage. Note any exclusions (e.g. opened software, consumables). "
            "Do NOT just talk about dates — focus on the accepted reasons and conditions."
        ),
        "return_process": (
            f"Walk the user through the step-by-step process to return their item to {retailer}. "
            "Include: how to initiate the return (online portal, in-store, phone), whether they need "
            "original packaging/receipt, how refunds are issued (original payment method, store credit), "
            "and roughly how long the refund takes. Be specific to {retailer}."
        ),
        "policy_summary": (
            f"Give a full, clear summary of {retailer}'s return policy as it applies to this purchase. "
            "Cover: return window (standard vs membership), accepted conditions, exclusions, "
            "refund method, and any special rules. Highlight the membership benefit prominently."
        ),
        "warranty": (
            "Address the warranty question specifically. Clarify the difference between the return window "
            "(short-term, for any reason) and the manufacturer warranty (longer-term, for defects). "
            "State the warranty period for this item and what it covers."
        ),
        "general": (
            "Answer the user's specific question using the purchase data as context. "
            "Be helpful, specific, and friendly. Do not default to a generic return eligibility answer "
            "unless that is literally what was asked."
        ),
    }

    instruction = intent_instructions.get(intent, intent_instructions["general"])

    purchase_dt   = date.fromisoformat(purchase_date)
    days_elapsed  = (date.today() - purchase_dt).days
    days_remaining = policy["return_window_days"] - days_elapsed

    synthesis_prompt = f"""
You are the Post-Purchase Concierge — a knowledgeable, warm, and specific AI assistant
that helps users with post-purchase questions. You always give direct, personalised answers.

PURCHASE CONTEXT:
- Item            : {item}
- Retailer        : {retailer}
- Purchase date   : {purchase_date}
- Today's date    : {today}
- Days since buy  : {days_elapsed} day(s)
- Return window   : {policy['return_window_days']} days ({policy['membership_tier_label']} membership)
- Days remaining  : {days_remaining} day(s) {"✅ still open" if days_remaining > 0 else "❌ expired"}
- Membership note : {policy['membership_note']}

USER'S QUESTION: "{question}"
DETECTED INTENT : {intent}

YOUR TASK — {instruction}

Rules:
1. Answer the SPECIFIC question asked. Do not give a generic return eligibility answer if the user
   asked about reasons, process, or policy.
2. Be specific to {retailer} and to this exact item.
3. Use a friendly, helpful tone with short paragraphs. Use bullet points where they help clarity.
4. If the intent is return_eligibility, always include the exact day count math.
5. Always note the membership benefit if relevant.

Return ONLY valid JSON, no markdown fences:
{{
  "reasoning": "<your internal chain of thought: detected intent, relevant facts used, how you formed the answer>",
  "response": "<your direct, specific, friendly answer — tailored to the exact question asked>"
}}
""".strip()

    try:
        raw_text      = _llm_generate(synthesis_prompt, temperature=0.7)
        result        = _parse_llm_json(raw_text)
        reasoning     = result.get("reasoning", "")
        response_text = result.get("response", "")
    except Exception as exc:
        reasoning     = f"(parse error: {exc})"
        response_text = str(exc)

    return {
        "reasoning":  reasoning,
        "response":   response_text,
        "sources": [{"label": policy["policy_label"], "url": policy["policy_url"]}],
    }
