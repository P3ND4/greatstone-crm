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
| **prospects** | id, list_id, segment (architect, property_manager, hoa_board, builder, developer, brokerage, agent), company, contact fields, status, sequence_id, last_touch_at |
| **opportunities** | id, title, lead_id, contact_id, stage (`new` \| `contacted` \| `consultation` \| `proposal` \| `negotiation` \| `won` \| `lost`), value, probability, next_action, next_action_at, stage_entered_at, owner_id, closed_at |
| **pipeline_stages** | id, key, label, order, probability |
| **projects** | id, name, client_id, status (`planning` \| `design` \| `permits` \| `construction` \| `finishing` \| `completed` \| `onHold`), address, neighborhood, start_date, end_date, budget, spent (derived from expenses), progress 0–1, contract_value, manager_id |
| **rooms** | id, project_id, name, area_sqft, scope |
| **tasks** | id, title, due_at, priority (`low` \| `medium` \| `high`), done, project_id, assignee_id, notes |
| **selections** | id, project_id, room_id, category, item, vendor_id, unit_cost, qty, status (proposed/approved/ordered/delivered), approved_at |
| **estimates** | id, number, project_id, client_id, status (`draft` \| `sent` \| `viewed` \| `accepted` \| `declined` \| `expired`), created_at, expires_at, total, terms; estimate_lines(id, estimate_id, description, qty, unit_price, tax_rate, discount) |
| **invoices** | id, number, project_id, client_id, status (`draft` \| `sent` \| `partial` \| `paid` \| `overdue`), issued_at, due_at, total, paid, paid_at; invoice_lines (same as estimate_lines) |
| **payments** | id, invoice_id, amount, method, received_at, reference |
| **expenses** | id, type (`expense` \| `po`), project_id (null = overhead), vendor_id → contacts, category, amount, date, status (`pending` \| `approved` \| `rejected`), receipt_url |
| **approvals** | id, kind (`estimate` \| `po` \| `selection` \| `changeOrder`), ref_id, project_id, amount, requested_at, decided_at, decided_by |
| **communications** (conversations) | id, channel (`whatsapp` \| `email`), contact_id, project_id, subject, last_message, last_message_at, last_direction (`in` \| `out`), unread, assignee_id, labels[] |
| **messages** | id, conversation_id, direction, body, attachments[], status (sent/delivered/read), is_internal_note, sent_at, author_id |
| **appointments** | id, type (`consultation` \| `siteVisit` \| `showroom` \| `virtual` \| `install`), title, start, duration_min, location, contact_id, project_id, assignee_id |
| **notes** | id, body, project_id, contact_id, author_id |
| **ai_runs** | id, module, params(json), status, started_at, finished_at, results(json) |
| **campaigns** | id, platform (`meta` \| `google`), name, status, spend, leads, cpl, roas, period |

## Dashboard view
`dashboardService.getSummary({ range })` returns `{ kpis, charts: { monthly, funnel, leadsBySource, projectsByStatus }, lists: { appointments, tasks, unanswered, budgetRisk, approvals }, health }`.
In production this should be one SQL view or RPC. Revenue = payments received in the range (`paid_at`).
A missing value must come back as `null`, and the UI shows it as "—".
