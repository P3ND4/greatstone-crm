# Structure

```
greatstone-crm/
├─ index.html · vite.config.js · vercel.json (SPA rewrite)
├─ docs/brief/          original prompt (PDF + text)
├─ docs/screenshots/
└─ src/
   ├─ main.jsx          providers (i18n, toasts) + router
   ├─ app/
   │  ├─ router.jsx     route map
   │  └─ navigation.js  sidebar / palette nav config
   ├─ styles/
   │  ├─ tokens.css     ← all design tokens (brand lives here)
   │  ├─ base.css       reset, typography, helpers (mobile-first)
   │  ├─ components.css UI component styles
   │  └─ layout.css     sidebar, topbar, shells, palette, dashboard
   ├─ i18n/             en.js · es.js (same keys) · index.jsx (useT)
   ├─ components/
   │  ├─ ui/            Button, IconButton, Field, Input, Select, Textarea (auto-grow), DatePicker,
   │  │                 Card, Badge, Avatar, Tabs, SegmentedControl, Table, Pagination, Menu,
   │  │                 Toast, EmptyState, Skeleton, DataState, Kpi, Kanban, RichTextEditor
   │  ├─ shells/        FormShell · ModalShell · PageShell · FormPage · BackButton · ConfirmDialog
   │  ├─ layout/        AppLayout · Sidebar (collapsible) · Topbar (2 rows) · ModuleNav (modules + submodules rows) · CommandPalette
   │  ├─ quick/         QuickActionsProvider + Task / Appointment / Note / Contact modals
   │  ├─ list/          ListToolbar · SearchInput · FilterSelect · ViewToggle
   │  ├─ crm/           shared cells (PersonCell, Score, StatusBadge, RowMenu, UserChip)
   │  ├─ ai/            AiModuleShell (run / configure / history) · AssistantChat · AssistantLauncher (floating)
   │  ├─ finance/       DocPreview (paper + print) · LineEditor · TotalsBox
   │  ├─ comms/         ChannelHeader · ConversationList · Bubbles · WaComposer · ContactPanel
   │  └─ charts/        ChartCard (with table view) · RevenueExpensesChart · HBarChart
   ├─ hooks/            useResource · useUrlState · useListState · useForm · useHotkey · useFocusTrap · useScrollLock · useCssVars
   ├─ services/         client.js (mock adapter) · index.js (entity services) · dashboard · crm · communications · prospecting · projects · finance · ai · search · lookup
   ├─ data/
   │  ├─ mock/          core.js · people.js · users.js · prospecting.js · projectDetails.js · finance.js · ai.js   (never imported by components)
   │  ├─ constants.js   static option lists (neighborhoods, services, sources)
   │  └─ schema.md      entities → DB model
   ├─ lib/              format (USD, dates) · money (exact cents) · random (seeded) · cx
   └─ pages/            dashboard/ · crm/{leads,contacts,pipeline,agenda,communications,prospecting}/ · projects/ (+ tabs/) · finance/ · ai/ · system/ (placeholder, 404)
```

## Routes

