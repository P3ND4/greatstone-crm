/*
 * Core mock dataset, generated deterministically relative to "today" so the demo always looks current.
 * NEVER import this from components — go through src/services/*.
 */
import { addDays, addMonths, differenceInDays, startOfDay, startOfMonth, subDays, subMonths, setHours, setMinutes } from 'date-fns';
import { createRandom } from '../../lib/random.js';
import { makeAddress, makePerson, NEIGHBORHOODS } from './people.js';
import { users } from './users.js';

const r = createRandom(2026);
const TODAY = startOfDay(new Date());
const iso = (d) => d.toISOString();
const userIds = users.map((u) => u.id);

/* ------------------------------------------------------------------ contacts */
const CONTACT_TYPES = [
  ['client', 18], ['partner', 7], ['referrer', 4], ['architect', 3], ['contractor', 3],
];
const PARTNER_COMPANIES = [
  ['Coastal Stoneworks', 'Countertops & stone'], ['Bayline Cabinetry', 'Custom cabinetry'],
  ['Luma Lighting Studio', 'Lighting'], ['Grove Tile & Floor', 'Tile & flooring'],
  ['Palmetto Closets', 'Closet systems'], ['Atlantic Glass Co.', 'Shower glass & mirrors'],
  ['Verde Upholstery', 'Upholstery & drapery'], ['Keystone Permits Group', 'Permits & condo approvals'],
  ['Brisa Plumbing', 'Plumbing'], ['Arcadia Electric', 'Electrical'],
];

export const contacts = [];
let ci = 0;
for (const [type, count] of CONTACT_TYPES) {
  for (let k = 0; k < count; k += 1) {
    const p = makePerson(ci);
    const company = type === 'partner' || type === 'contractor'
      ? PARTNER_COMPANIES[(k + (type === 'contractor' ? 7 : 0)) % PARTNER_COMPANIES.length]
      : null;
    contacts.push({
      id: `c_${ci + 1}`,
      type,
      ...p,
      company: company ? company[0] : type === 'architect' ? `${p.lastName} Architecture` : null,
      specialty: company ? company[1] : null,
      neighborhood: NEIGHBORHOODS[ci % NEIGHBORHOODS.length],
      address: type === 'client' ? makeAddress(ci) : null,
      source: type === 'client' ? r.weighted([['referral', 60], ['instagram', 15], ['website', 12], ['houzz', 8], ['google', 5]]) : 'partner',
      tags: type === 'client' ? r.pick([['VIP'], ['Condo', 'HOA'], ['Repeat client'], [], ['Condo']]) : [type],
      ownerId: r.pick(userIds),
      createdAt: iso(subDays(TODAY, r.int(20, 700))),
    });
    ci += 1;
  }
}
const clients = contacts.filter((c) => c.type === 'client');
const partners = contacts.filter((c) => c.type === 'partner' || c.type === 'contractor');
const referrers = contacts.filter((c) => c.type === 'referrer' || c.type === 'client');

/* ------------------------------------------------------------------ leads */
const SERVICES = ['design', 'remodel', 'kitchen', 'bath', 'closet', 'flooring', 'staging', 'planning', 'furnishing'];
const SOURCES = [['referral', 46], ['instagram', 18], ['website', 14], ['google', 9], ['houzz', 8], ['facebook', 3], ['event', 2]];
const STARTS = ['asap', '1-3m', '3-6m', '6m+', 'unsure'];
const DESCRIPTIONS = [
  'Full kitchen remodel in a Coconut Grove condo. Needs HOA approval for plumbing relocation.',
  'Primary bathroom refresh — walk-in shower, double vanity, new tile.',
  'Furnish and style a new 3-bedroom unit before the family moves in.',
  'Open up the living/dining area, new flooring throughout, built-in bar.',
  'Stage a waterfront condo for sale within 4 weeks.',
  'Custom walk-in closet and dressing area in primary suite.',
  'Design consultation for a guest suite and home office.',
  'Turnkey remodel of a 1980s townhouse: kitchen, 2 baths, floors.',
  'Replace carpet with large-format porcelain, update lighting.',
  'Refresh common areas for a small boutique building lobby.',
];

