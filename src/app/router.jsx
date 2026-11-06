import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import DashboardPage from '../pages/dashboard/DashboardPage.jsx';
import LeadFormPage from '../pages/crm/leads/LeadFormPage.jsx';
import LeadsPage from '../pages/crm/leads/LeadsPage.jsx';
import LeadDetailPage from '../pages/crm/leads/LeadDetailPage.jsx';
import ModulePlaceholder from '../pages/system/ModulePlaceholder.jsx';
import NotFoundPage from '../pages/system/NotFoundPage.jsx';

const ph = (section, titleKey, action) => <ModulePlaceholder section={section} titleKey={titleKey} action={action} />;

/** Route map — see STRUCTURE.md. Placeholder routes are replaced module by module. */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },

      { path: 'crm', element: <Navigate to="/crm/communications" replace /> },
      { path: 'crm/communications', element: <Navigate to="/crm/communications/whatsapp" replace /> },
      { path: 'crm/communications/whatsapp', element: ph('crm', 'nav.communications') },
      { path: 'crm/communications/email', element: ph('crm', 'nav.communications') },
      { path: 'crm/agenda', element: ph('crm', 'nav.agenda') },
      { path: 'crm/contacts', element: ph('crm', 'nav.contacts') },
      { path: 'crm/contacts/:id', element: ph('crm', 'nav.contacts') },
      { path: 'crm/leads', element: <LeadsPage /> },
      { path: 'crm/leads/new', element: <LeadFormPage /> },
      { path: 'crm/leads/:id', element: <LeadDetailPage /> },
      { path: 'crm/leads/:id/edit', element: <LeadFormPage /> },
      { path: 'crm/prospecting', element: ph('crm', 'nav.prospecting') },
      { path: 'crm/pipeline', element: ph('crm', 'nav.pipeline') },

      { path: 'projects', element: ph(null, 'nav.projects') },
      { path: 'projects/:id', element: ph(null, 'nav.projects') },

      { path: 'finance', element: <Navigate to="/finance/estimates" replace /> },
      { path: 'finance/estimates', element: ph('finance', 'nav.estimates') },
      { path: 'finance/invoices', element: ph('finance', 'nav.invoices') },
      { path: 'finance/invoices/:id', element: ph('finance', 'nav.invoices') },
      { path: 'finance/expenses', element: ph('finance', 'nav.expenses') },
      { path: 'finance/reports', element: ph('finance', 'nav.reports') },

      { path: 'ai', element: ph(null, 'nav.ai') },
      { path: 'settings', element: ph(null, 'nav.settings') },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
