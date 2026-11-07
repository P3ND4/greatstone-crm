import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import DashboardPage from '../pages/dashboard/DashboardPage.jsx';
import LeadFormPage from '../pages/crm/leads/LeadFormPage.jsx';
import LeadsPage from '../pages/crm/leads/LeadsPage.jsx';
import LeadDetailPage from '../pages/crm/leads/LeadDetailPage.jsx';
import ContactsPage from '../pages/crm/contacts/ContactsPage.jsx';
import ContactDetailPage from '../pages/crm/contacts/ContactDetailPage.jsx';
import PipelinePage from '../pages/crm/pipeline/PipelinePage.jsx';
import OpportunityPage from '../pages/crm/pipeline/OpportunityPage.jsx';
import AgendaPage from '../pages/crm/agenda/AgendaPage.jsx';
import AppointmentPage from '../pages/crm/agenda/AppointmentPage.jsx';
import WhatsAppPage from '../pages/crm/communications/WhatsAppPage.jsx';
import EmailPage from '../pages/crm/communications/EmailPage.jsx';
import ComposePage from '../pages/crm/communications/ComposePage.jsx';
import ConversationPage from '../pages/crm/communications/ConversationPage.jsx';
import ProspectingPage from '../pages/crm/prospecting/ProspectingPage.jsx';
import ProjectsPage from '../pages/projects/ProjectsPage.jsx';
import ProjectDetailPage from '../pages/projects/ProjectDetailPage.jsx';
import ProjectFormPage from '../pages/projects/ProjectFormPage.jsx';
import DocsListPage from '../pages/finance/DocsListPage.jsx';
import DocDetailPage from '../pages/finance/DocDetailPage.jsx';
import DocBuilderPage from '../pages/finance/DocBuilderPage.jsx';
import ExpensesPage from '../pages/finance/ExpensesPage.jsx';
import ReportsPage from '../pages/finance/ReportsPage.jsx';
import AiHubPage from '../pages/ai/AiHubPage.jsx';
import CommAnalysisPage from '../pages/ai/CommAnalysisPage.jsx';
import ProspectingAnalysisPage from '../pages/ai/ProspectingAnalysisPage.jsx';
import LeadFinderPage from '../pages/ai/LeadFinderPage.jsx';
import PatternsPage from '../pages/ai/PatternsPage.jsx';
import EmailMiningPage from '../pages/ai/EmailMiningPage.jsx';
import CampaignsPage from '../pages/ai/CampaignsPage.jsx';
import AssistantPage from '../pages/ai/AssistantPage.jsx';
import SettingsPage from '../pages/settings/SettingsPage.jsx';
import NotFoundPage from '../pages/system/NotFoundPage.jsx';

/** Route map — see STRUCTURE.md. */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },

      { path: 'crm', element: <Navigate to="/crm/communications" replace /> },
      { path: 'crm/communications', element: <Navigate to="/crm/communications/whatsapp" replace /> },
      { path: 'crm/communications/whatsapp', element: <WhatsAppPage /> },
      { path: 'crm/communications/email', element: <EmailPage /> },
      { path: 'crm/communications/email/compose', element: <ComposePage /> },
      { path: 'crm/communications/:channel/:id', element: <ConversationPage /> },
      { path: 'crm/agenda', element: <AgendaPage /> },
      { path: 'crm/agenda/:id', element: <AppointmentPage /> },
      { path: 'crm/contacts', element: <ContactsPage /> },
      { path: 'crm/contacts/:id', element: <ContactDetailPage /> },
      { path: 'crm/leads', element: <LeadsPage /> },
      { path: 'crm/leads/new', element: <LeadFormPage /> },
      { path: 'crm/leads/:id', element: <LeadDetailPage /> },
      { path: 'crm/leads/:id/edit', element: <LeadFormPage /> },
      { path: 'crm/prospecting', element: <ProspectingPage /> },
      { path: 'crm/pipeline', element: <PipelinePage /> },
      { path: 'crm/pipeline/:id', element: <OpportunityPage /> },

      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/new', element: <ProjectFormPage /> },
      { path: 'projects/:id', element: <ProjectDetailPage /> },
      { path: 'projects/:id/edit', element: <ProjectFormPage /> },

      { path: 'finance', element: <Navigate to="/finance/estimates" replace /> },
      { path: 'finance/estimates', element: <DocsListPage key="est" kind="estimate" /> },
      { path: 'finance/estimates/new', element: <DocBuilderPage key="est-new" kind="estimate" /> },
      { path: 'finance/estimates/:id', element: <DocDetailPage key="est-d" kind="estimate" /> },
      { path: 'finance/estimates/:id/edit', element: <DocBuilderPage key="est-e" kind="estimate" /> },
      { path: 'finance/invoices', element: <DocsListPage key="inv" kind="invoice" /> },
      { path: 'finance/invoices/new', element: <DocBuilderPage key="inv-new" kind="invoice" /> },
      { path: 'finance/invoices/:id', element: <DocDetailPage key="inv-d" kind="invoice" /> },
      { path: 'finance/invoices/:id/edit', element: <DocBuilderPage key="inv-e" kind="invoice" /> },
      { path: 'finance/expenses', element: <ExpensesPage /> },
      { path: 'finance/reports', element: <ReportsPage /> },

      { path: 'ai', element: <AiHubPage /> },
      { path: 'ai/communications', element: <CommAnalysisPage /> },
      { path: 'ai/prospecting', element: <ProspectingAnalysisPage /> },
      { path: 'ai/lead-finder', element: <LeadFinderPage /> },
      { path: 'ai/patterns', element: <PatternsPage /> },
      { path: 'ai/email-mining', element: <EmailMiningPage /> },
      { path: 'ai/campaigns', element: <CampaignsPage /> },
      { path: 'ai/assistant', element: <AssistantPage /> },
      { path: 'settings', element: <Navigate to="/settings/profile" replace /> },
      { path: 'settings/:section', element: <SettingsPage /> },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
