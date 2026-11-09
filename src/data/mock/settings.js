/*
 * Settings mock: organization profile, role permissions, invitations, channels, message templates,
 * notification rules and AI preferences. Everything is fictional and lives in memory
 * (a page reload resets it). Read/written only through services/settingsService.js.
 */
import { subDays, subHours } from 'date-fns';

const now = new Date();
const iso = (d) => d.toISOString();

export const organization = {
  name: 'Greatstone Design',
  legalName: 'Greatstone Design LLC',
  tagline: 'Interior Design & Remodel',
  email: 'studio@example.com',
  phone: '(305) 555-0100',
  website: 'greatstonedesign.example',
  address: '2550 S Bayshore Dr, Suite 210',
  city: 'Miami',
  state: 'FL',
  zip: '33133',
  license: 'CGC-0000000 (demo)',
  timezone: 'America/New_York',
  currency: 'USD',
  dateFormat: 'MM/dd/yyyy',
  weekStart: 'sunday',
  defaultLanguage: 'en',
  accent: '#847539',
  logo: null, // data URL when the user uploads one (stays in the browser tab)
};

/** Access levels per module and role. 'none' blocks the module (no-access state). Admin is always full. */
export const ROLES = ['admin', 'designer', 'accounting', 'viewer'];
export const PERMISSION_MODULES = ['dashboard', 'crm', 'projects', 'finance', 'ai', 'settings'];
export const permissions = {
  dashboard: { admin: 'full', designer: 'full', accounting: 'full', viewer: 'view' },
  crm: { admin: 'full', designer: 'full', accounting: 'view', viewer: 'view' },
  projects: { admin: 'full', designer: 'full', accounting: 'view', viewer: 'view' },
  finance: { admin: 'full', designer: 'view', accounting: 'full', viewer: 'none' },
  ai: { admin: 'full', designer: 'full', accounting: 'view', viewer: 'none' },
  settings: { admin: 'full', designer: 'view', accounting: 'view', viewer: 'none' },
};

export const invites = [
  { id: 'inv_u1', email: 'carla.ruiz@example.com', role: 'designer', sentAt: iso(subDays(now, 2)), invitedBy: 'u_1' },
];

export const channels = {
  whatsapp: {
    connected: true,
    displayName: 'Greatstone Design',
    number: '+1 (305) 555-0100',
    verified: true,
    businessHours: true,
    hoursFrom: '09:00',
    hoursTo: '18:00',
    awayMessage: 'Thanks for reaching out to Greatstone Design! Our studio hours are Mon–Fri 9 AM – 6 PM. We’ll reply first thing tomorrow.',
  },
  sms: {
    connected: true,
    provider: 'twilio', // twilio | telnyx | vonage | bandwidth — simulated, no credentials in the browser
    number: '+1 (305) 555-0142',
    numberType: '10dlc', // 10dlc (local number) | tollfree
    registration: { brand: 'approved', campaign: 'approved', useCase: 'Customer care + account notifications' },
    senderPrefix: 'Greatstone Design:',
    complianceFooter: true,
    footerText: 'Reply STOP to opt out.',
    stopReply: 'Greatstone Design: You’re unsubscribed and won’t receive more messages. Reply START to resubscribe.',
    helpReply: 'Greatstone Design: Help at (305) 555-0100 or studio@example.com. Msg & data rates may apply. Reply STOP to opt out.',
    startReply: 'Greatstone Design: You’re subscribed again. Reply STOP to opt out at any time.',
    quietHours: true,
    quietFrom: '21:00', // no texts from 9 PM…
    quietTo: '08:00', // …until 8 AM, in the recipient's time zone (TCPA guidance)
    mms: true,
  },
  email: {
    connected: true,
    provider: 'google',
    address: 'studio@example.com',
    fromName: 'Greatstone Design',
    trackOpens: true,
    signature: '—\nTessa Monroe · Greatstone Design\n(305) 555-0100 · Miami, FL',
  },
  calendar: {
    connected: true,
    provider: 'google',
    account: 'studio@example.com',
    syncAppointments: true,
    defaultDuration: 60,
    bufferMinutes: 30,
  },
};

