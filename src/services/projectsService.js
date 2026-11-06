/*
 * Projects: list with derived metrics + full detail aggregate.
 * Derived (later: SQL view):
 *   projectedCost   = progress ≥ 10% ? max(budget, spent / progress) : budget   (estimate at completion)
 *   projectedMargin = (contractValue − projectedCost) / contractValue
 *   budgetUsed      = spent / budget
 */
import { delay, table } from './client.js';
import { projectDetails, projectExpenses } from '../data/mock/projectDetails.js';

let seq = 9000;
const byId = (t, id) => table(t).find((r) => r.id === id) || null;

export function projectMetrics(p) {
  const projectedCost = p.progress >= 0.1 ? Math.max(p.budget, p.spent / p.progress) : p.budget;
  return {
    budgetUsed: p.budget ? p.spent / p.budget : null,
    remaining: Math.round((p.budget - p.spent) * 100) / 100,
    projectedCost: Math.round(projectedCost * 100) / 100,
    projectedMargin: p.contractValue ? (p.contractValue - projectedCost) / p.contractValue : null,
    atRisk: p.budget ? p.spent / p.budget - p.progress > 0.1 : false,
  };
}

const enrich = (p) => ({ ...p, ...projectMetrics(p), client: byId('contacts', p.clientId), manager: byId('users', p.managerId) });

function detailOf(id) {
  if (!projectDetails[id]) projectDetails[id] = { rooms: [], phases: [], selections: [], budgetLines: [], documents: [], photos: [], notes: [] };
  return projectDetails[id];
}

export const projectsService = {
  async list({ q = '', status, managerId, neighborhood, page = 1, pageSize = 12, sort = 'startDate:desc' } = {}) {
    const needle = q.trim().toLowerCase();
    let rows = table('projects').map(enrich)
      .filter((p) => !status || (status === 'active' ? !['completed', 'onHold'].includes(p.status) : p.status === status))
      .filter((p) => !managerId || p.managerId === managerId)
      .filter((p) => !neighborhood || p.neighborhood === neighborhood)
      .filter((p) => !needle || [p.name, p.address, p.neighborhood, p.client?.name].some((v) => String(v || '').toLowerCase().includes(needle)));
    const [f, d] = sort.split(':');
    const val = (p) => (f === 'client' ? p.client?.name : p[f]);
    rows = [...rows].sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * (d === 'desc' ? -1 : 1));
    const totals = {
      count: rows.length,
      budget: rows.reduce((a, p) => a + p.budget, 0),
      spent: rows.reduce((a, p) => a + p.spent, 0),
      contract: rows.reduce((a, p) => a + p.contractValue, 0),
      atRisk: rows.filter((p) => p.atRisk && !['completed'].includes(p.status)).length,
    };
    return delay({ items: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length, totals });
  },

  async get(id) {
    const p = byId('projects', id);
    if (!p) throw Object.assign(new Error('Not found'), { status: 404 });
    const d = detailOf(id);
    const contacts = table('contacts');
    return delay({
      project: enrich(p),
      partners: p.partnerIds.map((pid) => contacts.find((c) => c.id === pid)).filter(Boolean),
      ...d,
      selections: d.selections.map((s) => ({ ...s, vendor: contacts.find((c) => c.id === s.vendorId), room: d.rooms.find((r) => r.id === s.roomId) })),
      tasks: table('tasks').filter((t) => t.projectId === id).sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
      appointments: table('appointments').filter((a) => a.projectId === id),
      conversations: table('conversations').filter((c) => c.projectId === id),
      estimates: table('estimates').filter((e) => e.projectId === id),
      invoices: table('invoices').filter((i) => i.projectId === id),
      expenses: projectExpenses(id).map((e) => ({ ...e, vendor: contacts.find((c) => c.id === e.vendorId) })),
    });
  },

  async create(data) {
    const id = `p_${(seq += 1)}`;
    const row = { id, spent: 0, progress: 0, cover: seq % 6, partnerIds: [], ...data };
    table('projects').unshift(row);
    detailOf(id);
    return delay(row);
  },

  async update(id, data) {
    const p = byId('projects', id);
    Object.assign(p, data);
    return delay(p);
  },

  async addNote(id, body, authorId = 'u_1') {
    const note = { id: `nt_${(seq += 1)}`, body, authorId, createdAt: new Date().toISOString() };
    detailOf(id).notes.unshift(note);
    return delay(note);
  },

  async updateSelection(id, selectionId, patch) {
    const s = detailOf(id).selections.find((x) => x.id === selectionId);
    Object.assign(s, patch);
    return delay(s);
  },

  async addDocuments(id, files, type) {
    const docs = files.map((f) => ({
      id: `doc_${(seq += 1)}`, type, name: f.name, size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      uploadedAt: new Date().toISOString(), uploadedBy: 'u_1', status: type === 'permits' ? 'submitted' : null,
    }));
    detailOf(id).documents.unshift(...docs);
    return delay(docs);
  },
};
