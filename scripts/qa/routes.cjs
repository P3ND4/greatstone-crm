// Routes checked by the QA scripts. Add every new page (list, detail, form, tab via ?tab=) here.
module.exports = [
  '/', '/login', '/forgot-password', '/nope',
  '/crm/communications/whatsapp', '/crm/communications/whatsapp?c=cv_1', '/crm/communications/sms', '/crm/communications/sms?c=cv_35', '/crm/communications/sms/cv_31', '/crm/communications/email', '/crm/communications/email/compose',
  '/crm/agenda', '/crm/agenda?view=week', '/crm/contacts', '/crm/contacts/c_1', '/crm/leads', '/crm/leads?view=cards', '/crm/leads/l_3', '/crm/leads/new',
  '/crm/prospecting', '/crm/pipeline',
  '/projects', '/projects?view=cards', '/projects/p_2', '/projects/p_2?tab=budget', '/projects/new',
  '/finance/estimates', '/finance/estimates/new', '/finance/invoices', '/finance/invoices/inv_1043', '/finance/expenses', '/finance/reports',
  '/ai', '/ai/communications', '/ai/lead-finder?view=config', '/ai/patterns', '/ai/campaigns', '/ai/assistant',
  '/settings/profile', '/settings/organization', '/settings/users', '/settings/channels', '/settings/templates', '/settings/catalog',
  '/settings/billing', '/settings/integrations', '/settings/ai', '/settings/notifications',
];
