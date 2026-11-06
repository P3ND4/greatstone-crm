// Small synchronous lookups for labels (names of related records). Async-compatible signature kept for later.
import { table } from './client.js';

const byId = (name, id) => table(name).find((r) => r.id === id) || null;

export const lookupService = {
  user: (id) => byId('users', id),
  contact: (id) => byId('contacts', id),
  project: (id) => byId('projects', id),
  conversation: (id) => byId('conversations', id),
  users: () => table('users'),
  projectOptions: () => table('projects').map((p) => ({ value: p.id, label: p.name })),
  contactOptions: (types) => table('contacts')
    .filter((c) => !types || types.includes(c.type))
    .map((c) => ({ value: c.id, label: c.company ? `${c.name} · ${c.company}` : c.name })),
};