export const leads = Array.from({ length: 40 }, (_, i) => {
  const p = makePerson(i + 40);
  const source = r.weighted(SOURCES);
  const createdAt = subDays(TODAY, Math.floor(r.next() ** 1.9 * 330));
  const status = r.weighted([['new', 22], ['contacted', 22], ['qualified', 20], ['converted', 22], ['disqualified', 14]]);
  return {
    id: `l_${i + 1}`,
    ...p,
    source,
    referredById: source === 'referral' ? r.pick(referrers).id : null,
    startWhen: r.pick(STARTS),
    description: DESCRIPTIONS[i % DESCRIPTIONS.length],
    serviceType: r.pick(SERVICES),
    budget: r.round(r.int(18, 260) * 1000, 500),
    neighborhood: r.pick(NEIGHBORHOODS),
    score: r.int(28, 96),
    status,
    assigneeId: r.pick(userIds),
    createdAt: iso(createdAt),
  };
});

/* ------------------------------------------------------------------ opportunities (pipeline) */
export const PIPELINE_STAGES = ['new', 'contacted', 'consultation', 'proposal', 'negotiation', 'won', 'lost'];
const NEXT_ACTIONS = ['Schedule consultation', 'Send mood board', 'Site measure', 'Send estimate', 'Follow up on estimate', 'Review selections', 'Sign contract'];

export const opportunities = Array.from({ length: 28 }, (_, i) => {
  const lead = leads[i % leads.length];
  const stage = r.weighted([['new', 4], ['contacted', 5], ['consultation', 5], ['proposal', 5], ['negotiation', 3], ['won', 4], ['lost', 2]]);
  const value = r.round(r.int(15, 320) * 1000, 500);
  return {
    id: `o_${i + 1}`,
    title: `${lead.lastName} — ${lead.neighborhood}`,
    leadId: lead.id,
    stage,
    value,
    probability: { new: 0.1, contacted: 0.2, consultation: 0.35, proposal: 0.5, negotiation: 0.7, won: 1, lost: 0 }[stage],
    nextAction: stage === 'won' || stage === 'lost' ? null : r.pick(NEXT_ACTIONS),
    nextActionAt: iso(addDays(TODAY, r.int(-2, 10))),
    stageEnteredAt: iso(subDays(TODAY, r.int(1, 34))),
    ownerId: r.pick(userIds),
    closedAt: stage === 'won' || stage === 'lost' ? iso(subDays(TODAY, r.int(3, 300))) : null,
  };
});

/* ------------------------------------------------------------------ projects */
const PROJECT_NAMES = [
  'Bayshore Condo Kitchen', 'Grove Isle Primary Suite', 'Alhambra Family Home', 'Collins Oceanfront Staging',
  'Crandon Penthouse Refresh', 'Edgewater Loft Turnkey', 'Pinecrest Pool House', 'Brickell Pied-à-terre',
  'Bal Harbour Closets', 'Mary St Townhouse', 'Main Hwy Guest Suite', 'Design District Showroom',
  'Sunny Isles Two-Bath Remodel', 'Harbor Dr Kitchen & Bar', 'Ponce Office Library', 'Indian Creek Living Room',
];
const STATUS_WEIGHTS = [['planning', 2], ['design', 3], ['permits', 2], ['construction', 4], ['finishing', 2], ['completed', 4], ['onHold', 1]];

