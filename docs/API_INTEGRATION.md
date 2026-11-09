# Wiring a real backend — integration guide

Phase 1 is a complete UI on mock data. This guide explains **exactly what to replace** to connect a real API (Supabase or a custom REST/Node API) **without touching components**. It is written for whoever builds phase 2 (Marcos).

> **TL;DR**
> 1. Only `src/services/*` knows the data is fake. Replace the body of each service function with a real call that returns **the same shape**.
> 2. Start with **Auth** (`authService` + `SessionProvider`), then the shared list contract, then module by module.
> 3. Every computed number the UI shows (totals, KPIs, reports, AI analyses) has one service function. Move that logic to the server (SQL view / RPC / endpoint).
> 4. Delete the mock-only helpers listed at the end.

---

## 1. How data flows today

```
Component ──► hook (useResource / useForm / useListState) ──► src/services/<domain>Service.js ──► src/services/client.js
   (UI)          loading · error · refetch · URL state            business contract (async)          mock tables + delay()
```

- Components **never** import `src/data/mock/*`. They call services and receive plain JSON.
- Every service function is `async` and returns a Promise (mock latency 180–420 ms), so loading, error and empty states are already handled in the UI.
- Errors: throw an `Error` with a `status` (`403` shows the "No access" state, anything else shows "Something went wrong · Try again").
- `client.js` exports `delay()`, `table()` and `createCrudService()` — these disappear in phase 2.

### The list contract (used by every table / list)

```js
service.list({
  q: 'grove',                 // free-text search
  page: 1, pageSize: 15,      // 1-based pagination
  sort: 'createdAt:desc',     // field:asc|desc
  where: {                    // only serializable values (no functions)
    status: 'qualified',          // equality
    type: ['client', 'partner'],  // any of
    unread: { gt: 0 },            // range: gt | gte | lt | lte
  },                          // '' / null / undefined values are ignored
}) // → Promise<{ items: Row[], total: number }>
```

| UI param | REST query string | Supabase (PostgREST / supabase-js) |
|---|---|---|
| `q` | `?q=grove` | `.or('name.ilike.%grove%,email.ilike.%grove%')` or a full-text index (`.textSearch`) |
| `page`, `pageSize` | `?page=2&pageSize=15` | `.range((page-1)*size, page*size-1)` + `{ count: 'exact' }` → `total` |
| `sort` | `?sort=createdAt:desc` | `.order('created_at', { ascending: false })` |
| `where.status = 'x'` | `?status=x` | `.eq('status', 'x')` |
| `where.type = ['a','b']` | `?type=a,b` | `.in('type', ['a','b'])` |
| `where.unread = { gt: 0 }` | `?unread[gt]=0` | `.gt('unread', 0)` |

Field names: the UI uses **camelCase**; the database uses **snake_case** (`createdAt` ↔ `created_at`). Convert in the service layer (one `toCamel()/toSnake()` helper), never in components.

---

## 2. Choose the backend path

| | **A. Supabase (recommended in the brief)** | **B. Custom REST API** |
|---|---|---|
| Auth | Supabase Auth (email + password, magic link, invitations) | JWT / session cookie from your API |
| Data | Postgres tables + RLS, queried with `supabase-js` | `fetch` to `/api/...` |
| Files | Supabase Storage (signed URLs) | S3 / R2 + presigned URLs |
| Realtime | Supabase Realtime (`postgres_changes`) | WebSocket / SSE |
| Server logic | Edge Functions + SQL views / RPC | Your endpoints |

Both paths keep the same service signatures. The examples below show both.

### Environment variables (`.env.local`, and in Railway → Variables)

```
VITE_DATA_SOURCE=api          # mock | api — lets you switch service by service while migrating
VITE_API_URL=https://api.greatstone.example     # path B
VITE_SUPABASE_URL=https://xxxx.supabase.co      # path A
VITE_SUPABASE_ANON_KEY=eyJ...                    # path A (public, protected by RLS)
VITE_VAPID_PUBLIC_KEY=...                        # web push (optional)
```

