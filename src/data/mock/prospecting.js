// Prospecting mock: B2B prospect lists, cold-outreach campaigns and sequences. All fictional.
import { addDays, startOfDay, subDays } from 'date-fns';
import { createRandom } from '../../lib/random.js';
import { NEIGHBORHOODS } from './people.js';
import { users } from './users.js';

const r = createRandom(909);
const TODAY = startOfDay(new Date());
const iso = (d) => d.toISOString();

export const PROSPECT_SEGMENTS = ['architect', 'propertyManager', 'hoaBoard', 'builder', 'developer', 'brokerage', 'agent'];
export const PROSPECT_STATUSES = ['new', 'contacted', 'replied', 'meeting', 'converted', 'notInterested'];

const COMPANIES = {
  architect: ['Lumen Arquitectura', 'Vela Studio', 'Coral Line Architects', 'Northshore Design Office', 'Arco & Linde'],
  propertyManager: ['Bayfront Property Group', 'Harborview Management', 'Palm Key Residential', 'Atrium Living Mgmt'],
  hoaBoard: ['Grove Towers HOA', 'Biscayne Point Condo Assoc.', 'Crandon Bay Residences Board', 'Isla Verde Condominium'],
  builder: ['Solera Builders', 'Mangrove Construction', 'Tidewater Homes', 'Anchor Build Co.'],
  developer: ['Meridian Developments', 'Brickline Partners', 'Oceanica Development'],
  brokerage: ['Gables Luxury Realty', 'Blue Harbor Brokers', 'Sunset Key Properties'],
  agent: ['Independent agent', 'Independent agent', 'Independent agent'],
};
const FIRST = ['Adrian', 'Bianca', 'Carlos', 'Diana', 'Esteban', 'Fiona', 'Gonzalo', 'Helena', 'Ivan', 'Julia', 'Kevin', 'Laura', 'Manuel', 'Nora', 'Oscar', 'Patricia', 'Ricardo', 'Silvia'];
const LAST = ['Acosta', 'Barrios', 'Crespo', 'Dominguez', 'Estrada', 'Ferrer', 'Gallardo', 'Herrera', 'Ibarra', 'Jurado', 'Lara', 'Medina', 'Nieves', 'Ortega', 'Prado', 'Rivas'];
const ROLES = { architect: 'Principal', propertyManager: 'Portfolio Manager', hoaBoard: 'Board President', builder: 'Project Director', developer: 'Development Manager', brokerage: 'Managing Broker', agent: 'Realtor' };

export const prospectLists = [
  { id: 'pl_1', name: 'Coconut Grove condo boards', segment: 'hoaBoard', description: 'HOA / condo boards in Grove high-rises with renovation activity.' },
  { id: 'pl_2', name: 'Residential architects — Miami-Dade', segment: 'architect', description: 'Small residential practices that subcontract interiors.' },
  { id: 'pl_3', name: 'Property managers — Brickell & Edgewater', segment: 'propertyManager', description: 'Managers of rental portfolios needing turnover refreshes.' },
  { id: 'pl_4', name: 'Luxury listing agents', segment: 'agent', description: 'Agents with $2M+ listings — home staging opportunities.' },
  { id: 'pl_5', name: 'Builders & developers', segment: 'builder', description: 'Model-unit design and finish packages.' },
];

export const sequences = [
  { id: 'sq_1', name: 'Condo board intro (3 steps)', channel: 'email', steps: [
    { day: 0, channel: 'email', subject: 'Renovation guidance for your residents' },
    { day: 4, channel: 'email', subject: 'Condo compliance checklist (free)' },
    { day: 9, channel: 'whatsapp', subject: 'Quick follow-up' },
  ] },
  { id: 'sq_2', name: 'Architect partnership', channel: 'email', steps: [
    { day: 0, channel: 'email', subject: 'Interiors partner for your residential projects' },
    { day: 6, channel: 'email', subject: 'Recent Coconut Grove project (photos)' },
  ] },
  { id: 'sq_3', name: 'Listing agent — staging offer', channel: 'whatsapp', steps: [
    { day: 0, channel: 'whatsapp', subject: 'Staging that sells faster' },
    { day: 3, channel: 'email', subject: 'Before / after portfolio' },
    { day: 7, channel: 'whatsapp', subject: 'Availability this month' },
  ] },
];

let n = 0;
export const prospects = prospectLists.flatMap((list) => Array.from({ length: r.int(6, 9) }, () => {
  n += 1;
  const segment = list.segment === 'builder' && n % 3 === 0 ? 'developer' : list.segment;
  const first = FIRST[(n * 5) % FIRST.length];
  const last = LAST[(n * 7 + 2) % LAST.length];
  const status = r.weighted([['new', 5], ['contacted', 6], ['replied', 3], ['meeting', 2], ['converted', 1], ['notInterested', 2]]);
  const touched = status !== 'new';
  return {
    id: `pr_${n}`,
    listId: list.id,
    segment,
    company: r.pick(COMPANIES[segment]),
    name: `${first} ${last}`,
    role: ROLES[segment],
    email: `${first}.${last}`.toLowerCase() + '@example.org',
    phone: `(786) 555-01${String(10 + n).padStart(2, '0')}`,
    neighborhood: r.pick(NEIGHBORHOODS),
    status,
    score: r.int(30, 95),
    sequenceId: touched ? r.pick(sequences).id : null,
    step: touched ? r.int(1, 3) : 0,
    lastTouchAt: touched ? iso(subDays(TODAY, r.int(0, 20))) : null,
    nextTouchAt: ['contacted', 'replied'].includes(status) ? iso(addDays(TODAY, r.int(0, 6))) : null,
    ownerId: r.pick(users).id,
  };
}));

export const campaigns = [
  { id: 'cp_1', name: 'Q4 condo boards — Coconut Grove', listId: 'pl_1', sequenceId: 'sq_1', status: 'active', startedAt: iso(subDays(TODAY, 24)) },
  { id: 'cp_2', name: 'Architect partners — fall', listId: 'pl_2', sequenceId: 'sq_2', status: 'active', startedAt: iso(subDays(TODAY, 15)) },
  { id: 'cp_3', name: 'Staging for luxury listings', listId: 'pl_4', sequenceId: 'sq_3', status: 'paused', startedAt: iso(subDays(TODAY, 40)) },
  { id: 'cp_4', name: 'PM turnover refresh', listId: 'pl_3', sequenceId: 'sq_1', status: 'draft', startedAt: null },
];