export const projects = PROJECT_NAMES.map((name, i) => {
  const client = clients[i % clients.length];
  const status = i < 3 ? ['construction', 'construction', 'finishing'][i] : r.weighted(STATUS_WEIGHTS);
  const budget = r.round(r.int(35, 420) * 1000, 1000);
  const progress = {
    planning: r.int(3, 12), design: r.int(12, 35), permits: r.int(25, 40), construction: r.int(40, 80),
    finishing: r.int(80, 96), completed: 100, onHold: r.int(15, 55),
  }[status] / 100;
  // A few projects deliberately run hot so the dashboard has budget-risk examples.
  const burn = i % 5 === 1 ? 1.28 : i % 7 === 3 ? 1.18 : r.int(78, 104) / 100;
  const spent = Math.round(budget * Math.min(progress * burn, 1.15) * 100) / 100;
  const startDate = subDays(TODAY, status === 'planning' ? r.int(0, 20) : r.int(30, 260));
  return {
    id: `p_${i + 1}`,
    name,
    clientId: client.id,
    status,
    neighborhood: client.neighborhood,
    address: client.address,
    startDate: iso(startDate),
    endDate: iso(addDays(startDate, r.int(60, 220))),
    budget,
    spent,
    progress,
    contractValue: Math.round(budget * (1 + r.int(18, 32) / 100)),
    managerId: r.pick(userIds),
    partnerIds: [r.pick(partners).id, r.pick(partners).id].filter((v, k, a) => a.indexOf(v) === k),
    cover: i % 6,
  };
});

/* ------------------------------------------------------------------ invoices & estimates */
export const invoices = [];
export const estimates = [];
let invN = 1041;
let estN = 318;
projects.forEach((p, i) => {
  const count = p.status === 'planning' ? 1 : r.int(2, 5);
  for (let k = 0; k < count; k += 1) {
    const issued = subDays(TODAY, r.int(2, 360));
    const due = addDays(issued, 30);
    const total = r.round(p.contractValue / (count + 1) * (r.int(70, 120) / 100), 0.01);
    let status;
    if (due < subDays(TODAY, 1)) status = r.weighted([['paid', 90], ['overdue', 5], ['partial', 5]]);
    else status = r.weighted([['sent', 50], ['paid', 25], ['partial', 10], ['draft', 15]]);
    const paid = status === 'paid' ? total : status === 'partial' ? Math.round(total * 0.4 * 100) / 100 : 0;
    invoices.push({
      id: `inv_${invN}`, number: `INV-${invN}`, projectId: p.id, clientId: p.clientId,
      issuedAt: iso(issued), dueAt: iso(due), total: Math.round(total * 100) / 100, paid, status,
      paidAt: status === 'paid' ? iso(addDays(issued, r.int(1, Math.max(1, Math.min(28, differenceInDays(TODAY, issued)))))) : null,
    });
    invN += 1;
  }
  const estCount = r.int(1, 2);
  for (let k = 0; k < estCount; k += 1) {
    const created = subDays(TODAY, r.int(1, 120));
    estimates.push({
      id: `est_${estN}`, number: `EST-${estN}`, projectId: p.id, clientId: p.clientId,
      createdAt: iso(created), expiresAt: iso(addDays(created, 30)),
      total: r.round(r.int(8, 140) * 1000 + r.int(0, 99) * 10, 0.01),
      status: r.weighted([['draft', 2], ['sent', 4], ['viewed', 3], ['accepted', 5], ['declined', 1], ['expired', 1]]),
    });
    estN += 1;
  }
});

// Guarantee some payments in the current month so "This month" is never artificially empty.
invoices.filter((i) => i.status === 'sent').slice(0, 3).forEach((inv, k) => {
  inv.status = 'paid';
  inv.paid = inv.total;
  inv.paidAt = iso(addDays(startOfMonth(TODAY), Math.min(k * 2, differenceInDays(TODAY, startOfMonth(TODAY)))));
});

/* ------------------------------------------------------------------ expenses */
const EXPENSE_CATEGORIES = ['materials', 'labor', 'furniture', 'permits', 'subcontractors', 'freight', 'overhead'];
export const expenses = [];
let expN = 1;
for (let m = 11; m >= 0; m -= 1) {
  const monthStart = startOfMonth(subMonths(TODAY, m));
  const n = r.int(7, 12);
  for (let k = 0; k < n; k += 1) {
    const p = r.pick(projects);
    const d = addDays(monthStart, r.int(0, 27));
    if (d > TODAY) continue;
    expenses.push({
      id: `exp_${expN}`, projectId: k % 6 === 5 ? null : p.id,
      vendorId: r.pick(partners).id,
      category: k % 6 === 5 ? 'overhead' : r.pick(EXPENSE_CATEGORIES.slice(0, 6)),
      amount: r.round(r.int(400, 14500) + r.int(0, 99) / 100, 0.01),
      date: iso(d),
      status: d > subDays(TODAY, 10) ? r.weighted([['pending', 3], ['approved', 2]]) : 'approved',
      type: r.next() > 0.8 ? 'po' : 'expense',
    });
    expN += 1;
  }
}

