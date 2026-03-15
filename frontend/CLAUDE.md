# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Type-check (tsc -b) then Vite production build
npm run lint     # ESLint
npm run preview  # Serve production build locally
```

No test suite is configured.

## Environment

Copy `.env.example` to `.env` and set `VITE_CLAUDE_API_KEY`. Without a valid key, use **Mock 모드** in the UI.

## Architecture

Single-page app with state-based view switching — no router. Two views: `dashboard` and `analysis`, toggled in `App.tsx`.

### Data flow

1. User uploads a log file or types symptoms in `IncidentInput`
2. `App.tsx` calls `analyzeIncident()` + `findSimilarIncidents()` in parallel
3. Results are stored in `analysisResult` state → view switches to `analysis`
4. `AnalysisView` renders the 3-column layout with the results

### Mock mode vs Claude API

`src/services/claude.ts` — real Claude API calls (`claude-sonnet-4-6`). Both `analyzeIncident` and `findSimilarIncidents` return structured JSON parsed from the model response.

`src/services/backend.ts` — Mock mode calls the self-built FastAPI backend (`POST /api/analyze` at `VITE_BACKEND_URL`). The backend returns `{ matches, extractedErrors, summary, similarIncidentIds }` using keyword scoring; the frontend resolves IDs → full objects via the static JSON.

`src/services/mock.ts` — legacy local keyword scorer, no longer used in the main flow. Kept for reference.

`src/services/incidentMatcher.ts` — keyword-based incident scorer used as a fallback when `findSimilarIncidents` (Claude) throws, and for direct runbook catalog selections.

### Static data

All data lives in `src/data/` as imported JSON — used both as the source of truth in Claude mode and as ID-lookup tables in Mock mode.
- `runbooks.json` — 6 runbooks, each with typed `steps[]` (commands, estimatedMinutes, notes)
- `incidents.json` — 13 past incidents, each with `relatedRunbookId` linking to a runbook
- `sample-logs/` — 3 demo `.log` files for drag-and-drop demos

### Key type relationships

`Runbook` → `RunbookStep[]` (the checklist source)
`MatchResult` wraps a `Runbook` with `confidence` + `reasoning` + `rank`
`ChecklistItem` tracks completion state per `stepId` (stored in `AnalysisView` local state)
`TimelineEntry` is appended on each step completion and shown in the Timeline panel

### Styling

Tailwind CSS v4 via `@tailwindcss/postcss`. Import is `@import "tailwindcss"` in `index.css` — **not** `@tailwind base/components/utilities`. Dark theme only (bg-slate-950 base).
