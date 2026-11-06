# Decisions & assumptions

## Brand (sampled from greatstonedesign.com, Nov 2026)

These values were read from the live Wix site with DevTools (computed styles):

| Role on the site | Value | Token |
|---|---|---|
| Cream background / text on dark | `#FFFEED` | `--brand-contrast` (app `--bg` uses a softened `#FBFAF2`) |
| Olive-black (text, dark sections, logo) | `#171200` | `--text`, `--brand` |
| Dark olive (hero overlays) | `#2C2713`, `#584E26` | `--brand-2`, `--accent-strong` |
| Olive gold, "GET A QUOTE" button | `#847539` | `--accent` (white text = 4.58:1, AA) |
| Sand | `#D6CEAD` | `--border-strong` |
| Button radius | `10px` | `--radius` |
| Typography | **Work Sans** (semibold headings, uppercase section labels) | `--font-display` |
| Logo | Text wordmark "Greatstone." (period included) | Sidebar wordmark |
| Buttons | UPPERCASE with an ↘ arrow | `.btn` uppercase + letter-spacing |

Instagram (@greatstonedesign) could not be checked because it requires a login. Everything is in `src/styles/tokens.css`, so the brand can be changed by editing that one file.

## Typography
- **Inter** is used for the whole UI, as the brief asks. It is loaded locally with `@fontsource/inter` (400/500/600/700) and uses `tnum` for figures.
- **Work Sans** (the client's own font) is used only for the wordmark and page titles, to tie the app to the brand. Also loaded locally.

## Color & data viz
- Status colors were adjusted so each one passes AA as text on white. Warning is `#9A6516`, not `#B7791F` (3.6:1 failed).
- Chart series: `--chart-1 #8F7A26` (brand gold, slightly more saturated) and `--chart-2 #3D6EA8`. They were validated for lightness band, chroma, color-vision-deficiency separation (ΔE 20) and ≥3:1 against the surface. The pure brand gold `#847539` reads too gray as a chart fill.
- Charts have one axis, thin bars with 4px rounded ends, a legend when there are 2+ series, a hover tooltip, and a **"Show data table"** view on every chart.
- **No invented deltas or targets.** The KPIs only show factual context (count, range). A missing value renders "—".

## Interaction
- **Hybrid pattern**: `FormShell` is the single form anatomy (fixed header, scrolling body, fixed footer). It is wrapped by `ModalShell` (sm 480 / md 640 / lg 840, max-h `min(90vh,760px)`) or by `FormPage` (sticky header under the topbar + sticky footer).
- **Back**: `navigate(-1)` when there is in-app history (`history.state.idx > 0`). Otherwise it goes to the parent list. Filters, tabs and pages live in the URL (`useUrlState`). Scroll is restored by React Router's `<ScrollRestoration>` (data router).
- **Unsaved changes**: modals ask on Esc, backdrop click or ✕. Pages use `useBlocker` (covers Back, links and the browser back button).
- The sidebar collapsed state is kept in `localStorage`, as a per-user convenience only.
- Dark theme tokens exist (`[data-theme="dark"]`) but are not exposed in the UI yet. The brief marks this as low priority.

## Navigation (request from Marcos)
- **Collapsible sidebar** + **two-row topbar** that repeats the same modules: row 1 holds the modules (Dashboard, CRM, Projects, Finance, AI, Settings) plus search, + New, notifications and the user menu; row 2 holds the submodules of the active module and is hidden when the module has none. Both come from one config (`src/app/navigation.js`), so they never drift apart.
- Sidebar toggle: a "Collapse / Expand sidebar" button at the bottom of the sidebar, visible in both states, plus **Ctrl/⌘ + B** (ignored while typing). The state is remembered per browser. Below 1024px the sidebar becomes a drawer (☰).
- The sticky header height is a CSS variable (`--topbar-h` = row + subbar), so sticky table headers and page-form headers always sit right under it.
- Below 1280px, inactive modules in row 1 show only their icon (the label stays in the tooltip and for screen readers). Both rows scroll sideways on small screens and never overflow the page.

## Responsive
- Mobile-first CSS with breakpoints 480 / 640 / 768 / 1024 / 1280 / 1440. Content max width is 1760px, so wide screens use the extra space.
- Audited automatically at **320, 375, 414, 600, 768, 1024, 1280, 1536, 1920 and 2560px** on 30 routes: no horizontal page overflow and no console errors or warnings.
- Tables: low-priority columns hide progressively. Below 1280px a table scrolls inside its own box, never the page. On phones, filters sit in one horizontally scrollable row.

## CRM module
- **Lists**: q, filters, sort, page and view (table/cards) all live in the URL (`useListState`), so Back and shared links restore the exact view. Rows open the record **page**, and the row "⋯" menu holds secondary actions.
- **Wide tables**: the header is sticky under the topbar. Instead of scrolling horizontally on desktop, low-priority columns hide below set widths (`hide: 'md'|'lg'|'xl'|'xxl'` on the column).
- **WhatsApp**: the 24-hour customer-service window is computed from the last inbound message. When it is closed the composer warns and only allows approved templates (WhatsApp Business rule). Internal notes are stored as messages with `isNote`, styled differently and never sent.
- **Email**: one shape shared with WhatsApp (`conversations` + `messages`, `channel` field). Folders and labels are fields on the conversation. The rich text editor is a light `contentEditable` with the same props a TipTap/Lexical editor would take later.
- **Pipeline / Agenda drag & drop**: `@dnd-kit/core` with Pointer and Keyboard sensors, so it works with mouse, touch and keyboard (Space, arrows, Space).
- **Agenda colors by type** are tokens (`--evt-*`) and always come with a text label (legend + chip text), never color alone.
- **Prospecting** metrics are computed from prospect statuses: reply rate = (replied + meeting + converted) ÷ contacted. "Convert to lead" creates a lead and opens it.

## Data
- Mock data is generated **deterministically, relative to today**, so the demo always looks current. All people are fictional: phones `(305) 555-01xx`, emails `@example.com`.
- Revenue = payments received (`paid_at`) inside the range. Outstanding = sent + partial + overdue (total − paid).
- "Budget risk" = active project where budget used − progress > 10 points.
- Services simulate 180–420 ms of latency, so skeletons and loading states are exercised.

## Projects module
- **Projected margin** = (contract value − estimated cost at completion) ÷ contract value. Estimated cost = `max(budget, spent ÷ progress)` once progress ≥ 10%, otherwise the budget. Shown as red under 10%, amber under 18% and green otherwise, always with the number.
- **At budget risk** = budget used − progress > 10 points. The same rule is used on the Dashboard.
- Budget is split by category (design fees, labor, materials, furniture, subcontractors, permits, freight) as budget vs actual with the variance.
- The **Gantt** is plain HTML/CSS with no library: one bar per phase with its completed share and a "today" line. It scrolls inside its own box on phones.
- **Photos** in the demo are colored placeholder tiles, so no real or third-party images are used. Uploads are mocked (the file name is added). Real storage (Supabase Storage) plugs into `projectsService.addDocuments`.
- Each project tab is its own component in `pages/projects/tabs/`. The active tab lives in the URL (`?tab=`), so Back returns to it.

## Finance module
- **Money math in integer cents** (`src/lib/money.js`). Each line is base (qty × price), minus discount %, plus tax if the line is taxable, rounded half-up **once per line**. Totals are the sum of the lines, so nothing is silently rounded. The UI always recomputes totals from the lines and never trusts a stored total. Checked by hand: 3 × $19.99 taxable + $0.10 taxable = **$64.28**.
- **Sales tax 7%** (Florida 6% + Miami-Dade 1% surtax), applied per line (services usually non-taxable, materials and furniture taxable). It is a setting (`financeSettings.taxRate`) and will move to Settings. Confirm with the client's accountant.
- **Status flow.** Estimate: draft → sent → (viewed) → accepted / declined; expired is derived from the date. Invoice: draft → sent → partial → paid; overdue is derived when the due date has passed with a balance. "Convert to invoice" copies the lines into a new draft invoice linked to the estimate.
- **Payments** are their own records (amount, date, method, reference). A payment can't exceed the balance.
- **"Download PDF"** uses the browser's print to PDF with print-only CSS (letter size, only the document). A server-side PDF can replace it later without UI changes.
- **Reports.** Income = payments received in the range. Profitability is on an earned basis: billed − cost to date, with collected shown alongside as cash. Receivables aging buckets: not yet due, 1–30, 31–60, 61–90 and 90+ days. Accounts payable = expenses pending approval.
- The demo company details on documents are placeholders (example.com / 555 numbers) until the client's real letterhead data is confirmed.

## AI module (demo)
- **No AI model or external API is called.** `services/aiService.js` returns deterministic, explainable heuristics over the CRM mock data, in the shape a real model or agent would return: keyword sentiment, topics, objections and opportunities; response times measured from message timestamps; seasonality, channel conversion and lifetime value (LTV) from leads and invoices. Each function is the swap point for a real endpoint (e.g. a Supabase Edge Function calling an LLM).
- Every AI screen shows a **"Demo data"** badge. Platform and ad-account connections are simulated: no credentials are requested or stored.
- Each module uses the same `AiModuleShell`: Results · Configure · Run history, plus **Run now** with simulated progress. The view lives in the URL (`?view=`).
- The assistant is intent matching (English and Spanish) over CRM data. Answers include deep links and suggested actions (open a filtered list, create an appointment…). It is available as a floating, non-blocking side panel on every screen and as a full page.
- Global AI preferences (model, tone, data access) will live in Settings, as the brief requires.

## Deployment
- Railway + **Railpack**: Vite is auto-detected and served as a static SPA by Caddy. The custom `Caddyfile` keeps Railpack's defaults (JSON logs, trusted Railway proxy, `/health`, compression) and adds caching rules and security headers.
- The CSP is strict (`'self'` only) because phase 1 makes no external calls. `style-src` allows `'unsafe-inline'` because React inline `style` attributes are used. It was verified on all 26 routes with no CSP violations.
- `X-Robots-Tag: noindex` keeps the client demo out of search engines. Remove it at launch.
- No `railway.json`: Railway's Config as Code is deprecated for new services, so the healthcheck path is configured in the dashboard (see DEPLOY.md).

## Assumptions
- Single organization ("Greatstone Design"). The org switcher is present but only lists one org.
- Roles: admin, designer, accounting, viewer. The demo user is admin.
- The UI language is English. `es.js` mirrors every key and is switchable from the user menu.
- React 18.3 + React Router 6.30 + Vite 6 are used as stable, widely supported versions.