/* ------------------------------------------------------------------ appointments */
const APPT_TYPES = ['consultation', 'siteVisit', 'showroom', 'virtual', 'install'];
export const appointments = Array.from({ length: 26 }, (_, i) => {
  const type = r.pick(APPT_TYPES);
  const day = addDays(TODAY, r.int(-6, 18));
  const start = setMinutes(setHours(day, r.pick([9, 10, 11, 13, 14, 15, 16])), r.pick([0, 30]));
  const project = r.next() > 0.35 ? r.pick(projects) : null;
  const contact = project ? contacts.find((c) => c.id === project.clientId) : r.pick(clients);
  return {
    id: `a_${i + 1}`,
    type,
    title: {
      consultation: `Design consultation — ${contact.lastName}`,
      siteVisit: `Site visit — ${project ? project.name : contact.neighborhood}`,
      showroom: `Showroom selections — ${contact.lastName}`,
      virtual: `Virtual check-in — ${contact.lastName}`,
      install: `Install day — ${project ? project.name : contact.lastName}`,
    }[type],
    start: iso(start),
    durationMin: r.pick([30, 60, 60, 90, 120]),
    location: type === 'virtual' ? 'Video call' : project?.address || contact.neighborhood,
    contactId: contact.id,
    projectId: project?.id ?? null,
    assigneeId: r.pick(userIds),
  };
}).sort((a, b) => a.start.localeCompare(b.start));

/* ------------------------------------------------------------------ tasks */
const TASK_TITLES = [
  'Confirm tile delivery window', 'Send revised floor plan', 'Order cabinet hardware samples',
  'Submit condo alteration request', 'Call client about vanity finish', 'Approve electrician quote',
  'Upload progress photos', 'Prepare change order', 'Book showroom slot', 'Follow up on deposit',
  'Review lighting plan', 'Schedule final walkthrough', 'Request HOA insurance certificate',
  'Send mood board v2', 'Check countertop template date',
];
export const tasks = Array.from({ length: 30 }, (_, i) => {
  const project = r.pick(projects);
  return {
    id: `t_${i + 1}`,
    title: TASK_TITLES[i % TASK_TITLES.length],
    dueAt: iso(addDays(TODAY, i < 7 ? 0 : r.int(-5, 14))),
    priority: r.weighted([['high', 3], ['medium', 5], ['low', 2]]),
    done: i < 7 ? i % 4 === 3 : r.next() > 0.7,
    projectId: project.id,
    assigneeId: r.pick(userIds),
  };
});

