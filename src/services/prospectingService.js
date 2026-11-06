import { delay, table } from './client.js';

const listOf = (id) => table('prospectLists').find((l) => l.id === id);
const seqOf = (id) => table('sequences').find((s) => s.id === id);

function metrics(rows) {
  const contacted = rows.filter((p) => p.status !== 'new').length;
  const replied = rows.filter((p) => ['replied', 'meeting', 'converted'].includes(p.status)).length;
  const meetings = rows.filter((p) => ['meeting', 'converted'].includes(p.status)).length;
  const converted = rows.filter((p) => p.status === 'converted').length;
  return {
    total: rows.length, contacted, replied, meetings, converted,
    replyRate: contacted ? replied / contacted : null,
    conversionRate: contacted ? converted / contacted : null,
  };
}

export const prospectingService = {
  async lists() {
    const items = table('prospectLists').map((l) => ({ ...l, ...metrics(table('prospects').filter((p) => p.listId === l.id)) }));
    return delay(items);
  },
  async prospects({ listId, status, segment, q = '', page = 1, pageSize = 15, sort = 'score:desc' } = {}) {
    const needle = q.toLowerCase();
    let rows = table('prospects')
      .filter((p) => !listId || p.listId === listId)
      .filter((p) => !status || p.status === status)
      .filter((p) => !segment || p.segment === segment)
      .filter((p) => !needle || [p.name, p.company, p.email].some((v) => v.toLowerCase().includes(needle)));
    const [f, d] = sort.split(':');
    rows = [...rows].sort((a, b) => ((a[f] ?? '') > (b[f] ?? '') ? 1 : (a[f] ?? '') < (b[f] ?? '') ? -1 : 0) * (d === 'desc' ? -1 : 1));
    const items = rows.slice((page - 1) * pageSize, page * pageSize).map((p) => ({ ...p, list: listOf(p.listId), sequence: seqOf(p.sequenceId) }));
    return delay({ items, total: rows.length });
  },
  async overview() {
    const all = table('prospects');
    const bySegment = {};
    all.forEach((p) => {
      bySegment[p.segment] ||= [];
      bySegment[p.segment].push(p);
    });
    return delay({
      totals: metrics(all),
      segments: Object.entries(bySegment).map(([segment, rows]) => ({ segment, ...metrics(rows) })).sort((a, b) => (b.replyRate ?? 0) - (a.replyRate ?? 0)),
    });
  },
  async campaigns() {
    return delay(table('campaigns').map((c) => ({
      ...c, list: listOf(c.listId), sequence: seqOf(c.sequenceId),
      ...(c.status === 'draft' ? { total: table('prospects').filter((p) => p.listId === c.listId).length } : metrics(table('prospects').filter((p) => p.listId === c.listId))),
    })));
  },
  async sequences() { return delay(table('sequences')); },
  async update(ids, patch) {
    table('prospects').forEach((p) => { if (ids.includes(p.id)) Object.assign(p, patch); });
    return delay({ ok: true });
  },
  /** Convert prospect → lead (mock). */
  async convertToLead(id) {
    const p = table('prospects').find((x) => x.id === id);
    const [firstName, ...rest] = p.name.split(' ');
    const lead = {
      id: `l_${Date.now()}`, firstName, lastName: rest.join(' '), name: p.name, email: p.email, phone: p.phone,
      source: 'partner', referredById: null, startWhen: 'unsure', description: `Converted from prospecting — ${p.company}`,
      serviceType: 'design', budget: null, neighborhood: p.neighborhood, score: p.score, status: 'new', assigneeId: p.ownerId,
      createdAt: new Date().toISOString(),
    };
    table('leads').unshift(lead);
    p.status = 'converted';
    return delay(lead);
  },
};
