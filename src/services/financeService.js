/*
 * Finance service: estimates, invoices, payments, expenses / POs and reports.
 * Totals are always recomputed from line items (lib/money.js) — the UI never trusts a stored total.
 */
import {
  addDays, differenceInCalendarDays, endOfDay, endOfMonth, format, isWithinInterval, startOfMonth, subMonths,
} from 'date-fns';
import { documentTotals } from '../lib/money.js';
import { delay, settings, table } from './client.js';
import { resolveRange } from './dashboardService.js';

let seq = 7000;
const byId = (t, id) => table(t).find((r) => r.id === id) || null;
const notFound = () => Object.assign(new Error('Not found'), { status: 404 });
const TABLE = { estimate: 'estimates', invoice: 'invoices' };
const PREFIX = { estimate: 'EST', invoice: 'INV' };

function nextNumber(kind) {
  const nums = table(TABLE[kind]).map((d) => Number(String(d.number).split('-')[1]) || 0);
  return `${PREFIX[kind]}-${Math.max(0, ...nums) + 1}`;
}

/** Status that depends on dates (expired estimates, overdue invoices) is derived on read. */
function liveStatus(kind, d) {
  const today = new Date(new Date().toDateString());
  if (kind === 'estimate' && ['sent', 'viewed'].includes(d.status) && d.expiresAt && new Date(d.expiresAt) < today) return 'expired';
  if (kind === 'invoice' && ['sent', 'partial'].includes(d.status) && d.dueAt && new Date(d.dueAt) < today && d.paid < d.total) return 'overdue';
  return d.status;
}

/** Each document keeps the tax rate it was created with (changing it in Settings only affects new ones). */
const rateOf = (d) => d?.taxRate ?? settings.finance.taxRate;

function enrich(kind, d) {
  const t = documentTotals(d.lines || [], rateOf(d));
  const status = liveStatus(kind, d);
  return {
    ...d,
    kind,
    status,
    taxRate: rateOf(d),
    totals: t,
    balance: kind === 'invoice' ? Math.round((t.total - (d.paid || 0)) * 100) / 100 : null,
    client: byId('contacts', d.clientId),
    project: byId('projects', d.projectId),
    daysOverdue: kind === 'invoice' && status === 'overdue' ? differenceInCalendarDays(new Date(), new Date(d.dueAt)) : 0,
  };
}