/* ------------------------------------------------------------------ conversations + messages (same shape for whatsapp + email) */
const WA_SCRIPTS = [
  [['in', 'Hi Tessa! Can we move Thursday’s site visit to the afternoon?'], ['out', 'Of course — would 2:30 PM work for you?'], ['in', 'Perfect, see you then 🙏'], ['note', 'Client prefers afternoons, building access until 5 PM.'], ['in', 'Also, is the plumber coming the same day?']],
  [['out', 'Here are the two tile options we discussed.', 'Tile_options_v2.pdf'], ['in', 'Love the second one 😍'], ['in', 'Is it in stock or is there a lead time?'], ['out', 'Lead time is ~3 weeks, I’ll confirm with the supplier today.'], ['in', 'Great, thanks!']],
  [['in', 'Just sent the HOA alteration form, can you check it?', 'HOA_form_signed.pdf'], ['out', 'Received — reviewing now.'], ['note', 'Missing insurance certificate from GC. Requested.'], ['out', 'All good except the insurance certificate, we’re requesting it from the contractor.'], ['in', 'Ok, let me know if you need anything else from me']],
  [['in', 'What time is the countertop install tomorrow?'], ['out', 'The crew arrives at 9 AM, should be done by 1 PM.'], ['in', 'Will they need parking?'], ['out', 'Yes, 1 spot for the truck. Could you register it with the front desk?'], ['in', 'Done ✅'], ['in', 'Can you send me photos once it’s in?']],
  [['out', 'Hi! Following up on the estimate we sent last week.'], ['in', 'Hi! We’re reviewing it, a few questions about the vanity'], ['in', 'Can we see options under $3k?'], ['out', 'Absolutely, I’ll prepare 3 alternatives.', 'Vanity_options.jpg'], ['in', 'Thank you!! The middle one looks great']],
  [['in', 'Could you send the invoice again? I can’t find the email'], ['out', 'Sure, here it is.', 'INV-1046.pdf'], ['in', 'Got it, paying today 👍']],
];
const EMAIL_SCRIPTS = [
  { subject: 'Revised estimate for the kitchen', label: 'Clients', msgs: [['out', 'Hi,\n\nAttached is the revised estimate with the quartz upgrade and the under-cabinet lighting.\n\nBest,\nTessa', 'EST-322_revised.pdf'], ['in', 'Thanks Tessa — the total works for us. Could we split the deposit in two payments?'], ['out', 'Yes, 30% now and 20% at demo is fine. I’ll update the schedule.'], ['in', 'Perfect. Please send the updated schedule and we’ll sign.']] },
  { subject: 'Building management — alteration agreement', label: 'Permits', msgs: [['in', 'Good morning,\n\nPlease find the alteration agreement for unit 1803. We need the contractor license and COI before approval.', 'Alteration_Agreement.pdf'], ['out', 'Thank you, we’ll send both documents by Friday.'], ['in', 'Noted. Work hours are Mon–Fri 8:30–4:30, no work on weekends.']] },
  { subject: 'Question about the lighting fixtures', label: 'Clients', msgs: [['in', 'Hi! Are the pendants over the island dimmable? We want a softer light at night.'], ['out', 'Yes — they are on a 0–10V dimmer. We can also add a scene for evenings.'], ['in', 'Amazing, let’s do that.']] },
  { subject: 'Lead time — custom vanity', label: 'Vendors', msgs: [['out', 'Hi team, can you confirm lead time for the 72" walnut vanity (order #4471)?'], ['in', 'Hi Tessa, current lead time is 5–6 weeks from approved shop drawings.', 'Shop_drawing_4471.pdf'], ['out', 'Approved, please proceed.']] },
  { subject: 'Deposit confirmation', label: 'Billing', msgs: [['in', 'Hi, we just sent the deposit by wire. Please confirm when received.'], ['out', 'Received today — thank you! Receipt attached.', 'Receipt_deposit.pdf']] },
  { subject: 'Referral — friend looking for a designer', label: 'Clients', msgs: [['in', 'Hi Tessa,\n\nMy neighbor in Key Biscayne is renovating two bathrooms and asked for your contact. Is it ok if I share it?'], ['out', 'Thank you so much! Of course — please share my email and phone.'], ['in', 'Done, her name is Mariana. She’ll reach out this week.']] },
  { subject: 'Photos from this weekend', label: 'Clients', msgs: [['in', 'Sending a few photos of the living room with the new rug. What do you think about the coffee table?', 'IMG_2041.jpg'], ['out', 'It looks beautiful! I’d go one size smaller on the coffee table — I’ll send two options.']] },
  { subject: 'Countertop template date', label: 'Vendors', msgs: [['in', 'We can template on Tuesday at 10 AM. Please confirm cabinets will be fully installed.'], ['out', 'Confirmed — cabinets will be leveled and secured by Monday.']] },
];
const EMAIL_FOLDERS = [['inbox', 70], ['archive', 12], ['sent', 8], ['drafts', 4], ['trash', 3]];

