# SellSigma — Infrastructure & Setup Documentation

## Overview

SellSigma is a Reddit intent-monitoring tool that runs a daily cron job to surface high-intent posts from configured subreddits, classifies them using LLMs/HuggingFace, stores results in Supabase, and surfaces them via a React dashboard.

---

## Monorepo Structure

```
sellsigma/
├── docker-compose.yml
├── .env.example
├── .gitignore
│
├── frontend/                  # React + Material UI
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── components/
│
├── backend/                   # FastAPI
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   └── app/
│       ├── routers/
│       ├── models/
│       └── services/
│
├── scraper/                   # PRAW cron script (standalone)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   └── classifier.py
│
└── .github/
    └── workflows/
        └── scraper.yml        # GitHub Actions cron trigger
```

---

## Ports

| Service       | Local Port | Notes                              |
|---------------|------------|------------------------------------|
| Frontend      | 8001       | React + Vite dev server            |
| Backend       | 8000       | FastAPI via uvicorn                |
| Supabase Studio | 4999     | Local only via Supabase CLI        |
| Supabase API  | 54341      | Local only (set as SUPABASE_URL)   |
| Supabase DB   | 54342      | Local only                         |

---

## Environment Variables

Create a `.env` file at the monorepo root. All services read from here via Docker.
Copy from `.env.example` and fill in values.

```env
# Reddit (users provide their own credentials)
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=sellsigma/1.0

# Supabase
SUPABASE_URL=                        # https://<project>.supabase.co in prod
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=           # backend + scraper only, never frontend

# LLM
OPENAI_API_KEY=                      # or swap for another provider
HUGGINGFACE_API_KEY=

# App
VITE_API_URL=http://localhost:8000   # frontend → backend; override in prod
```

---

## docker-compose.yml

```yaml
version: "3.9"

services:

  frontend:
    build:
      context: ./frontend
    ports:
      - "8001:8001"
    environment:
      - VITE_API_URL=${VITE_API_URL}
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
    ports:
      - "8000:8000"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - HUGGINGFACE_API_KEY=${HUGGINGFACE_API_KEY}
    volumes:
      - ./backend:/app

  supabase:
    # Local Supabase Studio — dev only
    # Requires: npx supabase start (Supabase CLI manages the actual containers)
    # Studio will be available at http://localhost:4999
    # This service block is a placeholder — run `supabase start` separately
    profiles:
      - local-supabase

  scraper:
    build:
      context: ./scraper
    environment:
      - REDDIT_CLIENT_ID=${REDDIT_CLIENT_ID}
      - REDDIT_CLIENT_SECRET=${REDDIT_CLIENT_SECRET}
      - REDDIT_USER_AGENT=${REDDIT_USER_AGENT}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    profiles:
      - scraper   # not started by default; triggered manually or via cron
```

> Run `docker compose up frontend backend` for normal dev.
> Run `docker compose --profile scraper run scraper` to test the scraper locally.
> Run `npx supabase start` separately to start local Supabase on port 4999.

---

## Service Setup

### frontend/Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8001
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8001"]
```

### frontend/vite.config.js

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8001,
    host: "0.0.0.0",
  },
});
```

### frontend/package.json (key deps)

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "@mui/material": "^5",
    "@emotion/react": "^11",
    "@emotion/styled": "^11",
    "@supabase/supabase-js": "^2"
  },
  "devDependencies": {
    "vite": "^5",
    "@vitejs/plugin-react": "^4"
  }
}
```

---

### backend/Dockerfile

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### backend/requirements.txt

```
fastapi
uvicorn[standard]
supabase
openai
httpx
python-dotenv
pydantic
```

### backend/main.py (skeleton)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SellSigma API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}
```

---

### scraper/Dockerfile

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

### scraper/requirements.txt

```
asyncpraw
supabase
openai
python-dotenv
```

### scraper/main.py (skeleton)

