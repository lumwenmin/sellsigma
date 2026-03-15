# SellSigma — Developer Setup

## Prerequisites

- Docker + Docker Compose
- Node.js 18+
- Python 3.11+
- Supabase CLI v2: `npm install -g supabase@2`

---

## First-time setup

### 1. Environment variables

```bash
cp .env.example .env
# fill in your credentials
```

### 2. Local Python environment (for IDE linting only — app runs in Docker)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt -r scraper/requirements.txt
```

Then in VS Code: `Cmd+Shift+P` → **Python: Select Interpreter** → pick `.venv` (root).

### 3. Start local Supabase

```bash
npx supabase start
```

This prints your local URLs and keys — copy them into your `.env`:

```
SUPABASE_URL=http://127.0.0.1:54341
SUPABASE_ANON_KEY=<printed by supabase start>
SUPABASE_SERVICE_ROLE_KEY=<printed by supabase start>
VITE_SUPABASE_URL=http://127.0.0.1:54341
VITE_SUPABASE_ANON_KEY=<same as SUPABASE_ANON_KEY>
```

### 4. Run migrations

```bash
npx supabase db push
```

This applies everything in `supabase/migrations/` to your local database.

### 5. Start the app

```bash
docker compose up frontend backend --build
```

---

## Daily dev commands

### Run the app

```bash
docker compose up frontend backend
```

### Stop the app

```bash
docker compose down        # stop containers
npx supabase stop          # stop local Supabase
```

### When `.env` changes

Restart without rebuilding — env vars are injected at runtime:

```bash
docker compose down && docker compose up frontend backend
```

### When new packages are added

After updating `backend/requirements.txt` or `frontend/package.json`, rebuild the image:

```bash
docker compose up frontend backend --build
```

Also reinstall locally so the IDE stays in sync:

```bash
pip install -r backend/requirements.txt -r scraper/requirements.txt
```

---

## Running migrations

Migrations live in `supabase/migrations/`.

**Local:**

Migrations run automatically on `supabase start`. If you add a new migration file while Supabase is already running, reset to replay all migrations from scratch:

```bash
npx supabase db reset
```

**Production (Supabase Cloud):**

`db push` always targets your linked remote project:

```bash
npx supabase db push
```

If you haven't linked yet (one-time setup):

```bash
npx supabase link --project-ref <your-project-ref>
```

Your project ref is in the Supabase dashboard URL: `supabase.com/dashboard/project/<project-ref>`

| Action | Command |
|---|---|
| Apply migrations to production | `npx supabase db push` |
| Apply migrations to local (fresh) | `npx supabase db reset` |
| Local migrations on first start | automatic |

---

## Testing the scraper manually

The scraper runs automatically inside the backend on a daily schedule. To test it locally against fake posts:

```bash
cd scraper && python test_scraper.py
```

This fetches your user config from the database and runs the classifier against two hardcoded test posts — one that should be flagged, one that shouldn't.

Requires `GEMINI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` in your `.env`.

---

## Local URLs

| URL | Service |
|-----|---------|
| http://localhost:8001 | React frontend |
| http://localhost:8000 | FastAPI backend |
| http://localhost:8000/docs | FastAPI auto-generated API docs |
| http://localhost:4999 | Supabase Studio |