function docsApi(kind) {
  const name = TABLE[kind];
  return {
    async list({ q = '', status, projectId, clientId, page = 1, pageSize = 15, sort = kind === 'invoice' ? 'issuedAt:desc' : 'createdAt:desc' } = {}) {
      const needle = q.trim().toLowerCase();
      let rows = table(name).map((d) => enrich(kind, d))
        .filter((d) => !status || (status === 'open' ? (kind === 'invoice' ? ['sent', 'partial', 'overdue'].includes(d.status) : ['draft', 'sent', 'viewed'].includes(d.status)) : d.status === status))
        .filter((d) => !projectId || d.projectId === projectId)
        .filter((d) => !clientId || d.clientId === clientId)
        .filter((d) => !needle || [d.number, d.client?.name, d.project?.name].some((v) => String(v || '').toLowerCase().includes(needle)));
      const [f, dir] = sort.split(':');
      const val = (d) => (f === 'client' ? d.client?.name : f === 'total' ? d.totals.total : d[f]);
      rows = [...rows].sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * (dir === 'desc' ? -1 : 1));
      return delay({ items: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length });
    },
    async summary() {
      const rows = table(name).map((d) => enrich(kind, d));
      const sum = (list, fn) => Math.round(list.reduce((a, d) => a + fn(d), 0) * 100) / 100;
      if (kind === 'estimate') {
        const open = rows.filter((d) => ['draft', 'sent', 'viewed'].includes(d.status));
        const decided = rows.filter((d) => ['accepted', 'declined'].includes(d.status));
        const accepted = rows.filter((d) => d.status === 'accepted');
        const soon = rows.filter((d) => ['sent', 'viewed'].includes(d.status) && differenceInCalendarDays(new Date(d.expiresAt), new Date()) <= 7);
        return delay({
          open: { count: open.length, amount: sum(open, (d) => d.totals.total) },
          accepted: { count: accepted.length, amount: sum(accepted, (d) => d.totals.total) },
          acceptRate: decided.length ? accepted.length / decided.length : null,
          expiringSoon: soon.length,
        });
      }
      const outstanding = rows.filter((d) => ['sent', 'partial', 'overdue'].includes(d.status));
      const overdue = rows.filter((d) => d.status === 'overdue');
      const month = { start: startOfMonth(new Date()), end: endOfDay(new Date()) };
      const paidMonth = table('payments').filter((p) => isWithinInterval(new Date(p.date), month));
      const paidInv = rows.filter((d) => d.status === 'paid' && d.paidAt);
      const avgDays = paidInv.length ? paidInv.reduce((a, d) => a + differenceInCalendarDays(new Date(d.paidAt), new Date(d.issuedAt)), 0) / paidInv.length : null;
      return delay({
        outstanding: { count: outstanding.length, amount: sum(outstanding, (d) => d.balance) },
        overdue: { count: overdue.length, amount: sum(overdue, (d) => d.balance) },
        collectedMonth: Math.round(paidMonth.reduce((a, p) => a + p.amount, 0) * 100) / 100,
        avgDaysToPay: avgDays,
      });
    },
    async get(id) {
      const d = byId(name, id);
      if (!d) throw notFound();
      const doc = enrich(kind, d);
      return delay({
        doc,
        payments: kind === 'invoice' ? table('payments').filter((p) => p.invoiceId === id).sort((a, b) => b.date.localeCompare(a.date)) : [],
        source: d.estimateId ? enrich('estimate', byId('estimates', d.estimateId)) : null,
        invoices: kind === 'estimate' ? table('invoices').filter((i) => i.estimateId === id).map((i) => enrich('invoice', i)) : [],
      });
    },
    /** Blank document with defaults (number, dates, terms). */
    draft({ projectId = '', clientId = '' } = {}) {
      const today = new Date();
      const project = byId('projects', projectId);
      return {
        number: nextNumber(kind), status: 'draft', projectId, clientId: clientId || project?.clientId || '',
        ...(kind === 'invoice'
          ? { issuedAt: today.toISOString(), dueAt: addDays(today, settings.finance.invoiceDueDays).toISOString(), paid: 0 }
          : { createdAt: today.toISOString(), expiresAt: addDays(today, settings.finance.estimateValidDays).toISOString() }),
        lines: [], taxRate: settings.finance.taxRate, terms: settings.finance.defaultTerms, notes: settings.finance.defaultNotes,
      };
    },
    async save(data) {
      const taxRate = data.id ? rateOf(byId(name, data.id)) : rateOf(data);
      const total = documentTotals(data.lines, taxRate).total;
      if (data.id) {
        const d = byId(name, data.id);
        Object.assign(d, data, { total, taxRate });
        return delay(enrich(kind, d));
      }
      const row = { ...data, id: `${kind === 'invoice' ? 'inv' : 'est'}_${(seq += 1)}`, number: data.number || nextNumber(kind), taxRate, total, paid: data.paid || 0 };
      table(name).unshift(row);
      return delay(enrich(kind, row));
    },
    async setStatus(id, status) {
      const d = byId(name, id);
      d.status = status;
      if (status === 'sent' && kind === 'invoice' && !d.issuedAt) d.issuedAt = new Date().toISOString();
      return delay(enrich(kind, d));
    },
    async remove(id) {
      const rows = table(name);
      rows.splice(rows.findIndex((d) => d.id === id), 1);
      return delay({ ok: true });
    },
  };
}

export const estimatesApi = docsApi('estimate');
export const invoicesApi = docsApi('invoice');