export const conversations = [];
export const messages = [];
let msgN = 1;
for (let i = 0; i < 30; i += 1) {
  const channel = i % 5 < 3 ? 'whatsapp' : 'email';
  const contact = r.pick([...clients, ...clients, ...partners]);
  const script = channel === 'whatsapp' ? WA_SCRIPTS[i % WA_SCRIPTS.length] : EMAIL_SCRIPTS[i % EMAIL_SCRIPTS.length];
  const steps = channel === 'whatsapp' ? script : script.msgs;
  const unanswered = (i % 3 === 0 || i < 5) && steps.some(([d]) => d === 'in');
  // Trim script so the last real message is inbound for unanswered threads, outbound otherwise.
  let thread = [...steps];
  const lastReal = (arr) => [...arr].reverse().find(([d]) => d !== 'note');
  while (thread.length > 1 && lastReal(thread)?.[0] !== (unanswered ? 'in' : 'out')) thread = thread.slice(0, -1);
  const lastAt = new Date(Date.now() - (i < 4 ? r.int(8, 600) : r.int(30, 60 * 24 * 9)) * 60 * 1000);
  const cid = `cv_${i + 1}`;
  let t = lastAt.getTime();
  const built = thread.map(([dir, body, attachment], k) => {
    const at = new Date(t - (thread.length - 1 - k) * r.int(6, 180) * 60 * 1000);
    return {
      id: `m_${msgN++}`, conversationId: cid, channel,
      direction: dir === 'note' ? 'out' : dir, isNote: dir === 'note', body,
      attachments: attachment ? [{ name: attachment, size: `${r.int(120, 2400)} KB`, type: attachment.split('.').pop() }] : [],
      sentAt: at.toISOString(),
      status: dir === 'out' ? 'read' : null,
      authorId: dir === 'in' ? null : r.pick(userIds),
    };
  });
  // most recent outbound message gets a less-final status sometimes
  const lastOut = [...built].reverse().find((m) => m.direction === 'out' && !m.isNote);
  if (lastOut) lastOut.status = r.weighted([['read', 5], ['delivered', 3], ['sent', 1]]);
  messages.push(...built);
  const last = lastReal(thread);
  const lastInbound = [...built].reverse().find((m) => m.direction === 'in');
  conversations.push({
    id: cid,
    channel,
    contactId: contact.id,
    projectId: r.next() > 0.4 ? r.pick(projects).id : null,
    subject: channel === 'email' ? script.subject : null,
    labels: channel === 'email' ? [script.label] : [],
    folder: channel === 'email' ? (i < 10 ? 'inbox' : r.weighted(EMAIL_FOLDERS)) : null,
    starred: channel === 'email' && r.next() > 0.7,
    lastMessage: last[1].split('\n').find(Boolean),
    lastMessageAt: built[built.length - 1].sentAt,
    lastDirection: last[0],
    lastInboundAt: lastInbound?.sentAt ?? null,
    unread: unanswered ? r.int(1, 3) : 0,
    assigneeId: r.pick(userIds),
  });
}
conversations.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));

/* ------------------------------------------------------------------ approvals */
export const approvals = [
  ...estimates.filter((e) => e.status === 'draft').slice(0, 2).map((e) => ({
    id: `ap_${e.id}`, kind: 'estimate', refId: e.id, label: `${e.number}`, projectId: e.projectId, amount: e.total, requestedAt: e.createdAt,
  })),
  ...expenses.filter((e) => e.status === 'pending').slice(0, 3).map((e) => ({
    id: `ap_${e.id}`, kind: e.type === 'po' ? 'po' : 'changeOrder', refId: e.id, label: e.type === 'po' ? `PO ${e.id.replace('exp_', '#')}` : `CO ${e.id.replace('exp_', '#')}`, projectId: e.projectId, amount: e.amount, requestedAt: e.date,
  })),
  { id: 'ap_sel_1', kind: 'selection', refId: 'sel_1', label: 'Kitchen backsplash tile', projectId: projects[0].id, amount: 4860, requestedAt: iso(subDays(TODAY, 2)) },
];

export const MOCK_TODAY = iso(TODAY);
export const MOCK_RANGE_START = iso(startOfMonth(subMonths(TODAY, 11)));
export const MOCK_RANGE_END = iso(addMonths(TODAY, 0));
