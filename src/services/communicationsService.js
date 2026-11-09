/*
 * Conversations + messages for every channel (whatsapp | sms | email) with one shape,
 * so the WhatsApp Cloud API, an SMS provider (Twilio/Telnyx…) and Gmail/IMAP plug in behind the same calls.
 */
import { delay, settings, table, currentUserId } from './client.js';
import { composeSms, hhmmToMinutes, minutesInZone, smsInfo } from '../lib/sms.js';

const contactOf = (id) => table('contacts').find((c) => c.id === id) || null;
const projectOf = (id) => table('projects').find((p) => p.id === id) || null;
const withRefs = (c) => ({ ...c, contact: contactOf(c.contactId), project: projectOf(c.projectId) });
const WINDOW_MS = 24 * 60 * 60 * 1000;
let seq = 5000;

/** SMS rules for one conversation: consent, quiet hours (recipient's local time) and whether the next text is the first. */
function smsState(conv, now = new Date()) {
  const cfg = settings.channels.sms;
  const contact = contactOf(conv.contactId);
  const zone = settings.organization.timezone || 'America/New_York';
  const mins = minutesInZone(now, zone);
  const from = hhmmToMinutes(cfg.quietFrom);
  const to = hhmmToMinutes(cfg.quietTo);
  const quietNow = Boolean(cfg.quietHours) && (from > to ? mins >= from || mins < to : mins >= from && mins < to);
  let resumeAt = null;
  if (quietNow) {
    // Next quietTo in the recipient's zone (approximation that is exact while org zone == recipient zone).
    const wait = ((to - mins + 1440) % 1440) * 60000;
    resumeAt = new Date(now.getTime() + wait);
    resumeAt.setSeconds(0, 0);
  }
  const hasOutbound = table('messages').some((m) => m.conversationId === conv.id && m.direction === 'out' && !m.isNote);
  return {
    connected: cfg.connected,
    consent: contact?.smsConsent ?? { status: 'unknown', source: null, at: null },
    quietNow,
    resumeAt: resumeAt?.toISOString() ?? null,
    firstMessage: !hasOutbound,
    prefix: cfg.complianceFooter ? cfg.senderPrefix : '',
    footer: cfg.complianceFooter ? cfg.footerText : '',
    mms: cfg.mms,
  };
}

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

  /** Unread conversations per channel (channel switch badges). */
  async unreadByChannel() {
    const out = { whatsapp: 0, sms: 0, email: 0 };
    table('conversations').forEach((c) => { if (c.unread && c.channel in out) out[c.channel] += 1; });
    return delay(out);
  },

  async thread(id) {
    const conv = table('conversations').find((c) => c.id === id);
    if (!conv) throw Object.assign(new Error('Not found'), { status: 404 });
    const msgs = table('messages').filter((m) => m.conversationId === id).sort((a, b) => a.sentAt.localeCompare(b.sentAt));
    const windowOpen = conv.channel === 'whatsapp' && conv.lastInboundAt ? Date.now() - new Date(conv.lastInboundAt).getTime() < WINDOW_MS : null;
    return delay({ conversation: withRefs(conv), messages: msgs, windowOpen, sms: conv.channel === 'sms' ? smsState(conv) : null });
  },

  async markRead(id) {
    const conv = table('conversations').find((c) => c.id === id);
    if (conv) conv.unread = 0;
    return delay({ ok: true });
  },

  async send(conversationId, { body, isNote = false, attachments = [], authorId = currentUserId() }) {
    const conv = table('conversations').find((c) => c.id === conversationId);
    let text = body;
    let extra = {};
    if (conv.channel === 'sms' && !isNote) {
      const st = smsState(conv);
      // The provider would reject it too: never text a number that replied STOP.
      if (st.consent.status === 'opted_out') throw Object.assign(new Error('opted_out'), { status: 409, code: 'opted_out' });
      text = composeSms(body, { first: st.firstMessage, prefix: st.prefix, footer: st.footer });
      extra = { segments: smsInfo(text).segments, ...(st.quietNow ? { scheduledFor: st.resumeAt } : {}) };
    }
    const msg = {
      id: `m_${(seq += 1)}`, conversationId, channel: conv.channel, direction: 'out', isNote, body: text, attachments,
      sentAt: new Date().toISOString(), status: isNote ? null : extra.scheduledFor ? 'scheduled' : 'sent', authorId, ...extra,
    };
    table('messages').push(msg);
    if (!isNote) {
      Object.assign(conv, { lastMessage: text.split('\n')[0], lastMessageAt: msg.sentAt, lastDirection: 'out', unread: 0 });
    }
    return delay(msg);
  },

  /** Record SMS consent collected outside a text (web form, signed contract, verbal). Opt-outs can only be lifted by the client texting START. */
  async recordSmsConsent(contactId, { source, note = '' }) {
    const c = contactOf(contactId);
    if (!c) throw Object.assign(new Error('Not found'), { status: 404 });
    if (c.smsConsent?.status === 'opted_out') throw Object.assign(new Error('opted_out'), { status: 409, code: 'opted_out' });
    c.smsConsent = { status: 'opted_in', source, note, at: new Date().toISOString(), by: currentUserId() };
    return delay(c.smsConsent);
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
      lastDirection: 'out', lastInboundAt: null, unread: 0, assigneeId: currentUserId(), to, cc, bcc,
    });
    table('messages').push({ id: `m_${(seq += 1)}`, conversationId: id, channel: 'email', direction: 'out', isNote: false, body, attachments: [], sentAt, status: draft ? null : 'sent', authorId: currentUserId() });
    return delay({ id });
  },
};

/** Message templates live in Settings → Templates (same objects, edited in place). */
export const TEMPLATES = settings.templates;

/** Email signature from Settings → Channels (prefixed with a blank line, ready to append). */
export const signature = () => `\n\n${settings.channels.email.signature.trim()}`;