| Route | Screen | Status |
|---|---|---|
| `/` | Dashboard (`?range=`) | ✅ |
| `/crm/communications/whatsapp?c=&f=&q=` | WhatsApp inbox (list · thread · contact panel) | ✅ |
| `/crm/communications/email?folder=&label=&c=&q=` | Email (folders · list · reader) | ✅ |
| `/crm/communications/email/compose?to=&reply=` | Email composer (page) | ✅ |
| `/crm/communications/:channel/:id` | Expanded conversation (page) | ✅ |
| `/crm/agenda?view=&date=&type=&assignee=` · `/crm/agenda/:id` | Calendar / appointment page | ✅ |
| `/crm/contacts?tab=&q=&hood=&owner=&view=` · `/crm/contacts/:id?tab=` | Contacts / contact page | ✅ |
| `/crm/leads?status=&source=&service=&assignee=&view=` · `/new` · `/:id` · `/:id/edit` | Leads / new / lead page / edit | ✅ |
| `/crm/prospecting?tab=&list=&segment=&status=` | Prospects · lists · campaigns · sequences | ✅ |
| `/crm/pipeline?owner=&q=` · `/crm/pipeline/:id` | Kanban / opportunity page | ✅ |
| `/projects?status=&manager=&hood=&view=` | Projects list (table / cards) | ✅ |
| `/projects/new` · `/projects/:id/edit` | New / edit project (page) | ✅ |
| `/projects/:id?tab=` | Project detail (11 tabs) | ✅ |
| `/finance/estimates?status=&project=` · `/new` · `/:id` · `/:id/edit` | Estimates list / builder / detail with PDF preview | ✅ |
| `/finance/invoices?status=&project=` · `/new` · `/:id` · `/:id/edit` | Invoices list / builder / detail + payments | ✅ |
| `/finance/expenses?type=&status=&category=&project=` | Expenses & purchase orders | ✅ |
| `/finance/reports?range=` | Payments & reports | ✅ |
| `/ai` | AI hub | ✅ |
| `/ai/communications` · `/prospecting` · `/lead-finder` · `/patterns` · `/email-mining` · `/campaigns` (`?view=results\|config\|history`) | AI modules | ✅ |
| `/ai/assistant` | AI assistant (full page; also floating panel everywhere) | ✅ |
| `/settings` | Settings | placeholder |

## Action → Modal or Page

Rule of thumb: a short, self-contained action with roughly 6 fields or fewer opens a **modal**. A long flow, sections or tabs, or more than 6 fields opens a **page** with ← Back.

| Action | Pattern | Size |
|---|---|---|
| Confirm / delete / discard changes | Modal (`ConfirmDialog`) | sm |
| New / edit task | Modal | sm |
| New / edit note | Modal | sm |
| New / edit appointment (quick) | Modal | md |
| Quick add / edit contact | Modal | md |
| Record payment (`PaymentModal`) | Modal | sm |
| Document preview · photo lightbox | Modal | lg |
| Change selection status | Inline select in the table | — |
| Project note | Inline form in the Notes tab | — |
| Pickers (contact, project, template) | Modal | md |
| Quick preview (attachment, estimate) | Modal | lg |
| New / edit **Lead** (full) | **Page** `/crm/leads/new` | — |
| Contact record | Page | — |
| New / edit Project · Project detail (tabs) | Page | — |
| Estimate / Invoice builder (line items, live totals, preview) | Page `/finance/{estimates,invoices}/new` · `/:id/edit` | — |
| New expense / purchase order (`ExpenseModal`) | Modal | md |
| Receipt preview | Modal | md |
| Approve / reject expense | Inline (row or bulk) | — |
| Opportunity detail | Page `/crm/pipeline/:id` | — |
| Delete appointment | Modal (`ConfirmDialog`) | sm |
| Appointment full detail | Page `/crm/agenda/:id` | — |
| Lead detail · Edit lead | Page `/crm/leads/:id` · `/edit` | — |
| WhatsApp reply / internal note | Inline composer in the thread pane | — |
| Email quick reply | Inline panel in the reading pane | — |
| Email composer · expanded conversation | Page `/crm/communications/email/compose` · `/:channel/:id` | — |
| Campaign / sequence | Page | — |
| AI assistant (floating) | Side panel (non-blocking) | 420px |
| AI module configuration | Configure view inside the module page | — |
| Settings sections | Page (tabs) | — |

**Shared anatomy** (`FormShell`): fixed header (title + ✕ or Back) · body that scrolls vertically only · fixed footer (Cancel / Save + save state).
Field grids collapse from 2 columns to 1 below 640px. Textareas auto-grow and then scroll internally.
Validation is inline, focus goes to the first invalid field, **Esc** closes (it asks first if there are changes), **Ctrl/⌘+Enter** saves, focus is trapped, and background scroll is locked.
