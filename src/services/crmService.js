/** Cross-entity CRM reads: lead / contact / opportunity detail with related records + activity. */
import { addDays, differenceInCalendarDays } from 'date-fns';
import { delay, table } from './client.js';

const byId = (t, id) => table(t).find((r) => r.id === id) || null;
const notFound = () => Object.assign(new Error('Not found'), { status: 404 });

export const crmService = {
  async lead(id) {
    const lead = byId('leads', id);
    if (!lead) throw notFound();
    const opp = table('opportunities').find((o) => o.leadId === id) || null;
    const activity = [
      { id: 'a1', kind: 'created', at: lead.createdAt, vars: { source: lead.source } },
      lead.referredById && { id: 'a2', kind: 'referral', at: lead.createdAt, vars: { name: byId('contacts', lead.referredById)?.name } },
      ['contacted', 'qualified', 'converted'].includes(lead.status) && { id: 'a3', kind: 'contacted', at: addDays(new Date(lead.createdAt), 1).toISOString() },
      ['qualified', 'converted'].includes(lead.status) && { id: 'a4', kind: 'qualified', at: addDays(new Date(lead.createdAt), 6).toISOString() },
      opp && { id: 'a5', kind: 'opportunity', at: opp.stageEnteredAt },
    ].filter(Boolean);
    return delay({
      lead,
      referrer: byId('contacts', lead.referredById),
      assignee: byId('users', lead.assigneeId),
      opportunity: opp,
      activity,
    });
  },

  async contact(id) {
    const contact = byId('contacts', id);
    if (!contact) throw notFound();
    const projects = table('projects').filter((p) => p.clientId === id || p.partnerIds.includes(id));
    const invoices = table('invoices').filter((i) => i.clientId === id);
    const conversations = table('conversations').filter((c) => c.contactId === id);
    const appointments = table('appointments').filter((a) => a.contactId === id);
    const referrals = table('leads').filter((l) => l.referredById === id);
    const expenses = table('expenses').filter((e) => e.vendorId === id);
    return delay({ contact, owner: byId('users', contact.ownerId), projects, invoices, conversations, appointments, referrals, expenses });
  },

  async opportunity(id) {
    const opp = byId('opportunities', id);
    if (!opp) throw notFound();
    const lead = byId('leads', opp.leadId);
    return delay({
      opportunity: { ...opp, daysInStage: differenceInCalendarDays(new Date(), new Date(opp.stageEnteredAt)) },
      lead,
      owner: byId('users', opp.ownerId),
      estimates: table('estimates').slice(0, 2),
    });
  },

  async pipeline({ ownerId } = {}) {
    const now = new Date();
    const items = table('opportunities')
      .filter((o) => !ownerId || o.ownerId === ownerId)
      .map((o) => ({
        ...o,
        lead: byId('leads', o.leadId),
        owner: byId('users', o.ownerId),
        daysInStage: differenceInCalendarDays(now, new Date(o.stageEnteredAt)),
      }));
    return delay(items);
  },

  async moveOpportunity(id, stage) {
    const o = byId('opportunities', id);
    Object.assign(o, {
      stage,
      stageEnteredAt: new Date().toISOString(),
      probability: { new: 0.1, contacted: 0.2, consultation: 0.35, proposal: 0.5, negotiation: 0.7, won: 1, lost: 0 }[stage],
      closedAt: ['won', 'lost'].includes(stage) ? new Date().toISOString() : null,
      nextAction: ['won', 'lost'].includes(stage) ? null : o.nextAction,
    });
    return delay(o);
  },
};
