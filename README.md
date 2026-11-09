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
| 3 | CRM — Communications (WhatsApp + Email), Agenda, Contacts, Leads, Prospecting, Pipeline | ✅ |
| 4 | Projects | ✅ |
| 5 | Finance — Estimates, Invoices, Expenses & POs, Payments & Reports | ✅ |
| 6 | AI — 7 modules (demo) + floating assistant | ✅ |
| 7 | Settings — profile, organization & brand, users & roles, channels, templates, catalog, taxes & billing, integrations, AI, notifications | ✅ |
| 8 | Polish, a11y pass, final screenshots | ⏳ |

Every module in the brief is built. Step 8 is the final polish pass.

## Try it

- **Sign in**: open the app → `/login`. Click any demo teammate (password `greatstone` for everyone): Tessa = admin, Luis/Priya = designer, Owen = accounting, Mia = viewer. User menu → **Sign out**.
- **Collapse the sidebar** (bottom button or **Ctrl/⌘ + B**): it slides away, the module icons slide into the topbar with the submodules below, and pages use the extra width (more table columns, more cards per row).
- **Ctrl/⌘ + K**: global search and command palette.
- **+ New → Task / Appointment / Note**: quick **modal** forms. Try Esc with changes, Ctrl/⌘+Enter, and the inline validation.
- **+ New → Lead**: full **page** form with **← Back**. Back returns to the same screen, scroll and filters. If you leave with unsaved changes, it asks first.
- Dashboard **date range**: stored in the URL (`?range=ytd`).
- User menu → **Español / English**: i18n switch.
- **Leads / Contacts**: table ↔ cards view, filters, sort and pagination all in the URL. Click a row to open the record page, then use **← Back** to return to the same filtered page.
- **Pipeline**: drag cards between stages with the mouse, touch or keyboard (focus a card, Space, arrows, Space).
- **Agenda**: month / week / day / list views. Drag an appointment to another day or hour to reschedule it. Click an empty slot to create an appointment there.
- **Communications → WhatsApp**: 24h-window indicator, internal notes, quick templates, and a linked contact/project panel. **Email**: folders, labels, bulk actions, a reading pane with quick reply, and the full composer page.
- **Prospecting**: prospect lists and campaigns with reply metrics, plus "Convert to lead".
- **Projects**: table ↔ cards view with progress, budget used and projected margin. The project page has 11 tabs (overview, rooms & scope, tasks, Gantt timeline, selections & materials, budget & expenses, documents, photos, communications, estimates & invoices, notes), plus New/Edit project as a page and Record payment as a modal.
- **Finance**:
  - Estimate and invoice builder with catalog items, qty, price, discount and 7% sales tax; totals update live, with an Edit ↔ Preview switch.
  - PDF-like preview with "Download PDF" (prints only the document).
  - Status flow: send → accept/decline → convert to invoice → record partial or full payments → reminders.
  - Expenses & POs with receipts and single or bulk approval.
  - Reports: income vs expenses, receivables aging, profitability by project and the annual summary.
- **Install the app**: user menu → *Install app* (or Settings → My profile → *This device*: install, allow notifications and send a test one).
- **Settings** (topbar row 2 / sidebar list the 10 sections):
  - **Users & roles**: invite (modal), change a role inline, deactivate, revoke invitations, and edit the **permission matrix** (no access / view / full per module and role).
  - **View as role**: user menu → *View as role (demo)* or Settings → Users & roles. Try **Viewer**: Finance and AI show a *No access* page, the AI button disappears and Settings is blocked; **Designer** sees Settings read-only.
  - **Taxes & billing**: change the tax rate (e.g. 8.5%) → new estimates use it, existing documents keep the rate they were created with.
  - **Organization**: company letterhead (printed on estimates/invoices), logo upload, **brand color** with a live preview and a contrast check, applied to the whole app on save.
  - **My profile**: language and **light / dark / system theme**.
  - **Templates** (WhatsApp templates go to "In review" and only approved ones appear in the composer), **Catalog** (used by the estimate builder), **Channels** (signature used by the email composer), **AI** (turn the assistant off, tone, data access, human review) and **Notifications** (events × in-app/email/push).
  - Every editable section has a sticky **Save changes** bar and asks before leaving with unsaved changes.
- **AI (demo, no model connected)**: a hub plus communication analysis (sentiment, topics, objections, response times, opportunities, at-risk), prospecting analysis (segments, best messages, next best action), Lead Finder (criteria, simulated platform connections, scheduled runs, results → Leads/Prospecting), pattern detection (seasonality, channels, LTV, best contact hours), email mining (referrals, cold threads, re-engagement), Campaigns & Ads (simulated Meta/Google connection, CPL, ROAS, audiences). Each module has **Run now**, Configure and Run history. The **AI assistant** is available as a floating button on every screen and as a full page.

## Install as an app (PWA)

The CRM is a **Progressive Web App**: it installs like a native app and works offline after the first visit.

- **Desktop (Chrome / Edge)**: the install icon in the address bar, or user menu → **Install app**. It opens in its own window with a dock/taskbar icon.
- **Android (Chrome)**: menu → **Install app** / **Add to Home screen**.
- **iPhone / iPad (Safari)**: Share → **Add to Home Screen** (instructions in Settings → My profile → This device).
- Long-press the icon for shortcuts: New lead, WhatsApp inbox, Agenda, New estimate.
- **Offline**: the whole app (and its demo data) is cached; an "Offline" pill appears in the topbar when there's no connection.
- **Updates**: after a new deploy the app shows "New version available → Reload". It never reloads on its own.
- Requires HTTPS (Railway and Vercel provide it; `localhost` also works for testing with `npm run build && npm run preview`).

## Deployment

- **Railway (Railpack)**: ready. See [`DEPLOY.md`](DEPLOY.md). It uses `railpack.json` + `Caddyfile`, a static SPA served by Caddy with `/health`.
- **Vercel**: `vercel.json` already rewrites every route to `index.html` (SPA).

## Docs

- `DECISIONS.md`: design decisions, brand values taken from the client site, and assumptions.
- `STRUCTURE.md`: folder map, routes, and the "Action → Modal or Page" table.
- `src/data/schema.md`: entities and fields, the base for the database model.
- **`docs/API_INTEGRATION.md`: how to wire a real backend (Supabase or REST)**: auth, list contract, permissions/RLS, the endpoint map for every service function, files, realtime, AI, push and a migration checklist.
- `docs/brief/`: original brief.
- `docs/screenshots/`: screenshots.