- `VITE_*` values end up **in the browser bundle**: never put secrets there (service-role keys, WhatsApp/Meta tokens, OpenAI keys, SMTP passwords). Those live only on the server / Edge Functions.
- Vite reads them **at build time** → redeploy after changing them.
- Add the API / Supabase origins to the `Content-Security-Policy` in `Caddyfile`: `connect-src 'self' https://xxxx.supabase.co wss://xxxx.supabase.co` and, for Storage images, `img-src 'self' data: blob: https://xxxx.supabase.co`.

### A tiny HTTP client (path B) — `src/services/http.js`

```js
const BASE = import.meta.env.VITE_API_URL;
let getToken = () => null;      // set by authService after sign-in
let onUnauthorized = () => {};  // set by SessionProvider → signOut + redirect to /login?next=

export const configureHttp = (opts) => { ({ getToken = getToken, onUnauthorized = onUnauthorized } = opts); };

export async function http(path, { method = 'GET', query, body, signal } = {}) {
  const url = new URL(path, BASE);
  Object.entries(query || {}).forEach(([k, v]) => { if (v !== '' && v != null) url.searchParams.set(k, Array.isArray(v) ? v.join(',') : v); });
  const res = await fetch(url, {
    method, signal, credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) { onUnauthorized(); throw Object.assign(new Error('unauthorized'), { status: 401 }); }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw Object.assign(new Error(data?.message || res.statusText), { status: res.status, code: data?.code, fields: data?.fields });
  return data;
}
```

**Error format the UI expects** (any backend): `{ status, code, message, fields? }`. `fields` (`{ email: 'Already in use' }`) can be shown inline by `useForm` (map it to `errors`).

---

## 3. Auth (do this first)

The UI already has: `/login`, `/forgot-password`, a route guard (`RequireAuth` → `/login?next=…`), sign out from the user menu, session restore on reload, "Keep me signed in", lockout after 5 failed attempts, and **no account enumeration** on password reset.

Contract (`src/services/authService.js`):

| Function | Returns | Errors (`error.code`) |
|---|---|---|
| `restore()` (sync, on app start) | `{ userId, token, expiresAt } \| null` | — |
| `signIn({ email, password, remember })` | `{ user, session }` | `invalid_credentials` · `user_inactive` · `too_many_attempts` (+ `retryIn` seconds) |
| `signOut()` | `{ ok }` | — |
| `requestPasswordReset(email)` | `{ ok }` (always) | — |

The error codes map to translated messages in `i18n` (`auth.errors.*`). Keep the same codes and the UI needs no change.

**Path A — Supabase**