```python
import asyncpraw
import asyncio
import os
from datetime import datetime, timezone, timedelta
from supabase import create_client
from classifier import classify_post
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

SUBREDDITS = ["startups", "entrepreneur", "SaaS"]   # pulled from DB per user in future
LOOKBACK_HOURS = 24

async def run():
    reddit = asyncpraw.Reddit(
        client_id=os.environ["REDDIT_CLIENT_ID"],
        client_secret=os.environ["REDDIT_CLIENT_SECRET"],
        user_agent=os.environ["REDDIT_USER_AGENT"],
    )

    cutoff = datetime.now(timezone.utc) - timedelta(hours=LOOKBACK_HOURS)

    async with reddit:
        subreddit = await reddit.subreddit("+".join(SUBREDDITS))
        async for post in subreddit.new(limit=100):
            created = datetime.fromtimestamp(post.created_utc, tz=timezone.utc)
            if created < cutoff:
                break
            result = await classify_post(post.title, post.selftext)
            if result["is_intent"]:
                supabase.table("flagged_posts").upsert({
                    "reddit_id": post.id,
                    "title": post.title,
                    "body": post.selftext,
                    "url": f"https://reddit.com{post.permalink}",
                    "subreddit": post.subreddit.display_name,
                    "score": result["score"],
                    "matched_signals": result["matched_signals"],
                    "created_at": created.isoformat(),
                }).execute()

asyncio.run(run())
```

---

## Local Supabase Setup

Supabase Studio runs locally on port **4999** via the Supabase CLI.

```bash
# Install Supabase CLI
npm install -g supabase

# From monorepo root
npx supabase start         # config.toml already set up with correct ports
```

Ports used (chosen to avoid conflicts with other local Supabase projects):

```toml
[studio]  port = 4999
[api]     port = 54341
[db]      port = 54342
```

---

## GitHub Actions Cron (Production Scraper)

### .github/workflows/scraper.yml

```yaml
name: SellSigma Scraper

on:
  schedule:
    - cron: "0 19 * * *"    # 7:00 PM UTC daily — adjust to your timezone
  workflow_dispatch:          # allows manual trigger from GitHub UI

jobs:
  scrape:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: pip install -r scraper/requirements.txt

      - name: Run scraper
        working-directory: scraper
        env:
          REDDIT_CLIENT_ID: ${{ secrets.REDDIT_CLIENT_ID }}
          REDDIT_CLIENT_SECRET: ${{ secrets.REDDIT_CLIENT_SECRET }}
          REDDIT_USER_AGENT: ${{ secrets.REDDIT_USER_AGENT }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: python main.py
```

> Add all env vars as **GitHub Actions Secrets** under Settings → Secrets and variables → Actions.

---

## Production Deployments (Free Tier)

### Frontend → Vercel
- Connect `sellsigma/frontend` directory in Vercel dashboard
- Set root directory to `frontend/`
- Add env var: `VITE_API_URL=https://<your-render-url>`
- Auto-deploys on push to `main`

### Backend → Render
- New Web Service → connect repo → set root directory to `backend/`
- Runtime: Docker (uses `backend/Dockerfile`)
- Port: `8000`
- Add all backend env vars in Render dashboard
- Free tier: spins down after 15 min inactivity (acceptable for daily cron use case)

### Scraper → GitHub Actions (free for public repos)
- No server needed — runs on schedule and exits
- Secrets configured in GitHub repo settings

### Database + Auth → Supabase Cloud
- Create project at supabase.com (free tier: 500MB, pauses after 1 week inactivity)
- Copy `SUPABASE_URL` and keys into all deployment env configs

---

## Supabase Schema (Initial)

```sql
create table flagged_posts (
  id               uuid primary key default gen_random_uuid(),
  reddit_id        text unique not null,
  title            text not null,
  body             text,
  url              text not null,
  subreddit        text not null,
  score            float,
  matched_signals  text[],
  is_read          boolean default false,
  is_dismissed     boolean default false,
  created_at       timestamptz not null,
  flagged_at       timestamptz default now()
);
```

---

## Local Development Quickstart

```bash
git clone https://github.com/your-org/sellsigma
cd sellsigma

cp .env.example .env
# fill in .env values

# Start Supabase locally (port 4999)
npx supabase start

# Start frontend + backend
docker compose up frontend backend

# Test scraper manually
docker compose --profile scraper run scraper
```

| URL | Service |
|-----|---------|
| http://localhost:8001 | React frontend |
| http://localhost:8000 | FastAPI backend |
| http://localhost:4999 | Supabase Studio |
| http://localhost:8000/docs | FastAPI auto-generated docs |