export const financeService = {
  settings: () => settings.finance,
  catalog: () => table('catalog'),

  /** Accepted estimate → draft invoice with the same lines. */
  async convertToInvoice(estimateId) {
    const e = byId('estimates', estimateId);
    e.status = 'accepted';
    const draft = invoicesApi.draft({ projectId: e.projectId, clientId: e.clientId });
    return invoicesApi.save({ ...draft, taxRate: rateOf(e), estimateId, lines: e.lines.map((l, k) => ({ ...l, id: `ln_${Date.now()}_${k}` })), terms: e.terms, notes: e.notes });
  },

  async recordPayment(invoiceId, { amount, date, method, reference }) {
    const inv = byId('invoices', invoiceId);
    const total = documentTotals(inv.lines, rateOf(inv)).total;
    const paid = Math.round((inv.paid + Number(amount)) * 100) / 100;
    const iso = new Date(`${date}T12:00:00`).toISOString();
    Object.assign(inv, { paid, status: paid >= total - 0.001 ? 'paid' : 'partial', paidAt: paid >= total - 0.001 ? iso : inv.paidAt });
    table('payments').unshift({ id: `pay_${(seq += 1)}`, invoiceId, amount: Number(amount), date: iso, method, reference });
    return delay(enrich('invoice', inv));
  },

  async sendReminder(invoiceId) {
    const inv = byId('invoices', invoiceId);
    inv.remindersSent = (inv.remindersSent || 0) + 1;
    inv.lastReminderAt = new Date().toISOString();
    return delay(enrich('invoice', inv));
  },

  /* ---------------- Expenses & POs ---------------- */
  async expenses({ q = '', type, status, category, projectId, page = 1, pageSize = 15, sort = 'date:desc' } = {}) {
    const needle = q.trim().toLowerCase();
    let rows = table('expenses').map((e) => ({ ...e, vendor: byId('contacts', e.vendorId), project: byId('projects', e.projectId) }))
      .filter((e) => !type || e.type === type)
      .filter((e) => !status || e.status === status)
      .filter((e) => !category || e.category === category)
      .filter((e) => !projectId || (projectId === 'overhead' ? !e.projectId : e.projectId === projectId))
      .filter((e) => !needle || [e.vendor?.company, e.vendor?.name, e.project?.name, e.description, e.id].some((v) => String(v || '').toLowerCase().includes(needle)));
    const [f, dir] = sort.split(':');
    rows = [...rows].sort((a, b) => (a[f] > b[f] ? 1 : a[f] < b[f] ? -1 : 0) * (dir === 'desc' ? -1 : 1));
    const all = table('expenses');
    const month = { start: startOfMonth(new Date()), end: endOfDay(new Date()) };
    const sum = (list) => Math.round(list.reduce((a, e) => a + e.amount, 0) * 100) / 100;
    const pending = all.filter((e) => e.status === 'pending');
    return delay({
      items: rows.slice((page - 1) * pageSize, page * pageSize),
      total: rows.length,
      summary: {
        month: sum(all.filter((e) => isWithinInterval(new Date(e.date), month) && e.status !== 'rejected')),
        pending: { count: pending.length, amount: sum(pending) },
        openPOs: { count: all.filter((e) => e.type === 'po' && e.status !== 'rejected').length, amount: sum(all.filter((e) => e.type === 'po' && e.status !== 'rejected')) },
        filtered: sum(rows),
      },
    });
  },
  async createExpense(data) {
    const row = { id: `exp_${(seq += 1)}`, status: 'pending', ...data, amount: Number(data.amount), projectId: data.projectId || null, date: new Date(`${data.date}T12:00:00`).toISOString() };
    table('expenses').unshift(row);
    return delay(row);
  },
  async setExpenseStatus(ids, status) {
    table('expenses').forEach((e) => { if (ids.includes(e.id)) e.status = status; });
    return delay({ ok: true });
  },

  /* ---------------- Reports ---------------- */
  async reports({ range: rangeKey = 'ytd' } = {}) {
    const now = new Date();
    const range = resolveRange(rangeKey, now);
    const inRange = (d) => d && isWithinInterval(new Date(d), range);
    const invoices = table('invoices').map((d) => enrich('invoice', d));
    const pays = table('payments').filter((p) => inRange(p.date));
    const exps = table('expenses').filter((e) => inRange(e.date) && e.status !== 'rejected');
    const sum = (list, fn) => Math.round(list.reduce((a, x) => a + fn(x), 0) * 100) / 100;

    const receivable = invoices.filter((d) => ['sent', 'partial', 'overdue'].includes(d.status));
    const aging = [
      ['current', (d) => d <= 0], ['1-30', (d) => d >= 1 && d <= 30], ['31-60', (d) => d > 30 && d <= 60], ['61-90', (d) => d > 60 && d <= 90], ['90+', (d) => d > 90],
    ].map(([bucket, test]) => {
      const rows = receivable.filter((i) => test(differenceInCalendarDays(now, new Date(i.dueAt))));
      return { bucket, count: rows.length, amount: sum(rows, (i) => i.balance) };
    });

    const months = Array.from({ length: 12 }, (_, k) => {
      const start = startOfMonth(subMonths(now, 11 - k));
      const r = { start, end: endOfMonth(start) };
      const inc = sum(table('payments').filter((p) => isWithinInterval(new Date(p.date), r)), (p) => p.amount);
      const exp = sum(table('expenses').filter((e) => isWithinInterval(new Date(e.date), r) && e.status !== 'rejected'), (e) => e.amount);
      return { key: format(start, 'yyyy-MM'), label: format(start, 'MMM'), fullLabel: format(start, 'MMMM yyyy'), revenue: inc, expenses: exp, net: Math.round((inc - exp) * 100) / 100 };
    });

    const projects = table('projects').map((p) => {
      const inv = invoices.filter((i) => i.projectId === p.id);
      const billed = sum(inv, (i) => i.totals.total);
      const collected = sum(inv, (i) => i.paid);
      const cost = p.spent;
      // Earned basis: profit = billed − cost to date (collected shown separately as cash information).
      return { id: p.id, name: p.name, status: p.status, contract: p.contractValue, billed, collected, cost, profit: Math.round((billed - cost) * 100) / 100, margin: billed ? (billed - cost) / billed : null };
    }).sort((a, b) => b.contract - a.contract);

    const recentPayments = table('payments').slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)
      .map((p) => { const inv = byId('invoices', p.invoiceId); return { ...p, number: inv?.number, client: byId('contacts', inv?.clientId) }; });

    return delay({
      range: { key: rangeKey, start: range.start.toISOString(), end: range.end.toISOString() },
      kpis: {
        income: sum(pays, (p) => p.amount),
        expenses: sum(exps, (e) => e.amount),
        net: Math.round((sum(pays, (p) => p.amount) - sum(exps, (e) => e.amount)) * 100) / 100,
        receivable: sum(receivable, (i) => i.balance),
        payable: sum(table('expenses').filter((e) => e.status === 'pending'), (e) => e.amount),
      },
      aging,
      months,
      projects,
      recentPayments,
    });
  },
};
