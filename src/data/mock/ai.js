/*
 * AI module mock: run history, lead-finder results, ad campaigns, connected platforms.
 * Analyses that can be derived from CRM data (sentiment, patterns, email mining) are computed in
 * services/aiService.js from the other mock tables, so they stay coherent with the rest of the demo.
 * Nothing here calls an AI model or an external API.
 */
import { addDays, subDays, subHours } from 'date-fns';
import { createRandom } from '../../lib/random.js';
import { NEIGHBORHOODS } from '../constants.js';

const r = createRandom(31337);
const now = new Date();
const iso = (d) => d.toISOString();

export const AI_MODULES = ['communications', 'prospecting', 'leadFinder', 'patterns', 'emailMining', 'campaigns'];

export const aiRuns = AI_MODULES.flatMap((module) => Array.from({ length: r.int(3, 6) }, (_, k) => {
  const started = subHours(now, k * r.int(20, 50) + r.int(1, 8));
  return {
    id: `run_${module}_${k}`,
    module,
    trigger: k % 3 === 0 ? 'manual' : 'scheduled',
    status: k === 2 && module === 'leadFinder' ? 'failed' : 'completed',
    startedAt: iso(started),
    durationSec: r.int(18, 240),
    items: r.int(4, 40),
    note: k === 2 && module === 'leadFinder' ? 'platformNotConnected' : null,
  };
})).sort((a, b) => b.startedAt.localeCompare(a.startedAt));

export const platforms = [
  { id: 'google', name: 'Google Maps & Search', connected: true },
  { id: 'instagram', name: 'Instagram', connected: true },
  { id: 'houzz', name: 'Houzz', connected: false },
  { id: 'facebook', name: 'Facebook groups & Marketplace', connected: false },
  { id: 'linkedin', name: 'LinkedIn', connected: false },
  { id: 'directories', name: 'Business directories', connected: true },
  { id: 'realestate', name: 'Real estate listings', connected: true },
];

export const leadFinderConfig = {
  zones: ['Coconut Grove', 'Brickell', 'Coral Gables', 'Key Biscayne'],
  projectTypes: ['kitchen', 'bath', 'remodel', 'staging'],
  budgetMin: 40000,
  budgetMax: 400000,
  keywords: 'condo renovation, kitchen remodel, interior designer Miami, home staging',
  platforms: ['google', 'instagram', 'directories', 'realestate'],
  schedule: 'weekly',
};

const SIGNALS = [
  ['instagram', 'Posted “finally closing on our Grove condo — need a designer!” with 2 kitchen inspiration saves', 'Homeowner'],
  ['realestate', 'Bought a 3BR condo (built 1998) 3 weeks ago; listing photos show original kitchen', 'New owner'],
  ['google', 'Left a 4★ review on a competitor asking about “turnkey kitchen + bath”', 'Homeowner'],
  ['directories', 'New property management company registered in Brickell (42 units)', 'Property manager'],
  ['realestate', 'Luxury listing ($2.4M) on market 60+ days, staging not used', 'Listing agent'],
  ['instagram', 'Architect studio posted a residential project looking for interiors partner', 'Architect'],
  ['google', 'Condo board meeting minutes mention lobby & corridor refresh RFP', 'HOA board'],
  ['realestate', 'Pre-construction unit handover in Edgewater (owner-buyers, 2026 delivery)', 'New owner'],
  ['directories', 'General contractor without in-house design team, 8 open permits in Coral Gables', 'Contractor'],
  ['instagram', 'Host of short-term rental asked followers for “a designer who does staging”', 'STR host'],
];
const FIRST = ['Alexa', 'Bruno', 'Clara', 'Dario', 'Emma', 'Franco', 'Gisela', 'Hugo', 'Irene', 'Jorge', 'Karina', 'Leo'];
const LAST = ['Mendez', 'Park', 'Rojas', 'Silva', 'Tan', 'Vidal', 'Walsh', 'Ybarra'];

export const leadFinderResults = SIGNALS.map(([source, signal, persona], k) => ({
  id: `lf_${k + 1}`,
  name: `${FIRST[(k * 5) % FIRST.length]} ${LAST[(k * 3) % LAST.length]}`,
  persona,
  source,
  signal,
  neighborhood: NEIGHBORHOODS[(k * 3) % NEIGHBORHOODS.length],
  estBudget: r.round(r.int(35, 380) * 1000, 5000),
  score: r.int(52, 96),
  foundAt: iso(subHours(now, r.int(2, 160))),
  status: 'new', // new | added | dismissed
})).sort((a, b) => b.score - a.score);

export const adAccounts = [
  { id: 'meta', name: 'Meta Ads', connected: true, account: 'Greatstone Design (demo)' },
  { id: 'google', name: 'Google Ads', connected: false, account: null },
];

export const adCampaigns = [
  { id: 'ad_1', platform: 'meta', name: 'Kitchen remodel — Coconut Grove & Brickell', status: 'active', objective: 'leads', spend: 2860.4, impressions: 184200, clicks: 3120, leads: 41, won: 3, revenue: 186000 },
  { id: 'ad_2', platform: 'meta', name: 'Before/after reels — retargeting', status: 'active', objective: 'leads', spend: 940.15, impressions: 96400, clicks: 1810, leads: 17, won: 1, revenue: 42000 },
  { id: 'ad_3', platform: 'meta', name: 'Home staging for listing agents', status: 'paused', objective: 'leads', spend: 610, impressions: 41200, clicks: 520, leads: 6, won: 0, revenue: 0 },
  { id: 'ad_4', platform: 'google', name: 'Search — “interior designer Miami”', status: 'draft', objective: 'leads', spend: 0, impressions: 0, clicks: 0, leads: 0, won: 0, revenue: 0 },
];

export const audienceSuggestions = [
  { id: 'aud_1', key: 'lookalikeWon', size: '120K–160K', basis: 18 },
  { id: 'aud_2', key: 'newCondoOwners', size: '35K–50K', basis: 9 },
  { id: 'aud_3', key: 'reengageCold', size: '1.2K', basis: 64 },
  { id: 'aud_4', key: 'agentsLuxury', size: '8K–12K', basis: 6 },
];

export const nextScheduled = { leadFinder: iso(addDays(now, 3)), communications: iso(addDays(now, 1)), emailMining: iso(addDays(now, 6)), prospecting: iso(subDays(addDays(now, 7), 0)) };
