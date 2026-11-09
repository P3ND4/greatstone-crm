/*
 * Settings service — organization, profile, users & roles, channels, templates, catalog,
 * taxes & billing, integrations, AI preferences and notifications.
 * Same async contract as every other service; values are edited in memory so the rest of the
 * demo reacts (e.g. a new tax rate is used by the next estimate, templates show up in composers).
 */
import { delay, settings, table, currentUserId } from './client.js';
import { NOTIFICATION_CHANNELS, NOTIFICATION_EVENTS, PERMISSION_MODULES, ROLES, futureIntegrations } from '../data/mock/settings.js';

let seq = 9000;
const notFound = () => Object.assign(new Error('Not found'), { status: 404 });
const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k]]));

const BILLING_KEYS = ['taxRate', 'taxLabel', 'invoiceDueDays', 'estimateValidDays', 'currency', 'defaultTerms', 'defaultNotes', 'paymentMethods', 'paymentInstructions', 'lateFeePct', 'reminderDays'];
// Billing extras that did not exist in the finance mock yet.
Object.assign(settings.finance, {
  paymentMethods: settings.finance.paymentMethods ?? ['ach', 'wire', 'check', 'zelle', 'card'],
  paymentInstructions: settings.finance.paymentInstructions ?? 'ACH / wire: Demo Bank · Routing on request. Zelle: studio@example.com. Checks payable to Greatstone Design LLC.',
  lateFeePct: settings.finance.lateFeePct ?? 1.5,
  reminderDays: settings.finance.reminderDays ?? [3, 7, 14],
});

export const SETTINGS_META = { roles: ROLES, modules: PERMISSION_MODULES, events: NOTIFICATION_EVENTS, notifyChannels: NOTIFICATION_CHANNELS };

/**
 * Synchronous reads for app-wide state (session provider, theme) — no latency, never mutated by callers.
 * Everything else goes through the async functions below.
 */
export const settingsSnapshot = {
  access: (role, moduleId) => (role === 'admin' ? 'full' : settings.permissions[moduleId]?.[role] ?? 'full'),
  assistantEnabled: () => settings.ai.assistantEnabled,
  accent: () => settings.organization.accent,
  defaultLanguage: () => settings.organization.defaultLanguage,
};

