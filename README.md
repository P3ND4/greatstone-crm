# Greatstone CRM — Phase 1 (UI design)

Custom CRM front-end for **Greatstone Design** (Miami interior design & remodel).
This phase covers the **interface only, with mock data**. It has no backend, no database, no API keys and no external calls.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

## Local production build

```bash
npm run build
npm run preview    # http://localhost:4173
```

Requires Node 18+ (tested with Node 22).

## Status

| Step | Module | Status |
|---|---|---|
| 1 | Structure, tokens, layout, router, base components, hybrid Modal/Page shells | ✅ |
| 2 | Dashboard | ✅ |
| 3 | CRM — Communications, Agenda, Contacts, Leads, Prospecting, Pipeline | ⏳ (New Lead page done as the page-pattern reference) |
| 4 | Projects | ⏳ |
| 5 | Finance | ⏳ |
| 6 | AI | ⏳ |
| 7 | Settings | ⏳ |
| 8 | Polish, a11y pass, final screenshots | ⏳ |

Modules that are not built yet show a placeholder, so every route can already be opened.

## Try it

- **Ctrl/⌘ + K**: global search and command palette.
- **+ New → Task / Appointment / Note**: quick **modal** forms. Try Esc with changes, Ctrl/⌘+Enter, and the inline validation.
- **+ New → Lead**: full **page** form with **← Back**. Back returns to the same screen, scroll and filters. If you leave with unsaved changes, it asks first.
- Dashboard **date range**: stored in the URL (`?range=ytd`).
- User menu → **Español / English**: i18n switch.

## Deployment (later)

GitHub → Vercel. `vercel.json` already rewrites every route to `index.html` (SPA).

## Docs

- `DECISIONS.md`: design decisions, brand values taken from the client site, and assumptions.
- `STRUCTURE.md`: folder map, routes, and the "Action → Modal or Page" table.
- `src/data/schema.md`: entities and fields, the base for the database model.
- `docs/brief/`: original brief.
- `docs/screenshots/`: screenshots.
