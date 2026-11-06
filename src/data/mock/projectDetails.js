/*
 * Per-project detail mock: rooms/scope, phases (timeline), selections & materials, budget lines,
 * documents, photos (placeholder tiles, no real images) and notes. Deterministic per project.
 */
import { addDays, differenceInCalendarDays } from 'date-fns';
import { createRandom } from '../../lib/random.js';
import { contacts, expenses, projects } from './core.js';
import { users } from './users.js';

const iso = (d) => d.toISOString();
const partners = contacts.filter((c) => ['partner', 'contractor'].includes(c.type));

const ROOM_SETS = [
  ['Kitchen', 'Living / dining', 'Powder room'],
  ['Primary bathroom', 'Primary closet', 'Primary bedroom'],
  ['Kitchen', 'Guest bathroom', 'Laundry', 'Living room'],
  ['Living room', 'Dining room', 'Terrace'],
  ['Guest suite', 'Home office'],
  ['Kitchen', 'Bar', 'Entry'],
];
const SCOPE_BY_ROOM = {
  Kitchen: ['Custom cabinetry', 'Quartz countertops & backsplash', 'Appliance package', 'Under-cabinet lighting'],
  'Living / dining': ['Large-format porcelain floors', 'Built-in media wall', 'Lighting plan'],
  'Powder room': ['Floating vanity', 'Wallpaper', 'Statement mirror'],
  'Primary bathroom': ['Walk-in shower, frameless glass', 'Double vanity', 'Heated floors'],
  'Primary closet': ['Custom closet system', 'Island with drawers', 'LED strip lighting'],
  'Primary bedroom': ['Upholstered headboard wall', 'Drapery & sheers', 'Furniture package'],
  'Guest bathroom': ['Tub-to-shower conversion', 'New vanity & fixtures'],
  Laundry: ['Cabinets & folding counter', 'Utility sink'],
  'Living room': ['Furniture & rug package', 'Art curation', 'Window treatments'],
  'Dining room': ['Dining table & chairs', 'Chandelier'],
  Terrace: ['Outdoor furniture', 'Planters & lighting'],
  'Guest suite': ['Furniture package', 'Accent wall', 'Bedding & styling'],
  'Home office': ['Built-in desk & shelving', 'Acoustic panels'],
  Bar: ['Wine fridge & bar cabinetry', 'Pendant lights'],
  Entry: ['Console & mirror', 'Flooring transition'],
};
const PHASES = ['discovery', 'design', 'approvals', 'procurement', 'construction', 'install', 'punchlist'];
const SELECTION_ITEMS = [
  // [category, item, unit, minUnitCost, maxUnitCost, maxQty]
  ['Countertops', 'Calacatta quartz slab', 'slab', 2400, 4800, 3], ['Tile', 'Zellige backsplash tile', 'sq ft', 18, 38, 120], ['Plumbing', 'Brushed brass faucet', 'ea', 420, 1100, 3],
  ['Lighting', 'Linear pendant 48"', 'ea', 650, 2400, 3], ['Cabinetry', 'Walnut vanity 72"', 'ea', 3800, 7900, 1], ['Flooring', 'Porcelain plank 8x48', 'sq ft', 6, 14, 900],
  ['Hardware', 'Knurled pulls 6"', 'ea', 28, 64, 40], ['Furniture', 'Performance-linen sofa', 'ea', 3200, 8600, 1], ['Textiles', 'Custom drapery panels', 'pair', 480, 1400, 6],
  ['Appliances', 'Panel-ready refrigerator', 'ea', 7800, 12500, 1], ['Glass', 'Frameless shower glass', 'ea', 1900, 3600, 1], ['Decor', 'Wool rug 9x12', 'ea', 1400, 5200, 2],
];
const SELECTION_STATUS = [['proposed', 3], ['approved', 3], ['ordered', 3], ['delivered', 2], ['installed', 2]];
const BUDGET_SPLIT = { design: 0.12, labor: 0.28, materials: 0.26, furniture: 0.16, subcontractors: 0.12, permits: 0.03, freight: 0.03 };
const DOC_TYPES = [
  ['plans', 'Floor plan — {name}.pdf'], ['plans', 'Electrical plan.pdf'], ['renders', 'Render — {room}.jpg'], ['renders', 'Mood board v2.pdf'],
  ['contracts', 'Design agreement — signed.pdf'], ['contracts', 'Change order #1.pdf'], ['permits', 'Condo alteration agreement.pdf'],
  ['permits', 'City permit application.pdf'], ['permits', 'Contractor COI.pdf'],
];
const NOTE_TEXTS = [
  'Client prefers warm whites — avoid anything with gray undertones.',
  'Building only allows deliveries Mon–Fri 9 AM–4 PM. Reserve the service elevator 48h ahead.',
  'Discussed adding a wine fridge to the island; pricing to follow in change order.',
  'HOA requested soundproofing underlayment for all hard flooring.',
  'Countertop template moved to Tuesday because cabinets were delayed.',
];

