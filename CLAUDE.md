# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

```
IncidentPilot/
├── frontend/   # Vite + React + TypeScript
├── backend/    # FastAPI (Python)
├── doc/        # PROD.md, ROADMAP.md
└── docker-compose.yml
```

## Commands

### Frontend (`frontend/`)
```bash
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint
```

### Backend (`backend/`)
```bash
uvicorn app.main:app --reload   # http://localhost:8000
python -m scripts.seed          # Seed DB from frontend JSON data
```

### Full stack
```bash
docker compose up               # frontend + backend + PostgreSQL
```

## Environment

**frontend/.env**
```
VITE_CLAUDE_API_KEY=...         # Required for AI mode
VITE_BACKEND_URL=http://localhost:8000  # Required for Mock mode
```

**backend/.env**
```
DATABASE_URL=sqlite:///./incidentpilot.db   # default; use postgresql:// in Docker
ALLOWED_ORIGINS=http://localhost:5173
```

## Architecture

### Two analysis modes (the core design decision)

**AI mode** — frontend calls Anthropic Claude API directly (`claude-sonnet-4-6`). Requires `VITE_CLAUDE_API_KEY`. Handled in `frontend/src/services/claude.ts`.

**Mock mode** — frontend calls `POST /api/analyze` on the backend. Backend does keyword scoring. No API key needed. Handled in `frontend/src/services/backend.ts`. The backend returns runbook IDs and incident IDs; the frontend resolves them to full objects using the static JSON files in `src/data/`.

Both modes return the same shape consumed by `App.tsx`:
```ts
{ matches: MatchResult[], extractedErrors: string[], summary: string, similarIncidents: Incident[] }
```

### Frontend

Single-page app — no router. `App.tsx` holds `view: 'dashboard' | 'analysis'` state and switches between `<IncidentInput>` (dashboard) and `<AnalysisView>` (3-column results).

`AnalysisView` holds checklist and timeline state locally. Each completed checklist step appends a `TimelineEntry`.

Static JSON (`src/data/runbooks.json`, `incidents.json`) is imported directly — used for dashboard display AND as the lookup table when resolving IDs returned by the backend.

Tailwind CSS v4: `@import "tailwindcss"` in `index.css` (not `@tailwind` directives). Dark theme only.

### Backend

FastAPI app in `app/main.py`. Tables auto-created on startup via `Base.metadata.create_all`.

- `app/api/analyze.py` — `POST /api/analyze`: calls `matcher.match_runbooks()` + `extractor.extract_errors()` + `matcher.find_similar_incidents()`, returns unified JSON
- `app/api/runbooks.py` / `incidents.py` — standard CRUD
- `app/services/matcher.py` — keyword scoring per runbook ID, hardcoded in `RUNBOOK_KEYWORDS` dict
- `app/services/extractor.py` — regex patterns to pull ERROR/FATAL/OOM lines from log text
- `scripts/seed.py` — reads `frontend/src/data/*.json` and inserts into DB (safe to re-run, skips existing IDs)

SQLite by default (local dev), PostgreSQL in Docker Compose. Connection string via `DATABASE_URL` env var; `database.py` auto-adds `check_same_thread=False` for SQLite.
