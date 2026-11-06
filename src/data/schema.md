# Data schema (UI contract → future database)

Entities and fields the UI uses today. Mock data lives in `src/data/mock/`, and it is only read through
`src/services/*`. Supabase or the API can replace the services without touching components.
Conventions: `id` text/uuid, timestamps ISO-8601 (UTC), money in USD as `numeric(12,2)`, and `*_id` = FK.
Every table also gets `org_id` (multi-organization) plus `created_at` / `updated_at`.

| Entity | Fields used by the UI |
|---|---|
| **organizations** | id, name, plan, logo_url, brand_colors |
| **users** | id, name, email, role (`admin` \| `designer` \| `accounting` \| `viewer`), title, color |
| **contacts** | id, type (`client` \| `partner` \| `referrer` \| `architect` \| `contractor`), first_name, last_name, name, email, phone, company, specialty, neighborhood, address, source, tags[], owner_id |
| **partners** | contacts where type ∈ (partner, contractor); plus project_partners(project_id, contact_id, role) |
| **leads** | id, first_name, last_name, name, email, phone, start_when (`asap` \| `1-3m` \| `3-6m` \| `6m+` \| `unsure`), description, source, referred_by_id → contacts, budget, service_type, neighborhood, score 0–100, status (`new` \| `contacted` \| `qualified` \| `converted` \| `disqualified`), assignee_id |
| **prospect_lists** | id, name, segment, description |
| **prospects** | id, list_id, segment (architect, propertyManager, hoaBoard, builder, developer, brokerage, agent), company, name, role, email, phone, neighborhood, status (`new` \| `contacted` \| `replied` \| `meeting` \| `converted` \| `notInterested`), score, sequence_id, step, last_touch_at, next_touch_at, owner_id |
| **sequences** | id, name, channel; sequence_steps(id, sequence_id, day, channel, subject, body) |
| **opportunities** | id, title, lead_id, contact_id, stage (`new` \| `contacted` \| `consultation` \| `proposal` \| `negotiation` \| `won` \| `lost`), value, probability, next_action, next_action_at, stage_entered_at, owner_id, closed_at |
| **pipeline_stages** | id, key, label, order, probability |
| **projects** | id, name, description, partner_ids (→ project_partners), client_id, status (`planning` \| `design` \| `permits` \| `construction` \| `finishing` \| `completed` \| `onHold`), address, neighborhood, start_date, end_date, budget, spent (derived from expenses), progress 0–1, contract_value, manager_id |
| **rooms** | id, project_id, name, area_sqft, scope[] (items), status (`design` \| `inProgress` \| `done`) |
| **project_phases** | id, project_id, key (discovery, design, approvals, procurement, construction, install, punchlist), start, end, progress 0–1 |
| **budget_lines** | id, project_id, category (design, labor, materials, furniture, subcontractors, permits, freight), budget; actual = sum(expenses by category) |
| **documents** | id, project_id, type (`plans` \| `renders` \| `contracts` \| `permits`), name, size, url, status (`approved` \| `pending` \| `submitted` \| `signed`), uploaded_at, uploaded_by |
| **photos** | id, project_id, room_id, kind (`before` \| `progress` \| `after`), caption, url, taken_at |
| **project_notes** | id, project_id, body, author_id, created_at |
| **tasks** | id, title, due_at, priority (`low` \| `medium` \| `high`), done, project_id, assignee_id, notes |
| **selections** | id, project_id, room_id, category, item, unit, qty, unit_cost, vendor_id, lead_time_weeks, status (`proposed` \| `approved` \| `ordered` \| `delivered` \| `installed`), approved_at |
| **estimates** | id, number, project_id, client_id, status (`draft` \| `sent` \| `viewed` \| `accepted` \| `declined` \| `expired`), created_at, expires_at, total, terms; estimate_lines(id, estimate_id, description, qty, unit_price, tax_rate, discount) |
| **invoices** | id, number, project_id, client_id, status (`draft` \| `sent` \| `partial` \| `paid` \| `overdue`), issued_at, due_at, total, paid, paid_at; invoice_lines (same as estimate_lines) |
| **payments** | id, invoice_id, amount, method, received_at, reference |
| **expenses** | id, type (`expense` \| `po`), project_id (null = overhead), vendor_id → contacts, category, amount, date, status (`pending` \| `approved` \| `rejected`), receipt_url |
| **approvals** | id, kind (`estimate` \| `po` \| `selection` \| `changeOrder`), ref_id, project_id, amount, requested_at, decided_at, decided_by |
| **communications** (conversations) | id, channel (`whatsapp` \| `email`), contact_id, project_id, subject, labels[], folder (`inbox` \| `sent` \| `drafts` \| `archive` \| `trash`; email only), starred, last_message, last_message_at, last_direction (`in` \| `out`), last_inbound_at (→ WhatsApp 24h window), unread, assignee_id, to/cc/bcc |
| **messages** | id, conversation_id, channel, direction (`in` \| `out`), body, attachments[] {name,size,type,url}, status (`sent` \| `delivered` \| `read`), is_note, sent_at, author_id |
| **templates** | id, channel, name, subject, body, approved (WhatsApp) |
| **appointments** | id, type (`consultation` \| `siteVisit` \| `showroom` \| `virtual` \| `install`), title, start, duration_min, location, contact_id, project_id, assignee_id |
| **notes** | id, body, project_id, contact_id, author_id |
| **ai_runs** | id, module, params(json), status, started_at, finished_at, results(json) |
| **campaigns** | outreach: id, name, list_id, sequence_id, status (`active` \| `paused` \| `draft`), started_at · ads (AI module, later): id, platform (`meta` \| `google`), name, status, spend, leads, cpl, roas, period |

## Dashboard view
`dashboardService.getSummary({ range })` returns `{ kpis, charts: { monthly, funnel, leadsBySource, projectsByStatus }, lists: { appointments, tasks, unanswered, budgetRisk, approvals }, health }`.
In production this should be one SQL view or RPC. Revenue = payments received in the range (`paid_at`).
A missing value must come back as `null`, and the UI shows it as "—".
