/*
 * Conversations + messages for BOTH channels (whatsapp | email) with one shape,
 * so the WhatsApp Cloud API and Gmail/IMAP can be plugged in behind the same calls.
 */
import { delay, settings, table } from './client.js';

const contactOf = (id) => table('contacts').find((c) => c.id === id) || null;
const projectOf = (id) => table('projects').find((p) => p.id === id) || null;
const withRefs = (c) => ({ ...c, contact: contactOf(c.contactId), project: projectOf(c.projectId) });
const WINDOW_MS = 24 * 60 * 60 * 1000;
let seq = 5000;

export const communicationsService = {
  /** filter: { channel, q, folder, label, starred, unread, assigneeId } */
  async list({ channel, q = '', folder, label, starred, unread, assigneeId } = {}) {
    const needle = q.trim().toLowerCase();
    const rows = table('conversations')
      .filter((c) => !channel || c.channel === channel)
      .filter((c) => !folder || (folder === 'starred' ? c.starred && c.folder !== 'trash' : c.folder === folder))
      .filter((c) => !label || c.labels.includes(label))
      .filter((c) => !starred || c.starred)
      .filter((c) => !unread || c.unread > 0)
      .filter((c) => !assigneeId || c.assigneeId === assigneeId)
      .map(withRefs)
      .filter((c) => !needle || [c.contact?.name, c.subject, c.lastMessage, c.contact?.company].some((v) => String(v || '').toLowerCase().includes(needle)))
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
    return delay({ items: rows, total: rows.length });
  },

  async counts(channel) {
    const rows = table('conversations').filter((c) => c.channel === channel);
    const folders = {};
    rows.forEach((c) => { if (c.folder) folders[c.folder] = (folders[c.folder] || 0) + (c.folder === 'inbox' ? (c.unread ? 1 : 0) : 1); });
    const labels = {};
    rows.forEach((c) => c.labels.forEach((l) => { labels[l] = (labels[l] || 0) + 1; }));
    return delay({ unread: rows.filter((c) => c.unread).length, folders, labels, starred: rows.filter((c) => c.starred).length });
  },

  async thread(id) {
    const conv = table('conversations').find((c) => c.id === id);
    if (!conv) throw Object.assign(new Error('Not found'), { status: 404 });
    const msgs = table('messages').filter((m) => m.conversationId === id).sort((a, b) => a.sentAt.localeCompare(b.sentAt));
    const windowOpen = conv.channel === 'whatsapp' && conv.lastInboundAt ? Date.now() - new Date(conv.lastInboundAt).getTime() < WINDOW_MS : null;
    return delay({ conversation: withRefs(conv), messages: msgs, windowOpen });
  },

  async markRead(id) {
    const conv = table('conversations').find((c) => c.id === id);
    if (conv) conv.unread = 0;
    return delay({ ok: true });
  },

  async send(conversationId, { body, isNote = false, attachments = [], authorId = 'u_1' }) {
    const conv = table('conversations').find((c) => c.id === conversationId);
    const msg = {
      id: `m_${(seq += 1)}`, conversationId, channel: conv.channel, direction: 'out', isNote, body, attachments,
      sentAt: new Date().toISOString(), status: isNote ? null : 'sent', authorId,
    };
    table('messages').push(msg);
    if (!isNote) {
      Object.assign(conv, { lastMessage: body.split('\n')[0], lastMessageAt: msg.sentAt, lastDirection: 'out', unread: 0 });
    }
    return delay(msg);
  },

  async update(ids, patch) {
    table('conversations').forEach((c) => { if (ids.includes(c.id)) Object.assign(c, typeof patch === 'function' ? patch(c) : patch); });
    return delay({ ok: true });
  },

  /** New email thread (composer page). */
  async compose({ to, cc, bcc, subject, body, contactId, projectId, draft = false }) {
    const id = `cv_${(seq += 1)}`;
    const sentAt = new Date().toISOString();
    table('conversations').unshift({
      id, channel: 'email', contactId: contactId || null, projectId: projectId || null, subject, labels: [],
      folder: draft ? 'drafts' : 'sent', starred: false, lastMessage: body.split('\n')[0] || subject, lastMessageAt: sentAt,
      lastDirection: 'out', lastInboundAt: null, unread: 0, assigneeId: 'u_1', to, cc, bcc,
    });
    table('messages').push({ id: `m_${(seq += 1)}`, conversationId: id, channel: 'email', direction: 'out', isNote: false, body, attachments: [], sentAt, status: draft ? null : 'sent', authorId: 'u_1' });
    return delay({ id });
  },
};

/** Message templates live in Settings → Templates (same objects, edited in place). */
export const TEMPLATES = settings.templates;

/** Email signature from Settings → Channels (prefixed with a blank line, ready to append). */
export const signature = () => `\n\n${settings.channels.email.signature.trim()}`;
