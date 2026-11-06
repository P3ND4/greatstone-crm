/*
 * Finance mock: service & product catalog, tax settings, line items for every estimate/invoice
 * (totals recomputed from lines so documents are always internally consistent) and payments.
 * Imported by services/client.js at startup.
 */
import { addDays } from 'date-fns';
import { createRandom } from '../../lib/random.js';
import { documentTotals } from '../../lib/money.js';
import { approvals, estimates, invoices } from './core.js';

export const financeSettings = {
  taxRate: 0.07, // Miami-Dade County combined sales tax (6% FL + 1% county surtax) — editable in Settings
  taxLabel: 'Sales tax (Miami-Dade 7%)',
  invoiceDueDays: 30,
  estimateValidDays: 30,
  currency: 'USD',
  defaultTerms: '50% deposit to schedule, 40% at rough-in / delivery, 10% at completion. Prices valid for 30 days. Changes to scope are billed through signed change orders.',
  defaultNotes: 'Thank you for trusting Greatstone Design with your home.',
  company: {
    name: 'Greatstone Design', tagline: 'Interior Design & Remodel', city: 'Miami, FL',
    email: 'studio@example.com', phone: '(305) 555-0100', web: 'greatstonedesign.example',
  },
};

export const catalog = [
  { id: 'cat_1', kind: 'service', name: 'Interior design — concept & mood board', unit: 'project', price: 3500, taxable: false },
  { id: 'cat_2', kind: 'service', name: 'Design development & drawings', unit: 'hour', price: 175, taxable: false },
  { id: 'cat_3', kind: 'service', name: 'Project management', unit: 'week', price: 950, taxable: false },
  { id: 'cat_4', kind: 'service', name: 'Demolition & haul-away', unit: 'lot', price: 4200, taxable: false },
  { id: 'cat_5', kind: 'service', name: 'Carpentry & installation labor', unit: 'hour', price: 85, taxable: false },
  { id: 'cat_6', kind: 'service', name: 'Plumbing rough-in & trim', unit: 'lot', price: 6800, taxable: false },
  { id: 'cat_7', kind: 'service', name: 'Electrical & lighting install', unit: 'lot', price: 5400, taxable: false },
  { id: 'cat_8', kind: 'service', name: 'Condo / HOA permit coordination', unit: 'lot', price: 1200, taxable: false },
  { id: 'cat_9', kind: 'service', name: 'Home staging (per room)', unit: 'room', price: 1850, taxable: false },
  { id: 'cat_10', kind: 'product', name: 'Custom cabinetry', unit: 'linear ft', price: 640, taxable: true },
  { id: 'cat_11', kind: 'product', name: 'Quartz countertop (fabricated)', unit: 'sq ft', price: 98, taxable: true },
  { id: 'cat_12', kind: 'product', name: 'Porcelain tile (installed)', unit: 'sq ft', price: 22.5, taxable: true },
  { id: 'cat_13', kind: 'product', name: 'Plumbing fixtures package', unit: 'set', price: 3850, taxable: true },
  { id: 'cat_14', kind: 'product', name: 'Lighting fixtures package', unit: 'set', price: 4200, taxable: true },
  { id: 'cat_15', kind: 'product', name: 'Furniture package', unit: 'room', price: 9800, taxable: true },
  { id: 'cat_16', kind: 'product', name: 'Custom drapery', unit: 'window', price: 1150, taxable: true },
  { id: 'cat_17', kind: 'product', name: 'Closet system', unit: 'linear ft', price: 310, taxable: true },
];

const r = createRandom(777);

/** Builds lines whose computed total lands near `target`, then the document total is set from the lines. */
function linesFor(target, docId) {
  const n = r.int(3, 6);
  const picks = [];
  while (picks.length < n) {
    const c = r.pick(catalog);
    if (!picks.includes(c)) picks.push(c);
  }
  const weights = picks.map(() => r.int(10, 40));
  const wsum = weights.reduce((a, b) => a + b, 0);
  return picks.map((c, k) => {
    const share = (target * weights[k]) / wsum / (c.taxable ? 1 + financeSettings.taxRate : 1);
    const qty = Math.max(1, Math.round(share / c.price));
    return {
      id: `${docId}_ln${k}`, catalogId: c.id, description: c.name, unit: c.unit,
      qty, unitPrice: c.price, discountPct: k === 0 && r.next() > 0.7 ? 5 : 0, taxable: c.taxable,
    };
  });
}

estimates.forEach((e) => {
  e.lines = linesFor(e.total, e.id);
  e.total = documentTotals(e.lines, financeSettings.taxRate).total;
  e.terms = financeSettings.defaultTerms;
  e.notes = financeSettings.defaultNotes;
});

// Spread open invoices across realistic aging buckets (some not yet due, some 1–30, 31–60, 61–90, 90+ days late).
const AGING_OFFSETS = [18, 9, 3, -6, -14, -27, -38, -52, -71, -104, 24, -2];
let openN = 0;
invoices.forEach((inv) => {
  if (!['sent', 'overdue', 'partial'].includes(inv.status)) return;
  const offset = AGING_OFFSETS[openN % AGING_OFFSETS.length];
  openN += 1;
  const due = addDays(new Date(new Date().toDateString()), offset);
  inv.dueAt = due.toISOString();
  inv.issuedAt = addDays(due, -30).toISOString();
  if (inv.status !== 'partial') inv.status = offset >= 0 ? 'sent' : 'overdue';
});

export const payments = [];
let payN = 1;
invoices.forEach((inv) => {
  const ratio = inv.total ? inv.paid / inv.total : 0;
  inv.lines = linesFor(inv.total, inv.id);
  inv.total = documentTotals(inv.lines, financeSettings.taxRate).total;
  inv.paid = inv.status === 'paid' ? inv.total : Math.round(inv.total * ratio * 100) / 100;
  inv.terms = financeSettings.defaultTerms;
  inv.notes = financeSettings.defaultNotes;
  inv.remindersSent = inv.status === 'overdue' ? r.int(1, 2) : 0;
  if (inv.paid > 0) {
    payments.push({
      id: `pay_${payN++}`, invoiceId: inv.id, amount: inv.paid,
      date: inv.paidAt || new Date(Math.min(addDays(new Date(inv.issuedAt), r.int(3, 20)).getTime(), addDays(new Date(), -1).getTime())).toISOString(),
      method: r.pick(['wire', 'ach', 'check', 'zelle', 'card']), reference: `REF-${10000 + payN * 37}`,
    });
  }
});

// Keep approval amounts in sync with the recomputed estimate totals.
approvals.forEach((a) => {
  if (a.kind === 'estimate') a.amount = estimates.find((e) => e.id === a.refId)?.total ?? a.amount;
});
