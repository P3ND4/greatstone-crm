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
   │  ├─ comms/         ChannelHeader · ConversationList · Bubbles · WaComposer · ContactPanel
   │  └─ charts/        ChartCard (with table view) · RevenueExpensesChart · HBarChart
   ├─ hooks/            useResource · useUrlState · useListState · useForm · useHotkey · useFocusTrap · useScrollLock · useCssVars
   ├─ services/         client.js (mock adapter) · index.js (entity services) · dashboard · crm · communications · prospecting · search · lookup
   ├─ data/
   │  ├─ mock/          core.js · people.js · users.js · prospecting.js   (never imported by components)
   │  ├─ constants.js   static option lists (neighborhoods, services, sources)
   │  └─ schema.md      entities → DB model
   ├─ lib/              format (USD, dates) · random (seeded) · cx
   └─ pages/            dashboard/ · crm/{leads,contacts,pipeline,agenda,communications,prospecting}/ · system/ (placeholder, 404)
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
| `/projects` · `/projects/:id` | Projects / project detail | placeholder |
| `/finance/estimates` · `/invoices` · `/expenses` · `/reports` | Finance | placeholder |
| `/ai` | AI hub | placeholder |
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
| Record payment | Modal | sm |
| Pickers (contact, project, template) | Modal | md |
| Quick preview (attachment, estimate) | Modal | lg |
| New / edit **Lead** (full) | **Page** `/crm/leads/new` | — |
| Contact record | Page | — |
| New / edit Project · Project detail (tabs) | Page | — |
| Estimate / Invoice builder | Page | — |
| Opportunity detail | Page `/crm/pipeline/:id` | — |
| Delete appointment | Modal (`ConfirmDialog`) | sm |
| Appointment full detail | Page `/crm/agenda/:id` | — |
| Lead detail · Edit lead | Page `/crm/leads/:id` · `/edit` | — |
| WhatsApp reply / internal note | Inline composer in the thread pane | — |
| Email quick reply | Inline panel in the reading pane | — |
| Email composer · expanded conversation | Page `/crm/communications/email/compose` · `/:channel/:id` | — |
| Campaign / sequence | Page | — |
| Settings sections | Page (tabs) | — |

**Shared anatomy** (`FormShell`): fixed header (title + ✕ or Back) · body that scrolls vertically only · fixed footer (Cancel / Save + save state).
Field grids collapse from 2 columns to 1 below 640px. Textareas auto-grow and then scroll internally.
Validation is inline, focus goes to the first invalid field, **Esc** closes (it asks first if there are changes), **Ctrl/⌘+Enter** saves, focus is trapped, and background scroll is locked.
