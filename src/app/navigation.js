// Single source for primary navigation (sidebar, command palette, breadcrumbs).
import {
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
  { id: 'ai', labelKey: 'nav.ai', to: '/ai', icon: Sparkles },
];

export const NAV_FOOTER = [
  { id: 'settings', labelKey: 'nav.settings', to: '/settings', icon: Settings },
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
