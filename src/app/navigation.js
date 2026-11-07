// Single source for primary navigation (sidebar, command palette, breadcrumbs).
import {
  BellRing, Blocks, BrainCircuit, Building, Cable, CircleUser, MessageSquareQuote, Package, Percent, ShieldCheck,
  Bot, ChartSpline, LayoutGrid, MailSearch, Megaphone, MessageSquareText, Radar,
  BarChart3, Building2, CalendarDays, Contact, FileText, LayoutDashboard, MessagesSquare,
  Receipt, Settings, ShoppingCart, Sparkles, SquareKanban, Target, UserPlus, Users, Wallet,
} from 'lucide-react';

export const NAV = [
  { id: 'dashboard', labelKey: 'nav.dashboard', to: '/', icon: LayoutDashboard, end: true },
  {
    id: 'crm', labelKey: 'nav.crm', to: '/crm', icon: Users,
    children: [
      { id: 'communications', labelKey: 'nav.communications', to: '/crm/communications', icon: MessagesSquare, badge: 'unread' },
      { id: 'agenda', labelKey: 'nav.agenda', to: '/crm/agenda', icon: CalendarDays },
      { id: 'contacts', labelKey: 'nav.contacts', to: '/crm/contacts', icon: Contact },
      { id: 'leads', labelKey: 'nav.leads', to: '/crm/leads', icon: UserPlus },
      { id: 'prospecting', labelKey: 'nav.prospecting', to: '/crm/prospecting', icon: Target },
      { id: 'pipeline', labelKey: 'nav.pipeline', to: '/crm/pipeline', icon: SquareKanban },
    ],
  },
  { id: 'projects', labelKey: 'nav.projects', to: '/projects', icon: Building2 },
  {
    id: 'finance', labelKey: 'nav.finance', to: '/finance', icon: Wallet,
    children: [
      { id: 'estimates', labelKey: 'nav.estimates', to: '/finance/estimates', icon: FileText },
      { id: 'invoices', labelKey: 'nav.invoices', to: '/finance/invoices', icon: Receipt },
      { id: 'expenses', labelKey: 'nav.expenses', to: '/finance/expenses', icon: ShoppingCart },
      { id: 'reports', labelKey: 'nav.reports', to: '/finance/reports', icon: BarChart3 },
    ],
  },
  {
    id: 'ai', labelKey: 'nav.ai', to: '/ai', icon: Sparkles,
    children: [
      { id: 'ai-hub', labelKey: 'ai.nav.hub', to: '/ai', icon: LayoutGrid, end: true },
      { id: 'ai-comms', labelKey: 'ai.nav.communications', to: '/ai/communications', icon: MessageSquareText },
      { id: 'ai-prospecting', labelKey: 'ai.nav.prospecting', to: '/ai/prospecting', icon: Target },
      { id: 'ai-finder', labelKey: 'ai.nav.leadFinder', to: '/ai/lead-finder', icon: Radar },
      { id: 'ai-patterns', labelKey: 'ai.nav.patterns', to: '/ai/patterns', icon: ChartSpline },
      { id: 'ai-mining', labelKey: 'ai.nav.emailMining', to: '/ai/email-mining', icon: MailSearch },
      { id: 'ai-campaigns', labelKey: 'ai.nav.campaigns', to: '/ai/campaigns', icon: Megaphone },
      { id: 'ai-assistant', labelKey: 'ai.nav.assistant', to: '/ai/assistant', icon: Bot },
    ],
  },
];

export const NAV_FOOTER = [
  {
    id: 'settings', labelKey: 'nav.settings', to: '/settings', icon: Settings,
    children: [
      { id: 'set-profile', labelKey: 'settings.nav.profile', to: '/settings/profile', icon: CircleUser },
      { id: 'set-organization', labelKey: 'settings.nav.organization', to: '/settings/organization', icon: Building },
      { id: 'set-users', labelKey: 'settings.nav.users', to: '/settings/users', icon: ShieldCheck },
      { id: 'set-channels', labelKey: 'settings.nav.channels', to: '/settings/channels', icon: Cable },
      { id: 'set-templates', labelKey: 'settings.nav.templates', to: '/settings/templates', icon: MessageSquareQuote },
      { id: 'set-catalog', labelKey: 'settings.nav.catalog', to: '/settings/catalog', icon: Package },
      { id: 'set-billing', labelKey: 'settings.nav.billing', to: '/settings/billing', icon: Percent },
      { id: 'set-integrations', labelKey: 'settings.nav.integrations', to: '/settings/integrations', icon: Blocks },
      { id: 'set-ai', labelKey: 'settings.nav.ai', to: '/settings/ai', icon: BrainCircuit },
      { id: 'set-notifications', labelKey: 'settings.nav.notifications', to: '/settings/notifications', icon: BellRing },
    ],
  },
];

/** Flat list of every navigable page (for the command palette). */
export function flatNav() {
  const out = [];
  [...NAV, ...NAV_FOOTER].forEach((item) => {
    out.push(item);
    item.children?.forEach((c) => out.push({ ...c, parentKey: item.labelKey }));
  });
  return out;
}
