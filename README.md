# SellSigma

SellSigma is an intent-monitoring assistant for community-led outbound — starting with Reddit.

It helps small teams surface **high-intent** posts (pain signals, “looking for a tool,” “any recommendations,” etc.) so you can jump into the right conversations at the right time.

SellSigma is **not** a replacement for your sales team, pipeline, or existing sales motion. It’s a **supplement** that improves the *top-of-funnel* by reducing time spent hunting for leads and increasing the odds that your outreach is timely and relevant.

## What SellSigma is (and isn’t)

### ✅ SellSigma is for
- **Small teams** that don’t have time to manually monitor communities
- Teams **already at capacity** who want higher-signal outreach
- **Technical founders / engineers** who want a structured way to find conversations that naturally convert
- Early-stage teams that rely on founder-led sales and want a lightweight “radar” for buying intent

### ❌ SellSigma is not
- A full sales automation platform
- A replacement for discovery, qualification, follow-up, or closing
- A tool to spam communities or run mass outreach

SellSigma’s job is to help you identify **where demand already exists** — you still win by being helpful, human, and relevant in the conversation.

## How to use SellSigma

1. **Define what to monitor**
   - Select subreddits (and optionally keywords / topics)
   - Define what counts as “intent” for your business (pain signals, buying triggers, role/ICP cues)

2. **Let SellSigma detect intent**
   - SellSigma scans new posts/threads and classifies them based on your intent definitions
   - It flags high-signal opportunities so you can prioritize your time

3. **Engage manually**
   - You review flagged threads
   - You participate in the thread as a human (helpful, non-spammy, value-first)
   - You optionally move the conversation into your existing funnel when appropriate

## High-level flow

```text
Define subreddits + intent signals
   -> Monitor Reddit threads
      -> Flag opportunities to you (dashboard / notifications)
         -> You engage manually in-thread
            -> Funnel into your existing sales motion (optional)
```

## Development Setup

### Prerequisites
- Docker + Docker Compose
- Node.js 18+ and Supabase CLI v2 (`npm install -g supabase@2`)
- Python 3.11+ (for local linting/IDE support)

### 1. Environment variables
```bash
cp .env.example .env
# fill in .env with your credentials
```

### 2. Local Python environment (for IDE linting only — app runs in Docker)
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt -r scraper/requirements.txt
```
Then in VS Code: `Cmd+Shift+P` → **Python: Select Interpreter** → pick `.venv` (root).

### 3. Start local Supabase (port 4999)
```bash
supabase start
```

### 4. Run the app
```bash
docker compose up frontend backend
```

### 5. Test the scraper manually
```bash
docker compose --profile scraper run scraper
```

### Local URLs

| URL | Service |
|-----|---------|
| http://localhost:8001 | React frontend |
| http://localhost:8000 | FastAPI backend |
| http://localhost:8000/docs | FastAPI auto-generated docs |
| http://localhost:4999 | Supabase Studio |