```js
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: true, storage: remember ? localStorage : sessionStorage },
});

async signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw Object.assign(new Error(error.message), { code: error.status === 400 ? 'invalid_credentials' : 'unknown' });
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
  if (profile.status === 'inactive') { await supabase.auth.signOut(); throw Object.assign(new Error('inactive'), { code: 'user_inactive' }); }
  auth.userId = profile.id;
  return { user: toCamel(profile), session: data.session };
},
signOut: () => supabase.auth.signOut(),
requestPasswordReset: (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/reset-password` }),
```

- `restore()` becomes `supabase.auth.getSession()` (async). Make `SessionProvider` start with `loading` and render a splash until it resolves.
- Subscribe to `supabase.auth.onAuthStateChange` in `SessionProvider` to react to token refresh / sign-out in another tab.
- Login lockout: Supabase has its own rate limits. Map `429` to `too_many_attempts`.

**Path B — REST**

| Endpoint | Body | Response |
|---|---|---|
| `POST /auth/login` | `{ email, password, remember }` | `{ user, accessToken, expiresAt }` + `refresh_token` as **httpOnly, Secure, SameSite=Lax cookie** |
| `POST /auth/refresh` | (cookie) | `{ accessToken, expiresAt }` |
| `POST /auth/logout` | — | `204` (clears cookie) |
| `POST /auth/password-reset` | `{ email }` | `204` always |
| `POST /auth/password-reset/confirm` | `{ token, password }` | `204` |
| `GET /me` | — | current user + role + `permissions` matrix |

- Keep the access token **in memory** (not localStorage). On reload, call `/auth/refresh` (cookie) to get a new one.
- On any `401`: try one refresh; if it fails → `signOut()` and navigate to `/login?next=<current path>` (the login page already honours `next`, only same-app paths).

**Screens still to add with the real backend:** `/reset-password` (new password form from the email link) and `/accept-invite` (invited user sets a password). Use `AuthLayout` so they match.

**Current user inside services:** `client.js` exports `auth.userId` / `currentUserId()`. Services that stamp authorship (notes, messages, invitations…) use it. With a real backend the server derives the author from the token — drop the parameter.

---

## 4. Roles & permissions

- Roles: `admin`, `designer`, `accounting`, `viewer` (on `profiles.role`).
- Matrix (`role_permissions`): module × role → `none | view | full` (Settings → Users & roles edits it). Admin is always `full`.
- The UI reads it synchronously through `settingsSnapshot.access(role, module)`. Load it once after sign-in (`GET /me` or `select * from role_permissions`) into the settings cache, then refresh it when it is saved.
- **The UI is not the security boundary.** Enforce the same matrix on the server. Supabase example:

```sql
create function public.can(p_module text, p_level text) returns boolean language sql stable as $$
  select case
    when (select role from profiles where id = auth.uid()) = 'admin' then true
    else exists (
      select 1 from role_permissions rp join profiles p on p.role = rp.role
      where p.id = auth.uid() and rp.module = p_module
        and (rp.level = 'full' or (rp.level = 'view' and p_level = 'view'))
    ) end $$;