const r = createRandom(4242);

export const projectDetails = Object.fromEntries(projects.map((p, i) => {
  const start = new Date(p.startDate);
  const end = new Date(p.endDate);
  const span = Math.max(differenceInCalendarDays(end, start), 30);

  /* Rooms & scope */
  const rooms = ROOM_SETS[i % ROOM_SETS.length].map((name, k) => ({
    id: `rm_${p.id}_${k}`,
    name,
    areaSqft: r.int(40, 420),
    scope: SCOPE_BY_ROOM[name] || ['Design & styling'],
    status: p.progress >= 1 ? 'done' : r.weighted([['design', 2], ['inProgress', 3], ['done', 1]]),
  }));

  /* Phases → simple Gantt. Progress per phase follows overall project progress. */
  const weights = [0.06, 0.16, 0.12, 0.14, 0.32, 0.12, 0.08];
  let cursor = 0;
  const phases = PHASES.map((key, k) => {
    const len = Math.round(span * weights[k]);
    const s = addDays(start, cursor - (k > 0 ? Math.round(len * 0.15) : 0));
    const e = addDays(s, Math.max(len, 5));
    cursor += len;
    const done = Math.min(Math.max((p.progress - weights.slice(0, k).reduce((a, b) => a + b, 0)) / weights[k], 0), 1);
    return { id: `ph_${p.id}_${k}`, key, start: iso(s), end: iso(e), progress: Math.round(done * 100) / 100 };
  });

  /* Selections & materials */
  const selections = Array.from({ length: r.int(5, 9) }, (_, k) => {
    const [category, item, unit, lo, hi, maxQty] = SELECTION_ITEMS[(i * 3 + k) % SELECTION_ITEMS.length];
    const qty = r.int(Math.max(1, Math.round(maxQty / 3)), maxQty);
    const unitCost = r.int(lo, hi) + (unit === 'sq ft' ? r.int(0, 99) / 100 : 0);
    return {
      id: `sel_${p.id}_${k}`,
      roomId: rooms[k % rooms.length].id,
      category, item, unit, qty, unitCost,
      vendorId: r.pick(partners).id,
      status: p.progress >= 1 ? 'installed' : r.weighted(SELECTION_STATUS),
      leadTimeWeeks: r.int(1, 10),
    };
  });

  /* Budget lines by category; actuals derived from the project's spent amount */
  const budgetLines = Object.entries(BUDGET_SPLIT).map(([category, share]) => {
    const budget = Math.round(p.budget * share);
    const variance = r.int(-18, 22) / 100;
    const actual = Math.round(p.spent * share * (1 + variance) * 100) / 100;
    return { category, budget, actual };
  });

  /* Documents */
  const documents = DOC_TYPES.slice(0, r.int(5, DOC_TYPES.length)).map(([type, pattern], k) => ({
    id: `doc_${p.id}_${k}`,
    type,
    name: pattern.replace('{name}', p.name).replace('{room}', rooms[0].name),
    size: `${r.int(180, 9800)} KB`,
    uploadedAt: iso(addDays(start, r.int(0, Math.max(5, span / 2)))),
    uploadedBy: r.pick(users).id,
    status: type === 'permits' ? r.weighted([['approved', 3], ['pending', 2], ['submitted', 2]]) : type === 'contracts' ? 'signed' : null,
  }));

  /* Photos: placeholder tiles (hue + room label), tagged before / progress / after */
  const photos = Array.from({ length: r.int(6, 12) }, (_, k) => ({
    id: `ph_img_${p.id}_${k}`,
    kind: k < 3 ? 'before' : p.progress >= 1 && k > 6 ? 'after' : 'progress',
    roomId: rooms[k % rooms.length].id,
    caption: `${rooms[k % rooms.length].name} — ${k < 3 ? 'existing' : 'week ' + (k - 1)}`,
    takenAt: iso(addDays(start, k < 3 ? 0 : k * 6)),
    tone: (i * 37 + k * 23) % 360,
  }));

  /* Notes */
  const notes = Array.from({ length: r.int(2, 4) }, (_, k) => ({
    id: `nt_${p.id}_${k}`,
    body: NOTE_TEXTS[(i + k) % NOTE_TEXTS.length],
    authorId: r.pick(users).id,
    createdAt: iso(addDays(start, k * 9 + 2)),
  }));

  return [p.id, { rooms, phases, selections, budgetLines, documents, photos, notes }];
}));

/** Expenses that belong to a project (already in core). */
export const projectExpenses = (projectId) => expenses.filter((e) => e.projectId === projectId);
