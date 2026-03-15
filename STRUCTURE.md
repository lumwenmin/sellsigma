# SellSigma — Project Structure

## Monorepo Overview

```
sellsigma/
├── backend/        FastAPI app + scheduler + scraper logic
├── frontend/       React dashboard
├── scripts/        Manual test scripts only
└── supabase/       Database migrations + local config
```

---

## Backend (`backend/`)

```
backend/
├── main.py                    App entry point — wiring only (no business logic)
└── app/
    ├── dependencies.py        Shared FastAPI dependencies (Supabase client, auth)
    ├── routers/               Route handlers — one file per resource
    │   ├── posts.py           GET /posts, PATCH /posts/{id}
    │   └── config.py          GET /config, PUT /config
    ├── models/                Pydantic request/response models
    │   ├── post.py            PostUpdate
    │   └── config.py          ConfigUpdate
    └── services/              Business logic — no HTTP concerns
        ├── classifier.py      Gemini LLM classification
        └── scraper.py         Reddit scraping + Supabase writes
```

### Where to add things

| What | Where |
|---|---|
| New API endpoint | `app/routers/<resource>.py` — create file if new resource, add to existing if same resource |
| New request/response shape | `app/models/<resource>.py` |
| New business logic | `app/services/<service>.py` |
| Shared dependency (auth, DB, etc.) | `app/dependencies.py` |
| New scheduled job | `main.py` — add `scheduler.add_job(...)` in lifespan |
| App-wide config (CORS, middleware) | `main.py` |

### Rules
- Routers import from `models/` and `services/` — never the other way around
- Services have no knowledge of HTTP (no `Request`, `Response`, status codes)
- `dependencies.py` is the only place the Supabase client is instantiated
- `main.py` imports routers and wires the app — it contains no business logic

---

## Frontend (`frontend/src/`)

```
frontend/src/
├── main.jsx               React entry point — do not edit
├── App.jsx                Router + auth guard — add new routes here
├── lib/
│   └── supabaseClient.js  Supabase client singleton — do not duplicate
├── services/              API call functions — one file per backend resource
│   ├── posts.js           getPosts, updatePost
│   └── config.js          getConfig, saveConfig
├── pages/                 One file per route/page
│   ├── LoginPage.jsx      /login
│   ├── DashboardPage.jsx  /
│   └── ConfigPage.jsx     /config
└── components/            Reusable UI pieces used across pages
    └── PostCard.jsx
```

### Where to add things

| What | Where |
|---|---|
| New page/route | `pages/<PageName>.jsx` + add `<Route>` in `App.jsx` |
| Reusable UI component | `components/<ComponentName>.jsx` |
| New route | `App.jsx` — add inside `<Routes>`, wrap with `<ProtectedRoute>` if auth required |
| API calls for a new resource | `services/<resource>.js` — import into the page that needs it |

### Rules
- Pages own state and orchestration — no raw `fetch` calls
- Services own all HTTP calls — they take a token and return data or throw
- Components are presentational — they receive props and emit callbacks, no direct API calls
- All Supabase auth goes through `lib/supabaseClient.js` — never create a second client

---

## Scripts (`scripts/`)

```
scripts/
└── test_scraper.py    Manual test script — runs classifier against fake posts
```

The scraper logic lives in `backend/app/services/`. This directory is only for local testing and one-off scripts. Do not add production code here.

---

## Supabase (`supabase/`)

```
supabase/
├── config.toml          Local Supabase CLI config — do not edit unless changing ports
└── migrations/          SQL migration files — one file per schema change
```

### Where to add things

| What | Where |
|---|---|
| New table or column | New file in `migrations/` with format `YYYYMMDDHHMMSS_<description>.sql` |
| Schema change | Always a new migration file — never edit an existing one |

### Rules
- Never edit an existing migration — always create a new one
- Filename format: `20240101000000_description.sql` (timestamp + snake_case description)
- After adding a migration: run `npx supabase db reset` locally, `npx supabase db push` for production