export const settingsService = {
  /* ---------- Organization ---------- */
  organization: () => delay(settings.organization),
  async saveOrganization(data) {
    Object.assign(settings.organization, data);
    // Documents (estimates / invoices) print the company block from finance settings — keep in sync.
    Object.assign(settings.finance.company, {
      name: data.name, tagline: data.tagline, city: `${data.city}, ${data.state}`, email: data.email, phone: data.phone, web: data.website, logo: data.logo,
    });
    return delay(settings.organization);
  },

  /* ---------- My profile ---------- */
  profile: (userId) => {
    const u = table('users').find((x) => x.id === userId);
    if (!u) return Promise.reject(notFound());
    return delay({ ...u, phone: u.phone ?? '(305) 555-0101' });
  },
  async saveProfile(userId, data) {
    const u = table('users').find((x) => x.id === userId);
    Object.assign(u, pick(data, ['name', 'title', 'email', 'phone']));
    return delay(u);
  },

  /* ---------- Users, invitations & roles ---------- */
  async team() {
    return delay({ users: table('users'), invites: table('invites') });
  },
  async setRole(userId, role) {
    const u = table('users').find((x) => x.id === userId);
    if (!u) throw notFound();
    u.role = role;
    return delay(u);
  },
  async setUserStatus(userId, status) {
    const u = table('users').find((x) => x.id === userId);
    u.status = status;
    return delay(u);
  },
  async invite({ email, role }) {
    const row = { id: `inv_u${(seq += 1)}`, email: email.trim().toLowerCase(), role, sentAt: new Date().toISOString(), invitedBy: currentUserId() };
    table('invites').unshift(row);
    return delay(row);
  },
  async resendInvite(id) {
    const row = table('invites').find((x) => x.id === id);
    row.sentAt = new Date().toISOString();
    return delay(row);
  },
  async revokeInvite(id) {
    const rows = table('invites');
    rows.splice(rows.findIndex((x) => x.id === id), 1);
    return delay({ ok: true });
  },
  permissions: () => delay(settings.permissions),
  async savePermissions(matrix) {
    PERMISSION_MODULES.forEach((m) => { Object.assign(settings.permissions[m], matrix[m], { admin: 'full' }); });
    return delay(settings.permissions);
  },

  /* ---------- Channels ---------- */
  channels: () => delay(settings.channels),
  async saveChannels(data) {
    Object.keys(data).forEach((k) => Object.assign(settings.channels[k], data[k]));
    return delay(settings.channels);
  },
  async setChannelConnected(channel, connected) {
    settings.channels[channel].connected = connected;
    return delay(settings.channels[channel]);
  },

  /* ---------- Templates ---------- */
  templates: () => delay(settings.templates),
  async saveTemplate(channel, tpl) {
    const list = settings.templates[channel];
    if (tpl.id) {
      const row = list.find((x) => x.id === tpl.id);
      // Editing an approved WhatsApp template sends it back to review (as Meta does).
      Object.assign(row, tpl, channel === 'whatsapp' && row.body !== tpl.body ? { status: 'pending' } : {});
      return delay(row);
    }
    const row = { ...tpl, id: `${channel === 'whatsapp' ? 'wt' : 'et'}_${(seq += 1)}`, ...(channel === 'whatsapp' ? { status: 'pending' } : {}) };
    list.push(row);
    return delay(row);
  },
  async setTemplateStatus(id, status) {
    const row = settings.templates.whatsapp.find((x) => x.id === id);
    row.status = status;
    return delay(row);
  },
  async removeTemplate(channel, id) {
    const list = settings.templates[channel];
    list.splice(list.findIndex((x) => x.id === id), 1);
    return delay({ ok: true });
  },

  /* ---------- Catalog (services & products used by the estimate / invoice builder) ---------- */
  catalog: () => delay(table('catalog')),
  async saveCatalogItem(item) {
    const data = { ...item, price: Number(item.price) };
    if (item.id) {
      const row = table('catalog').find((x) => x.id === item.id);
      Object.assign(row, data);
      return delay(row);
    }
    const row = { ...data, id: `cat_${(seq += 1)}` };
    table('catalog').push(row);
    return delay(row);
  },
  async removeCatalogItem(id) {
    const rows = table('catalog');
    rows.splice(rows.findIndex((x) => x.id === id), 1);
    return delay({ ok: true });
  },

  /* ---------- Taxes & billing ---------- */
  billing: () => delay(pick(settings.finance, BILLING_KEYS)),
  async saveBilling(data) {
    Object.assign(settings.finance, pick(data, BILLING_KEYS));
    return delay(pick(settings.finance, BILLING_KEYS));
  },

  /* ---------- Integrations ---------- */
  integrations: () => delay({ adAccounts: table('adAccounts'), platforms: table('aiPlatforms'), future: futureIntegrations, channels: settings.channels }),
  async setIntegration(kind, id, connected) {
    const row = table(kind === 'ads' ? 'adAccounts' : 'aiPlatforms').find((x) => x.id === id);
    row.connected = connected;
    if (kind === 'ads') row.account = connected ? (row.account || 'Greatstone Design (demo)') : null;
    return delay(row);
  },

  /* ---------- AI ---------- */
  ai: () => delay(settings.ai),
  async saveAi(data) {
    Object.assign(settings.ai, data);
    return delay(settings.ai);
  },

  /* ---------- Notifications ---------- */
  notifications: () => delay(settings.notifications),
  async saveNotifications(data) {
    Object.assign(settings.notifications, data);
    return delay(settings.notifications);
  },
};
