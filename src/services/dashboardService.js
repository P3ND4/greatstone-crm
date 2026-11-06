/*
 * Dashboard aggregates. Today computed from mock tables; later this becomes one RPC / SQL view
 * (see src/data/schema.md → "Dashboard view"). Values with no data return null and render as "—".
 */
import {
  addDays, endOfDay, format, isWithinInterval, startOfDay, startOfMonth, startOfQuarter,
  startOfYear, subDays, subMonths,
} from 'date-fns';
import { delay, table } from './client.js';

export const DASHBOARD_RANGES = ['thisMonth', 'last30', 'quarter', 'ytd', 'last12'];

export function resolveRange(key, now = new Date()) {
  const end = endOfDay(now);
  switch (key) {
    case 'last30': return { start: startOfDay(subDays(now, 29)), end };
    case 'quarter': return { start: startOfQuarter(now), end };
    case 'ytd': return { start: startOfYear(now), end };
    case 'last12': return { start: startOfMonth(subMonths(now, 11)), end };
    case 'thisMonth':
    default: return { start: startOfMonth(now), end };
  }
}

const sum = (rows, fn) => Math.round(rows.reduce((acc, r) => acc + fn(r), 0) * 100) / 100;
const inRange = (value, range) => value && isWithinInterval(new Date(value), range);
const ACTIVE = ['planning', 'design', 'permits', 'construction', 'finishing'];
const OPEN_STAGES = ['new', 'contacted', 'consultation', 'proposal', 'negotiation'];

function revenueDate(inv) {
  return inv.paidAt || (inv.status === 'partial' ? inv.issuedAt : null);
}

export const dashboardService = {
  async getSummary({ range: rangeKey = 'thisMonth' } = {}) {
    const now = new Date();
    const range = resolveRange(rangeKey, now);
    const ytd = resolveRange('ytd', now);

    const invoices = table('invoices');
    const estimates = table('estimates');
    const projects = table('projects');
    const leads = table('leads');
    const opps = table('opportunities');
    const expenses = table('expenses');
    const contacts = table('contacts');
    const users = table('users');
    const contactName = (id) => contacts.find((c) => c.id === id)?.name ?? null;
    const projectName = (id) => projects.find((p) => p.id === id)?.name ?? null;
    const userName = (id) => users.find((u) => u.id === id)?.name ?? null;

    /* KPIs */
    const outstanding = invoices.filter((i) => ['sent', 'partial', 'overdue'].includes(i.status));
    const overdue = invoices.filter((i) => i.status === 'overdue');
    const openEstimates = estimates.filter((e) => ['draft', 'sent', 'viewed'].includes(e.status));
    const leadsInRange = leads.filter((l) => inRange(l.createdAt, range));
    const converted = leadsInRange.filter((l) => l.status === 'converted').length;
    const openOpps = opps.filter((o) => OPEN_STAGES.includes(o.stage));

    const kpis = {
      revenue: sum(invoices.filter((i) => inRange(revenueDate(i), range)), (i) => i.paid),
      revenueYtd: sum(invoices.filter((i) => inRange(revenueDate(i), ytd)), (i) => i.paid),
      outstanding: { amount: sum(outstanding, (i) => i.total - i.paid), count: outstanding.length },
      overdue: { amount: sum(overdue, (i) => i.total - i.paid), count: overdue.length },
      openEstimates: { amount: sum(openEstimates, (e) => e.total), count: openEstimates.length },
      activeProjects: projects.filter((p) => ACTIVE.includes(p.status)).length,
      newLeads: leadsInRange.length,
      conversion: leadsInRange.length ? { rate: converted / leadsInRange.length, won: converted, total: leadsInRange.length } : null,
      pipeline: { amount: sum(openOpps, (o) => o.value), count: openOpps.length },
      spend: sum(expenses.filter((e) => inRange(e.date, range)), (e) => e.amount),
    };

    /* Monthly revenue vs expenses — always last 12 months */
    const monthly = Array.from({ length: 12 }, (_, k) => {
      const start = startOfMonth(subMonths(now, 11 - k));
      const end = endOfDay(subDays(startOfMonth(subMonths(now, 10 - k)), 1));
      const r = { start, end };
      return {
        key: format(start, 'yyyy-MM'),
        label: format(start, 'MMM'),
        fullLabel: format(start, 'MMMM yyyy'),
        revenue: sum(invoices.filter((i) => inRange(revenueDate(i), r)), (i) => i.paid),
        expenses: sum(expenses.filter((e) => inRange(e.date, r)), (e) => e.amount),
      };
    });

    const funnel = OPEN_STAGES.map((stage) => {
      const rows = opps.filter((o) => o.stage === stage);
      return { stage, value: sum(rows, (o) => o.value), count: rows.length };
    });

    const sourceCounts = {};
    leadsInRange.forEach((l) => { sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1; });
    const leadsBySource = Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    const statusOrder = ['planning', 'design', 'permits', 'construction', 'finishing', 'completed', 'onHold'];
    const projectsByStatus = statusOrder
      .map((status) => ({ status, count: projects.filter((p) => p.status === status).length }));

    /* Lists */
    const weekEnd = endOfDay(addDays(now, 7));
    const appointments = table('appointments')
      .filter((a) => isWithinInterval(new Date(a.start), { start: startOfDay(now), end: weekEnd }))
      .slice(0, 8)
      .map((a) => ({ ...a, contactName: contactName(a.contactId), assigneeName: userName(a.assigneeId) }));

    const todayRange = { start: startOfDay(now), end: endOfDay(now) };
    const tasks = table('tasks')
      .filter((t) => inRange(t.dueAt, todayRange))
      .map((t) => ({ ...t, projectName: projectName(t.projectId), assigneeName: userName(t.assigneeId) }))
      .sort((a, b) => Number(a.done) - Number(b.done));

    const unanswered = table('conversations')
      .filter((c) => c.lastDirection === 'in')
      .sort((a, b) => a.lastMessageAt.localeCompare(b.lastMessageAt))
      .slice(0, 6)
      .map((c) => ({ ...c, contactName: contactName(c.contactId) }));

    const active = projects.filter((p) => ACTIVE.includes(p.status));
    const health = active
      .map((p) => ({ id: p.id, name: p.name, progress: p.progress, budgetUsed: p.budget ? p.spent / p.budget : null, budget: p.budget, spent: p.spent }))
      .sort((a, b) => (b.budgetUsed - b.progress) - (a.budgetUsed - a.progress));
    const budgetRisk = health.filter((h) => h.budgetUsed != null && h.budgetUsed - h.progress > 0.1);

    const approvals = table('approvals').map((a) => ({ ...a, projectName: projectName(a.projectId) }));

    return delay({
      range: { key: rangeKey, start: range.start.toISOString(), end: range.end.toISOString() },
      kpis,
      charts: { monthly, funnel, leadsBySource, projectsByStatus },
      lists: { appointments, tasks, unanswered, budgetRisk, approvals },
      health,
    });
  },
};
