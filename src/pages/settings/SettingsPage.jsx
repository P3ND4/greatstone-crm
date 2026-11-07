import { useParams } from 'react-router-dom';
import NotFoundPage from '../system/NotFoundPage.jsx';
import AiSettings from './AiSettings.jsx';
import BillingSettings from './BillingSettings.jsx';
import CatalogSettings from './CatalogSettings.jsx';
import ChannelsSettings from './ChannelsSettings.jsx';
import IntegrationsSettings from './IntegrationsSettings.jsx';
import NotificationsSettings from './NotificationsSettings.jsx';
import OrganizationSettings from './OrganizationSettings.jsx';
import ProfileSettings from './ProfileSettings.jsx';
import TemplatesSettings from './TemplatesSettings.jsx';
import UsersSettings from './UsersSettings.jsx';

export const SETTINGS_SECTIONS = {
  profile: ProfileSettings,
  organization: OrganizationSettings,
  users: UsersSettings,
  channels: ChannelsSettings,
  templates: TemplatesSettings,
  catalog: CatalogSettings,
  billing: BillingSettings,
  integrations: IntegrationsSettings,
  ai: AiSettings,
  notifications: NotificationsSettings,
};

/** /settings/:section — one page per section (topbar row 2 / sidebar list the sections). */
export default function SettingsPage() {
  const { section } = useParams();
  const Section = SETTINGS_SECTIONS[section];
  if (!Section) return <NotFoundPage />;
  return <div className="settings-page"><Section key={section} /></div>;
}
