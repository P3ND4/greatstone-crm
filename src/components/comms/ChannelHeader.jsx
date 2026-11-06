import { NavLink } from 'react-router-dom';
import { Mail, MessageCircle } from 'lucide-react';
import { useT } from '../../i18n/index.jsx';
import { SubNav } from '../../pages/system/ModulePlaceholder.jsx';

/** Shared header for both channels: title + WhatsApp / Email switch (sub-routes). */
export default function ChannelHeader({ actions, unread = {} }) {
  const t = useT();
  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-head__eyebrow">{t('nav.crm')}</p>
          <h1 className="page-title">{t('nav.communications')}</h1>
        </div>
        <div className="page-head__actions">
          <nav className="channel-switch" aria-label={t('comms.channels')}>
            <NavLink to="/crm/communications/whatsapp"><MessageCircle aria-hidden="true" />{t('channels.whatsapp')}{unread.whatsapp > 0 && <span className="nav__badge">{unread.whatsapp}</span>}</NavLink>
            <NavLink to="/crm/communications/email"><Mail aria-hidden="true" />{t('channels.email')}{unread.email > 0 && <span className="nav__badge">{unread.email}</span>}</NavLink>
          </nav>
          {actions}
        </div>
      </div>
      <SubNav section="crm" />
    </>
  );
}
