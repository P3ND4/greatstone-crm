/*
 * AI service — DEMO ONLY. Every "analysis" here is a deterministic heuristic over the mock CRM data,
 * shaped like the output a real model/agent would return. Swap each function for the real endpoint
 * (e.g. a Supabase Edge Function calling an LLM) without touching the UI.
 */
import { differenceInCalendarDays, differenceInMinutes, format, getDay, getHours, startOfMonth, subMonths } from 'date-fns';
import { delay, table, currentUserId } from './client.js';
import * as ai from '../data/mock/ai.js';

const byId = (t, id) => table(t).find((r) => r.id === id) || null;
let seq = 3000;

const POSITIVE = /(love|great|perfect|amazing|thank|beautiful|works for us|😍|🙏|✅|👍)/i;
const NEGATIVE = /(delay|problem|issue|again|can't|cannot|missing|late|worried|disappoint|still waiting)/i;
const TOPICS = [
  ['scheduling', /(visit|time|tomorrow|thursday|schedule|arrive|install)/i],
  ['selections', /(tile|vanity|countertop|pendant|fixture|rug|coffee table|option)/i],
  ['hoa', /(hoa|alteration|building|management|coi|insurance)/i],
  ['billing', /(invoice|deposit|payment|estimate|wire|receipt)/i],
  ['leadTime', /(lead time|stock|weeks|delivery|order)/i],
];
const OBJECTIONS = [
  ['price', /(under \$|options under|cheaper|budget|too expensive)/i],
  ['paymentTerms', /(split the deposit|two payments|installments)/i],
  ['timing', /(lead time|weeks|delay|when)/i],
  ['hoaRules', /(no work on weekends|work hours|coi|insurance certificate)/i],
];
const OPPORTUNITIES = [
  ['upsell', /(wine fridge|add|also|dimmable|scene|another room|guest bath)/i],
  ['referral', /(referral|neighbor|friend|share my|her name)/i],
  ['reorder', /(two options|alternatives|middle one)/i],
];

function analyzeConversation(c) {
  const msgs = table('messages').filter((m) => m.conversationId === c.id && !m.isNote);
  const inbound = msgs.filter((m) => m.direction === 'in').map((m) => m.body).join(' ');
  const all = msgs.map((m) => m.body).join(' ');
  const pos = (inbound.match(new RegExp(POSITIVE, 'gi')) || []).length;
  const neg = (inbound.match(new RegExp(NEGATIVE, 'gi')) || []).length;
  const hoursWaiting = c.lastDirection === 'in' ? Math.round(differenceInMinutes(new Date(), new Date(c.lastMessageAt)) / 60) : 0;
  const sentiment = neg > pos ? 'negative' : pos > 0 ? 'positive' : 'neutral';
  const contact = byId('contacts', c.contactId);
  return {
    id: c.id,
    channel: c.channel,
    contact,
    project: byId('projects', c.projectId),
    subject: c.subject,
    sentiment,
    score: Math.max(-1, Math.min(1, (pos - neg) / 3)),
    topics: TOPICS.filter(([, re]) => re.test(all)).map(([k]) => k),
    objections: OBJECTIONS.filter(([, re]) => re.test(inbound)).map(([k]) => k),
    opportunities: OPPORTUNITIES.filter(([, re]) => re.test(all)).map(([k]) => k),
    hoursWaiting,
    atRisk: hoursWaiting >= 24 || sentiment === 'negative',
    lastMessage: c.lastMessage,
  };
}

function responseTimes(channel) {
  const convs = table('conversations').filter((c) => c.channel === channel);
  const deltas = [];
  convs.forEach((c) => {
    const msgs = table('messages').filter((m) => m.conversationId === c.id && !m.isNote).sort((a, b) => a.sentAt.localeCompare(b.sentAt));
    msgs.forEach((m, i) => {
      if (m.direction === 'in' && msgs[i + 1]?.direction === 'out') deltas.push(differenceInMinutes(new Date(msgs[i + 1].sentAt), new Date(m.sentAt)));
    });
  });
  const sorted = deltas.sort((a, b) => a - b);
  return { channel, samples: sorted.length, medianMin: sorted.length ? sorted[Math.floor(sorted.length / 2)] : null, avgMin: sorted.length ? Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length) : null };
}

