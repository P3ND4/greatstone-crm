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

## Data
- Mock data is generated **deterministically, relative to today**, so the demo always looks current. All people are fictional: phones `(305) 555-01xx`, emails `@example.com`.
- Revenue = payments received (`paid_at`) inside the range. Outstanding = sent + partial + overdue (total − paid).
- "Budget risk" = active project where budget used − progress > 10 points.
- Services simulate 180–420 ms of latency, so skeletons and loading states are exercised.

## Assumptions
- Single organization ("Greatstone Design"). The org switcher is present but only lists one org.
- Roles: admin, designer, accounting, viewer. The demo user is admin.
- The UI language is English. `es.js` mirrors every key and is switchable from the user menu.
- React 18.3 + React Router 6.30 + Vite 6 are used as stable, widely supported versions.
