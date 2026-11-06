/*
 * Data client — the ONLY place that knows data is mock.
 * To connect Supabase/API later, replace the functions in this file (or each service)
 * with real calls; components and hooks keep the same contract:
 *   list(params) -> Promise<{ items, total }>, get(id) -> Promise<item>, create(data), update(id, data), remove(id)
 */
import * as db from '../data/mock/core.js';
import { users } from '../data/mock/users.js';
import * as pros from '../data/mock/prospecting.js';
import * as fin from '../data/mock/finance.js';
import * as ai from '../data/mock/ai.js';

const LATENCY = [180, 420];
const tables = {
  contacts: db.contacts,
  leads: db.leads,
  opportunities: db.opportunities,
  projects: db.projects,
  invoices: db.invoices,
  estimates: db.estimates,
  expenses: db.expenses,
  appointments: db.appointments,
  tasks: db.tasks,
  conversations: db.conversations,
  approvals: db.approvals,
  messages: db.messages,
  prospects: pros.prospects,
  prospectLists: pros.prospectLists,
  sequences: pros.sequences,
  campaigns: pros.campaigns,
  payments: fin.payments,
  catalog: fin.catalog,
  aiRuns: ai.aiRuns,
  aiPlatforms: ai.platforms,
  leadFinderResults: ai.leadFinderResults,
  adAccounts: ai.adAccounts,
  adCampaigns: ai.adCampaigns,
  notes: [],
  users,
};

export const settings = { finance: fin.financeSettings };

export function delay(value) {
  const ms = LATENCY[0] + Math.random() * (LATENCY[1] - LATENCY[0]);
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));
}

/** Synchronous read for derived computations inside services (never from components). */
export function table(name) {
  if (!tables[name]) throw new Error(`Unknown table: ${name}`);
  return tables[name];
}

let seq = 1000;
export function createCrudService(name, { searchFields = ['name'], defaultSort } = {}) {
  return {
    async list({ q = '', page = 1, pageSize = 25, sort = defaultSort, filter } = {}) {
      let rows = table(name);
      if (filter) rows = rows.filter(filter);
      if (q) {
        const needle = q.toLowerCase();
        rows = rows.filter((row) => searchFields.some((f) => String(row[f] ?? '').toLowerCase().includes(needle)));
      }
      if (sort) {
        const [field, dir] = sort.split(':');
        rows = [...rows].sort((a, b) => (a[field] > b[field] ? 1 : a[field] < b[field] ? -1 : 0) * (dir === 'desc' ? -1 : 1));
      }
      const total = rows.length;
      const items = rows.slice((page - 1) * pageSize, page * pageSize);
      return delay({ items, total });
    },
    async get(id) {
      const row = table(name).find((r) => r.id === id);
      if (!row) throw Object.assign(new Error('Not found'), { status: 404 });
      return delay(row);
    },
    async create(data) {
      const row = { id: `${name.slice(0, 3)}_${(seq += 1)}`, createdAt: new Date().toISOString(), ...data };
      table(name).unshift(row);
      return delay(row);
    },
    async update(id, data) {
      const row = table(name).find((r) => r.id === id);
      if (!row) throw Object.assign(new Error('Not found'), { status: 404 });
      Object.assign(row, data);
      return delay(row);
    },
    async remove(id) {
      const rows = table(name);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx >= 0) rows.splice(idx, 1);
      return delay({ ok: true });
    },
  };
}