export const aiService = {
  async hub() {
    const modules = ai.AI_MODULES.map((m) => {
      const runs = table('aiRuns').filter((r) => r.module === m);
      return { module: m, lastRun: runs[0] || null, runs: runs.length, next: ai.nextScheduled[m] || null };
    });
    return delay({ modules, platforms: table('aiPlatforms'), adAccounts: table('adAccounts') });
  },

  async runs(module) {
    return delay(table('aiRuns').filter((r) => r.module === module));
  },

  /** Simulated run: takes ~1.5 s, appends a run record and (for Lead Finder) new results. */
  async run(module) {
    await new Promise((res) => { setTimeout(res, 1400); });
    const run = { id: `run_${(seq += 1)}`, module, trigger: 'manual', status: 'completed', startedAt: new Date().toISOString(), durationSec: 2, items: 0, note: null };
    if (module === 'leadFinder') {
      const fresh = [
        { persona: 'New owner', source: 'realestate', signal: 'Closed on a Key Biscayne condo last week — 1990s finishes in listing photos', neighborhood: 'Key Biscayne' },
        { persona: 'Homeowner', source: 'google', signal: 'Asked in a local forum for “a designer who handles condo approvals”', neighborhood: 'Coconut Grove' },
      ].map((x, k) => ({ id: `lf_${(seq += 1)}`, name: ['Paula Ortiz', 'Sam Whitaker'][k], estBudget: [120000, 85000][k], score: [91, 84][k], foundAt: new Date().toISOString(), status: 'new', ...x }));
      table('leadFinderResults').unshift(...fresh);
      run.items = fresh.length;
    } else {
      run.items = Math.floor(5 + Math.random() * 20);
    }
    table('aiRuns').unshift(run);
    return delay(run);
  },

  /* ---------- 1. Communication analysis ---------- */
  async communications() {
    const rows = table('conversations').map(analyzeConversation);
    const count = (key) => {
      const map = {};
      rows.forEach((r) => r[key].forEach((k) => { map[k] = (map[k] || 0) + 1; }));
      return Object.entries(map).map(([k, n]) => ({ key: k, count: n })).sort((a, b) => b.count - a.count);
    };
    return delay({
      totals: {
        conversations: rows.length,
        positive: rows.filter((r) => r.sentiment === 'positive').length,
        neutral: rows.filter((r) => r.sentiment === 'neutral').length,
        negative: rows.filter((r) => r.sentiment === 'negative').length,
        atRisk: rows.filter((r) => r.atRisk).length,
      },
      responseTimes: [responseTimes('whatsapp'), responseTimes('email'), responseTimes('sms')],
      topics: count('topics'),
      objections: count('objections'),
      opportunities: rows.filter((r) => r.opportunities.length).slice(0, 6),
      atRisk: rows.filter((r) => r.atRisk).sort((a, b) => b.hoursWaiting - a.hoursWaiting).slice(0, 6),
      summaries: rows.slice(0, 8),
    });
  },

  /* ---------- 2. Prospecting analysis ---------- */
  async prospecting() {
    const prospects = table('prospects');
    const seg = {};
    prospects.forEach((p) => {
      seg[p.segment] ||= { contacted: 0, replied: 0, converted: 0 };
      if (p.status !== 'new') seg[p.segment].contacted += 1;
      if (['replied', 'meeting', 'converted'].includes(p.status)) seg[p.segment].replied += 1;
      if (p.status === 'converted') seg[p.segment].converted += 1;
    });
    const segments = Object.entries(seg).map(([segment, v]) => ({ segment, ...v, replyRate: v.contacted ? v.replied / v.contacted : null })).sort((a, b) => (b.replyRate ?? 0) - (a.replyRate ?? 0));
    const messages = table('sequences').flatMap((s) => s.steps.map((st, k) => ({
      id: `${s.id}_${k}`, sequence: s.name, subject: st.subject, channel: st.channel, day: st.day,
      replyRate: Math.round((0.08 + ((s.id.charCodeAt(3) * 7 + k * 13) % 23) / 100) * 100) / 100,
    }))).sort((a, b) => b.replyRate - a.replyRate);
    const NBA = { new: 'firstTouch', contacted: 'followUp', replied: 'bookMeeting', meeting: 'sendProposal' };
    const recommendations = prospects.filter((p) => NBA[p.status]).sort((a, b) => b.score - a.score).slice(0, 8)
      .map((p) => ({ ...p, action: NBA[p.status], list: table('prospectLists').find((l) => l.id === p.listId) }));
    return delay({ segments, messages, recommendations, bestHour: '10:00–11:30', bestDay: 'Tuesday' });
  },

  /* ---------- 3. Lead finder ---------- */
  async leadFinder() {
    return delay({ config: { ...ai.leadFinderConfig }, platforms: table('aiPlatforms'), results: table('leadFinderResults'), next: ai.nextScheduled.leadFinder });
  },
  async saveLeadFinderConfig(config) {
    Object.assign(ai.leadFinderConfig, config);
    return delay(ai.leadFinderConfig);
  },
  async togglePlatform(id) {
    const p = table('aiPlatforms').find((x) => x.id === id);
    p.connected = !p.connected;
    return delay(p);
  },
  async resolveResult(id, action) {
    const r = table('leadFinderResults').find((x) => x.id === id);
    if (action === 'lead') {
      const [firstName, ...rest] = r.name.split(' ');
      table('leads').unshift({
        id: `l_ai_${(seq += 1)}`, firstName, lastName: rest.join(' '), name: r.name, email: '', phone: '', source: 'website', referredById: null,
        startWhen: 'unsure', description: `AI Lead Finder — ${r.signal}`, serviceType: 'design', budget: r.estBudget, neighborhood: r.neighborhood,
        score: r.score, status: 'new', assigneeId: currentUserId(), createdAt: new Date().toISOString(),
      });
      r.status = 'added';
    } else if (action === 'prospect') {
      table('prospects').unshift({
        id: `pr_ai_${(seq += 1)}`, listId: 'pl_2', segment: 'agent', company: r.persona, name: r.name, role: r.persona, email: '', phone: '',
        neighborhood: r.neighborhood, status: 'new', score: r.score, sequenceId: null, step: 0, lastTouchAt: null, nextTouchAt: null, ownerId: currentUserId(),
      });
      r.status = 'added';
    } else {
      r.status = 'dismissed';
    }
    return delay(r);
  },

  /* ---------- 4. Pattern detection ---------- */
  async patterns() {
    const now = new Date();
    const leads = table('leads');
    const seasonality = Array.from({ length: 12 }, (_, k) => {
      const start = startOfMonth(subMonths(now, 11 - k));
      const key = format(start, 'yyyy-MM');
      return { key, label: format(start, 'MMM'), fullLabel: format(start, 'MMMM yyyy'), leads: leads.filter((l) => l.createdAt.slice(0, 7) === key).length };
    });
    const src = {};
    leads.forEach((l) => {
      src[l.source] ||= { total: 0, converted: 0, budget: 0 };
      src[l.source].total += 1;
      src[l.source].budget += l.budget || 0;
      if (l.status === 'converted') src[l.source].converted += 1;
    });
    const channels = Object.entries(src).map(([source, v]) => ({ source, ...v, rate: v.total ? v.converted / v.total : null, avgBudget: v.total ? v.budget / v.total : null })).sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0));
    const ltvMap = {};
    table('invoices').forEach((i) => { ltvMap[i.clientId] = (ltvMap[i.clientId] || 0) + (i.paid || 0); });
    const ltv = Object.entries(ltvMap).map(([id, value]) => ({ contact: byId('contacts', id), value: Math.round(value * 100) / 100, projects: table('projects').filter((p) => p.clientId === id).length }))
      .filter((x) => x.contact).sort((a, b) => b.value - a.value).slice(0, 6);
    // Reply heatmap: inbound messages by weekday × time block, blended with a seeded baseline so the demo grid isn't sparse.
    const BLOCKS = [[8, 10], [10, 12], [12, 14], [14, 16], [16, 18], [18, 21]];
    const grid = Array.from({ length: 7 }, (_, d) => BLOCKS.map(([a], b) => ({ day: d, block: b, value: ((d * 7 + b * 5) % 9) / 3 + (d > 0 && d < 6 && (b === 1 || b === 4) ? 3 : 0) })));
    table('messages').filter((m) => m.direction === 'in').forEach((m) => {
      const dt = new Date(m.sentAt);
      const b = BLOCKS.findIndex(([a, z]) => getHours(dt) >= a && getHours(dt) < z);
      if (b >= 0) grid[getDay(dt)][b].value += 1;
    });
    const max = Math.max(...grid.flat().map((c) => c.value));
    return delay({
      seasonality,
      channels,
      ltv,
      heatmap: { blocks: BLOCKS.map(([a, z]) => `${a}–${z}h`), rows: grid.map((row) => row.map((c) => ({ ...c, level: Math.round((c.value / max) * 4) }))) },
      insights: [
        { key: 'referralBest', vars: { rate: channels.find((c) => c.source === 'referral')?.rate } },
        { key: 'peakSeason', vars: { month: seasonality.reduce((a, b) => (b.leads > a.leads ? b : a)).fullLabel } },
        { key: 'bestWindow', vars: {} },
      ],
    });
  },

  /* ---------- 5. Email mining ---------- */
  async emailMining() {
    const now = new Date();
    const emailConvs = table('conversations').filter((c) => c.channel === 'email');
    const leadEmails = new Set(table('leads').map((l) => l.email));
    const referrals = emailConvs.filter((c) => /referral|friend|neighbor/i.test(`${c.subject} ${c.lastMessage}`)).map((c) => ({
      id: `em_ref_${c.id}`, kind: 'referral', conversationId: c.id, contact: byId('contacts', c.contactId), detail: c.subject, suggestion: 'createLead',
    }));
    const noLead = emailConvs.map((c) => byId('contacts', c.contactId)).filter((c) => c && c.type !== 'client' && !leadEmails.has(c.email))
      .filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i).slice(0, 4)
      .map((c) => ({ id: `em_nl_${c.id}`, kind: 'contactNoLead', contact: c, detail: c.company || c.type, suggestion: 'askReferral' }));
    const cold = emailConvs.filter((c) => c.lastDirection === 'out' && differenceInCalendarDays(now, new Date(c.lastMessageAt)) >= 3).slice(0, 5)
      .map((c) => ({ id: `em_cold_${c.id}`, kind: 'coldThread', conversationId: c.id, contact: byId('contacts', c.contactId), detail: c.subject, days: differenceInCalendarDays(now, new Date(c.lastMessageAt)), suggestion: 'followUp' }));
    const reactivate = table('projects').filter((p) => p.status === 'completed').map((p) => ({
      id: `em_re_${p.id}`, kind: 'reactivate', contact: byId('contacts', p.clientId), detail: p.name, days: differenceInCalendarDays(now, new Date(p.endDate)), suggestion: 'checkIn',
    })).slice(0, 5);
    return delay({ findings: [...referrals, ...noLead, ...cold, ...reactivate], scanned: emailConvs.length, messages: table('messages').filter((m) => m.channel === 'email').length });
  },

  /* ---------- 6. Campaigns & ads ---------- */
  async campaigns() {
    const rows = table('adCampaigns').map((c) => ({
      ...c,
      ctr: c.impressions ? c.clicks / c.impressions : null,
      cpl: c.leads ? c.spend / c.leads : null,
      roas: c.spend ? c.revenue / c.spend : null,
    }));
    const active = rows.filter((c) => c.spend > 0);
    const spend = active.reduce((a, c) => a + c.spend, 0);
    const leads = active.reduce((a, c) => a + c.leads, 0);
    const revenue = active.reduce((a, c) => a + c.revenue, 0);
    return delay({
      accounts: table('adAccounts'),
      campaigns: rows,
      totals: { spend: Math.round(spend * 100) / 100, leads, cpl: leads ? spend / leads : null, roas: spend ? revenue / spend : null, won: active.reduce((a, c) => a + c.won, 0) },
      audiences: ai.audienceSuggestions,
    });
  },
  async toggleAdAccount(id) {
    const a = table('adAccounts').find((x) => x.id === id);
    a.connected = !a.connected;
    a.account = a.connected ? `${a.name} (demo)` : null;
    return delay(a);
  },

  /* ---------- 7. Assistant (intent matching over CRM data) ---------- */
  async ask(question) {
    await new Promise((res) => { setTimeout(res, 500); });
    const q = question.toLowerCase();
    const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
    if (/(overdue|vencid|unpaid|cobrar|owe)/.test(q)) {
      const rows = table('invoices').filter((i) => ['sent', 'partial', 'overdue'].includes(i.status) && new Date(i.dueAt) < new Date()).sort((a, b) => (b.total - b.paid) - (a.total - a.paid));
      return { key: 'overdue', vars: { n: rows.length, amount: money(rows.reduce((a, i) => a + i.total - i.paid, 0)) },
        items: rows.slice(0, 5).map((i) => ({ label: `${i.number} · ${byId('contacts', i.clientId)?.name}`, meta: money(i.total - i.paid), to: `/finance/invoices/${i.id}` })),
        actions: [{ key: 'openInvoices', to: '/finance/invoices?status=overdue' }] };
    }
    if (/(today|hoy|agenda|appointment|cita|visit)/.test(q)) {
      const start = new Date(new Date().toDateString());
      const end = new Date(start.getTime() + 7 * 864e5);
      const rows = table('appointments').filter((a) => new Date(a.start) >= start && new Date(a.start) < end);
      return { key: 'agenda', vars: { n: rows.length },
        items: rows.slice(0, 5).map((a) => ({ label: a.title, meta: format(new Date(a.start), 'EEE MMM d, h:mm a'), to: `/crm/agenda/${a.id}` })),
        actions: [{ key: 'openAgenda', to: '/crm/agenda?view=week' }, { key: 'newAppointment', quick: 'appointment' }] };
    }
    if (/(risk|riesgo|budget|presupuesto|over)/.test(q)) {
      const rows = table('projects').filter((p) => !['completed', 'onHold'].includes(p.status) && p.budget && p.spent / p.budget - p.progress > 0.1);
      return { key: 'risk', vars: { n: rows.length },
        items: rows.map((p) => ({ label: p.name, meta: `${Math.round((p.spent / p.budget) * 100)}% / ${Math.round(p.progress * 100)}%`, to: `/projects/${p.id}?tab=budget` })),
        actions: [{ key: 'openProjects', to: '/projects?status=active' }] };
    }
    if (/(lead|prospect|nuevo|new client|cliente)/.test(q)) {
      const rows = table('leads').filter((l) => l.status === 'new').sort((a, b) => b.score - a.score);
      return { key: 'leads', vars: { n: rows.length },
        items: rows.slice(0, 5).map((l) => ({ label: l.name, meta: `${l.neighborhood} · ${l.score}`, to: `/crm/leads/${l.id}` })),
        actions: [{ key: 'openLeads', to: '/crm/leads?status=new&sort=score:desc' }, { key: 'runLeadFinder', to: '/ai/lead-finder' }] };
    }
    if (/(message|mensaje|reply|respond|whatsapp|email|correo|sms|text)/.test(q)) {
      const rows = table('conversations').filter((c) => c.lastDirection === 'in').sort((a, b) => a.lastMessageAt.localeCompare(b.lastMessageAt));
      return { key: 'unanswered', vars: { n: rows.length },
        items: rows.slice(0, 5).map((c) => ({ label: byId('contacts', c.contactId)?.name, meta: c.channel, to: `/crm/communications/${c.channel}?c=${c.id}` })),
        actions: [{ key: 'openInbox', to: '/crm/communications/whatsapp?f=unread' }] };
    }
    if (/(revenue|ingres|sales|venta|month|mes)/.test(q)) {
      const start = startOfMonth(new Date());
      const paid = table('payments').filter((p) => new Date(p.date) >= start).reduce((a, p) => a + p.amount, 0);
      return { key: 'revenue', vars: { amount: money(paid) }, items: [], actions: [{ key: 'openReports', to: '/finance/reports?range=thisMonth' }] };
    }
    return { key: 'fallback', vars: {}, items: [], actions: [] };
  },
};