alter table invoices enable row level security;
create policy "finance read"  on invoices for select using (can('finance', 'view'));
create policy "finance write" on invoices for all    using (can('finance', 'full')) with check (can('finance', 'full'));
```

- "View as role" (Settings) is a UI preview only. Keep it admin-only once real auth exists.
- Phase 1 only enforces `none` (no-access page) and read-only Settings. When the server returns `403` on writes for `view` roles, the UI already shows an error toast; hiding create/edit buttons per role is a UI polish task for phase 2.

---

## 5. Service-by-service map

Each row: current function → suggested REST endpoint → Supabase equivalent. Response shapes are those the UI already consumes (see `src/data/schema.md` for fields).

### CRM

| Service function | REST | Supabase |
|---|---|---|
| `leadsService.list(params)` | `GET /leads?q&page&pageSize&sort&status&source&serviceType&assigneeId` | `from('leads')` + list contract |
| `leadsService.get(id)` / `create` / `update` / `remove` | `GET/POST/PATCH/DELETE /leads/:id` | `select / insert / update / delete` |
| `crmService.lead(id)` | `GET /leads/:id?include=activity,referrer,assignee` | view `lead_detail` or RPC |
| `contactsService.*` | `/contacts` (filters `type`, `neighborhood`, `ownerId`) | `from('contacts')` |
| `crmService.contact(id)` | `GET /contacts/:id?include=projects,invoices,conversations` | view / RPC |
| `crmService.pipeline({ ownerId })` | `GET /pipeline?ownerId=` → `{ stages, items }` | `from('opportunities')` + `pipeline_stages` |
| `crmService.moveOpportunity(id, stage)` | `PATCH /opportunities/:id { stage }` | `update` (+ trigger sets `stage_entered_at`) |
| `crmService.opportunity(id)` | `GET /opportunities/:id` | `select` with joins |
| `appointmentsService.*` | `/appointments?from&to&type&assigneeId` | `from('appointments')` (+ Google Calendar sync on the server) |
| `tasksService.*` / `notesService.*` | `/tasks`, `/notes` | tables |
| `prospectingService.lists / prospects / overview / campaigns / sequences` | `GET /prospect-lists`, `/prospects`, `/prospecting/overview`, `/campaigns`, `/sequences` | tables + a view for `overview` |
| `prospectingService.update(ids, patch)` | `PATCH /prospects { ids, patch }` (bulk) | `update().in('id', ids)` |
| `prospectingService.convertToLead(id)` | `POST /prospects/:id/convert` → lead | RPC `convert_prospect(id)` (transaction) |

### Communications (WhatsApp + email)

| Service function | REST | Supabase |
|---|---|---|
| `communicationsService.list({ channel, q, folder, label, starred, unread, assigneeId })` | `GET /conversations?...` | `from('conversations')` |
| `counts(channel)` | `GET /conversations/counts?channel=` | view / RPC |
| `thread(id)` | `GET /conversations/:id/messages` | `from('messages').eq('conversation_id', id)` |
| `markRead(id)` | `POST /conversations/:id/read` | `update unread = 0` |
| `send(id, { body, isNote, attachments })` | `POST /conversations/:id/messages` | Edge Function `send-message` |
| `update(ids, patch)` (archive, star, label…) | `PATCH /conversations` (bulk) | `update().in('id', ids)` |
| `compose({ to, cc, bcc, subject, body, draft })` | `POST /emails` | Edge Function `send-email` |

- **Sending never happens from the browser.** The server calls the WhatsApp Cloud API / Gmail or Microsoft Graph with tokens stored server-side (Settings → Channels only shows the connection state).
- **Inbound:** WhatsApp / email webhooks → server stores the message → Realtime pushes it to the UI. In the UI, subscribe in `WhatsAppPage` / `EmailPage` and call `refetch()`:

```js
useEffect(() => {
  const ch = supabase.channel('inbox').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, refetch).subscribe();
  return () => supabase.removeChannel(ch);
}, [refetch]);
```

- The **24-hour WhatsApp window** is computed from `last_inbound_at`. Only templates with `status = 'approved'` can be sent outside it (the composer already filters them).
- Templates and the email signature come from Settings (`settingsService.templates()` / `channels()`).

### Projects

| Service function | REST | Supabase |
|---|---|---|
| `projectsService.list(params)` | `GET /projects?status&managerId&neighborhood` | view `projects_with_metrics` (spent, progress, margin) |
| `projectsService.get(id)` | `GET /projects/:id?include=rooms,phases,tasks,selections,budget,documents,photos,notes` | several selects in parallel, or one RPC |
| `create` / `update` | `POST /projects`, `PATCH /projects/:id` | insert / update |
| `addNote(id, body)` | `POST /projects/:id/notes` | insert `project_notes` |
| `updateSelection(id, selectionId, patch)` | `PATCH /projects/:id/selections/:sid` | update `selections` |
| `addDocuments(id, files, type)` | `POST /projects/:id/documents` (after upload, see Files) | Storage upload + insert `documents` |

`projectMetrics` (spent, budget used, projected margin, "at budget risk") is computed in `projectsService.js` today — move it to a SQL view so lists, the dashboard and reports agree.

### Finance

| Service function | REST | Supabase |
|---|---|---|
| `estimatesApi.list / summary / get / save / setStatus / remove` | `/estimates` (+ `GET /estimates/summary`, `POST /estimates/:id/status`) | table + view for summary |
| `estimatesApi.draft(...)` | **client-side** (uses settings defaults) | — |
| `invoicesApi.*` | `/invoices` (same as estimates) | — |
| `financeService.convertToInvoice(estimateId)` | `POST /estimates/:id/convert` → invoice | RPC (transaction) |
| `financeService.recordPayment(invoiceId, payment)` | `POST /invoices/:id/payments` | RPC: insert payment + update `paid` / `status` atomically |
| `financeService.sendReminder(invoiceId)` | `POST /invoices/:id/reminders` | Edge Function (email) |
| `financeService.expenses(params)` / `createExpense` / `setExpenseStatus(ids, status)` | `/expenses`, `PATCH /expenses { ids, status }` | table |
| `financeService.reports({ range })` | `GET /reports?range=ytd` | RPC `finance_report(from, to)` |
| `financeService.settings()` / `catalog()` | from settings cache (sync) | loaded at sign-in |

**Money rules the server must replicate exactly** (`src/lib/money.js`): work in integer cents; per line `base = round(qty × unitPrice)`, `discount = round(base × pct / 100)`, `net = base − discount`, `tax = taxable ? round(net × taxRate) : 0` (each rounded half-up to the cent, per line, never on the document total); document total = sum of line totals. Each estimate/invoice stores its own `tax_rate` (snapshot), so changing the rate in Settings never changes old documents. Never trust a total sent by the client: recompute on save.

PDF: phase 1 uses the browser's print-to-PDF of `DocPreview`. For emailing PDFs, render the same layout server-side (e.g. Playwright / a PDF service).

### Dashboard, search, lookups

| Service function | REST | Supabase |
|---|---|---|
| `dashboardService.getSummary({ range })` | `GET /dashboard?range=thisMonth` | RPC `dashboard_summary(from, to)` |
| `searchService.query(q)` | `GET /search?q=` (contacts, leads, projects, invoices…) | RPC with full-text search |
| `lookupService.user / contact / project / conversation / users / projectOptions / contactOptions` | **sync today** | see below |

`lookupService` is synchronous (it labels ids in tables and fills selects). Replace it with a small **reference cache** loaded after sign-in (`GET /lookups` → users, projects (id, name), contacts (id, name, type)) and refreshed after creates/updates. Keep the same function names.

### Settings

| Service function | REST | Supabase |
|---|---|---|
| `organization()` / `saveOrganization(data)` | `GET/PUT /settings/organization` | `organizations` |
| `profile(userId)` / `saveProfile` | `GET/PATCH /me` | `profiles` |
| `team()` / `setRole` / `setUserStatus` | `GET /users`, `PATCH /users/:id` | `profiles` (admin only) |
| `invite` / `resendInvite` / `revokeInvite` | `POST /invitations`, `POST /invitations/:id/resend`, `DELETE /invitations/:id` | `auth.admin.inviteUserByEmail` in an Edge Function |
| `permissions()` / `savePermissions(matrix)` | `GET/PUT /settings/permissions` | `role_permissions` |
| `channels()` / `saveChannels` / `setChannelConnected` | `/settings/channels` + OAuth endpoints | `channel_settings` (tokens in a server-only table / Vault) |
| `templates()` / `saveTemplate` / `setTemplateStatus` / `removeTemplate` | `/templates` | `templates` (WhatsApp status comes from Meta's webhook) |
| `catalog()` / `saveCatalogItem` / `removeCatalogItem` | `/catalog` | `catalog_items` |
| `billing()` / `saveBilling` | `/settings/billing` | `finance_settings` |
| `integrations()` / `setIntegration` | `/integrations` | `ad_accounts`, `ai_platforms` |
| `ai()` / `saveAi`, `notifications()` / `saveNotifications` | `/settings/ai`, `/settings/notifications` | `ai_settings`, `notification_rules` |

`settingsSnapshot` (sync reads for permissions, assistant on/off, brand accent) must read from the same cache that is filled after sign-in.

### AI

| Service function | REST | Supabase |
|---|---|---|
| `aiService.hub()` / `runs(module)` | `GET /ai/hub`, `GET /ai/runs?module=` | `ai_runs` |
| `aiService.run(module)` | `POST /ai/runs { module }` → job id; poll or Realtime | Edge Function / queue worker |
| `communications()`, `prospecting()`, `patterns()`, `emailMining()`, `campaigns()` | `GET /ai/<module>` (latest results) | `ai_runs.results` |
| `leadFinder()` / `saveLeadFinderConfig` / `togglePlatform` / `resolveResult(id, action)` | `/ai/lead-finder…` | tables |
| `toggleAdAccount(id)` | OAuth flow on the server | — |
| `ask(question)` (assistant) | `POST /ai/assistant { question, context }` (stream if possible) | Edge Function calling the LLM |

Rules already reflected in the UI: model keys only on the server; respect Settings → AI (data access toggles, tone, language); **human review** before anything is sent to a client; every AI screen keeps the "Demo data" badge until it is wired.

---

## 6. Files (documents, photos, receipts, logo)

1. UI asks the server for an upload URL: `POST /uploads { name, type, size, scope }` → `{ uploadUrl, fileUrl, id }` (Supabase: `storage.from('projects').createSignedUploadUrl(path)`).
2. Browser `PUT`s the file to `uploadUrl`.
3. UI calls the service (`addDocuments`, `createExpense({ receipt })`, `saveOrganization({ logo })`) with the returned `fileUrl` / `id`.
4. Private buckets: display with short-lived signed URLs. Limits: images ≤ 10 MB, PDFs ≤ 25 MB; validate type on the server.

Today the logo is a data URL in memory and receipts/documents store only a file name.

---

## 7. Notifications & PWA

- **Push:** create a VAPID key pair (public key → `VITE_VAPID_PUBLIC_KEY`, private key on the server). In Settings → My profile → This device, after `Notification.requestPermission()`, call `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` and `POST /push/subscriptions`. The server sends pushes according to `notification_rules`.
- The service worker is generated by Workbox (`generateSW`). To handle `push` / `notificationclick` events switch `vite-plugin-pwa` to `strategies: 'injectManifest'` with a small `src/sw.js`.
- **API caching:** add a Workbox `runtimeCaching` rule for `GET` API calls with `NetworkFirst` (short timeout) so lists still open offline with the last data. Never cache `/auth/*`. Writes while offline need a queue (Workbox Background Sync) — only if the studio needs offline editing on site visits.

---

## 8. Migration plan (checklist)

1. ☐ Create the database from `src/data/schema.md` (+ `org_id`, `created_at`, `updated_at` everywhere). Seed it with the mock data (export `src/data/mock/*` to JSON) so the UI looks the same on day one.
2. ☐ Add env vars and the HTTP / Supabase client. Update the CSP in `Caddyfile`.
3. ☐ **Auth:** replace `authService`; make `SessionProvider` async (`loading` splash); handle `401`; build `/reset-password` and `/accept-invite`.
4. ☐ Load the **reference cache** after sign-in: lookups, settings, permission matrix.
5. ☐ Generic CRUD: replace `createCrudService` with a real implementation that follows the list contract (one file for all tables).
6. ☐ Module by module (suggested order): Contacts & Leads → Pipeline & Agenda → Projects → Finance → Communications (webhooks + Realtime) → Prospecting → Settings → AI.
   Use `VITE_DATA_SOURCE` (or a per-service flag) to keep the rest on mocks while you migrate.
7. ☐ Move computed data to the server: project metrics, dashboard, finance summary and reports, AI analyses.
8. ☐ Enforce permissions with RLS / middleware; test with each demo role.
9. ☐ Files → Storage; push notifications (optional).
10. ☐ Remove mock-only code (below), the "Demo data" badges, and `X-Robots-Tag: noindex` in `Caddyfile` at launch.

### Mock-only code to delete at the end

| Where | What |
|---|---|
| `src/data/mock/*` | all mock data (keep as seed scripts if useful) |
| `src/services/client.js` | `delay()`, `table()`, mock `createCrudService`, `settings` objects |
| `src/services/authService.js` | `DEMO_PASSWORD`, `demoAccounts()`, client-side lockout (the server does it) |
| `src/pages/auth/LoginPage.jsx` | the "Demo access" block |
| `src/app/SessionProvider.jsx` | "View as role" → admin-only (or remove) |
| `aiService.js` | heuristics (replace with real AI endpoints) |

### Quick test after each step

- `npm run build && npm run preview` → sign in with each role → open every module (loading / empty / error / no-access states still appear correctly).
- Try a `401` (expired token) and a `403` (viewer on Finance) on purpose.
- Check money: 3 × $19.99 taxable + $0.10 taxable at 7% = **$64.28** must match server and UI.
