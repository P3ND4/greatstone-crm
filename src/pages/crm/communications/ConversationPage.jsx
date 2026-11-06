import { useParams } from 'react-router-dom';
import { PageShell } from '../../../components/shells/index.js';
import { useT } from '../../../i18n/index.jsx';
import { EmailThread } from './EmailPage.jsx';
import { ThreadView } from './WhatsAppPage.jsx';

/** Expanded conversation (page with Back) — same thread components as the inbox panes. */
export default function ConversationPage() {
  const t = useT();
  const { channel, id } = useParams();
  const parent = `/crm/communications/${channel}`;
  return (
    <PageShell fallback={`${parent}?c=${id}`} breadcrumbs={[{ label: t('nav.communications'), to: parent }, { label: t(`channels.${channel}`), to: parent }, { label: t('comms.conversation') }]}>
      <div className={channel === 'whatsapp' ? 'comms comms--page has-active has-panel' : 'comms comms--page comms--mail-page'}>
        {channel === 'whatsapp' ? <ThreadView id={id} expanded showPanel /> : <EmailThread id={id} expanded />}
      </div>
    </PageShell>
  );
}
