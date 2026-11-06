import { delay, table } from './client.js';

/** Global search across main entities (Cmd/Ctrl+K). */
export const searchService = {
  async query(q) {
    const needle = q.trim().toLowerCase();
    if (!needle) return delay([]);
    const hit = (s) => String(s || '').toLowerCase().includes(needle);
    const results = [
      ...table('contacts').filter((c) => hit(c.name) || hit(c.company) || hit(c.email)).slice(0, 5)
        .map((c) => ({ id: c.id, kind: 'contact', label: c.name, meta: c.company || c.neighborhood, to: `/crm/contacts/${c.id}` })),
      ...table('leads').filter((l) => hit(l.name) || hit(l.email)).slice(0, 4)
        .map((l) => ({ id: l.id, kind: 'lead', label: l.name, meta: l.neighborhood, to: `/crm/leads/${l.id}` })),
      ...table('projects').filter((p) => hit(p.name) || hit(p.neighborhood)).slice(0, 5)
        .map((p) => ({ id: p.id, kind: 'project', label: p.name, meta: p.neighborhood, to: `/projects/${p.id}` })),
      ...table('invoices').filter((i) => hit(i.number)).slice(0, 4)
        .map((i) => ({ id: i.id, kind: 'invoice', label: i.number, meta: i.status, to: `/finance/invoices/${i.id}` })),
    ];
    return delay(results);
  },
};