/** Message templates. WhatsApp templates must be approved by Meta before they can be sent (simulated). */
export const templates = {
  whatsapp: [
    { id: 'wt_1', name: 'Visit confirmation', status: 'approved', body: 'Hi {first}! Confirming our visit on {date}. Please let the front desk know we’re coming 😊' },
    { id: 'wt_2', name: 'Follow-up estimate', status: 'approved', body: 'Hi {first}, just checking in on the estimate — happy to walk you through it whenever works for you.' },
    { id: 'wt_3', name: 'Install reminder', status: 'approved', body: 'Reminder: the crew arrives tomorrow at 9 AM. Please reserve one parking spot for the truck.' },
    { id: 'wt_4', name: 'Selections ready', status: 'pending', body: 'Hi {first}! Your finish selections are ready to review in your project portal. Let us know your favorites by {date}.' },
  ],
  sms: [
    { id: 'st_1', name: 'Visit reminder', body: 'Hi {first}, reminder: we’ll see you {date}. Reply C to confirm or R to reschedule.' },
    { id: 'st_2', name: 'On our way', body: 'Hi {first}, the Greatstone crew is on the way and will arrive in about 20 minutes.' },
    { id: 'st_3', name: 'Invoice due', body: 'Hi {first}, invoice {number} is due {date}. Reply here with any questions. Thank you!' },
    { id: 'st_4', name: 'Review request', body: 'Hi {first}, it was a pleasure working on {project}! Would you share a quick review? It helps us a lot.' },
  ],
  email: [
    { id: 'et_1', name: 'Estimate sent', subject: 'Your estimate from Greatstone Design', body: 'Hi {first},\n\nAttached is the estimate we discussed. Let me know if you have any questions — I’m happy to review it together.\n\nWarmly,' },
    { id: 'et_2', name: 'Welcome / next steps', subject: 'Welcome to Greatstone Design', body: 'Hi {first},\n\nThank you for trusting us with your home. Here are the next steps for your project:\n\n1. Site measure\n2. Concept & mood board\n3. Estimate & schedule\n\nWarmly,' },
    { id: 'et_3', name: 'Invoice reminder', subject: 'Friendly reminder — invoice {number}', body: 'Hi {first},\n\nA quick reminder that invoice {number} is due on {date}. You can reply to this email with any questions.\n\nThank you,' },
  ],
};

export const NOTIFICATION_EVENTS = ['newLead', 'newMessage', 'appointment', 'estimateAccepted', 'invoicePaid', 'invoiceOverdue', 'taskDue', 'expenseApproval', 'aiInsight'];
export const NOTIFICATION_CHANNELS = ['inApp', 'email', 'push'];
export const notifications = {
  rules: {
    newLead: { inApp: true, email: true, push: true },
    newMessage: { inApp: true, email: false, push: true },
    appointment: { inApp: true, email: true, push: true },
    estimateAccepted: { inApp: true, email: true, push: true },
    invoicePaid: { inApp: true, email: true, push: false },
    invoiceOverdue: { inApp: true, email: true, push: false },
    taskDue: { inApp: true, email: false, push: true },
    expenseApproval: { inApp: true, email: true, push: false },
    aiInsight: { inApp: true, email: false, push: false },
  },
  digest: 'daily',
  quietHours: true,
  quietFrom: '21:00',
  quietTo: '07:30',
};

export const aiPreferences = {
  assistantEnabled: true,
  tone: 'warm',
  replyLanguage: 'auto',
  humanReview: true,
  dataAccess: { communications: true, projects: true, finance: false, contacts: true },
  schedule: 'weekly',
  monthlyCredits: 5000,
  usedCredits: 1240,
  usageResetAt: iso(subHours(now, 24 * 9)),
};

export const futureIntegrations = [
  { id: 'supabase', name: 'Supabase', kind: 'backend' },
  { id: 'quickbooks', name: 'QuickBooks Online', kind: 'accounting' },
  { id: 'stripe', name: 'Stripe', kind: 'payments' },
  { id: 'docusign', name: 'DocuSign', kind: 'signature' },
];
