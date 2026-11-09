import { useParams } from 'react-router-dom';
import { PageShell } from '../../../components/shells/index.js';
import { useT } from '../../../i18n/index.jsx';
import { EmailThread } from './EmailPage.jsx';
import { ThreadView } from './MessagingPage.jsx';

/** Expanded conversation (page with Back) — same thread components as the inbox panes. */
export default function ConversationPage() {
  const t = useT();
  const { channel, id } = useParams();
  const parent = `/crm/communications/${channel}`;
  return (
    <PageShell fallback={`${parent}?c=${id}`} breadcrumbs={[{ label: t('nav.communications'), to: parent }, { label: t(`channels.${channel}`), to: parent }, { label: t('comms.conversation') }]}>
      <div className={channel === 'email' ? 'comms comms--page comms--mail-page' : 'comms comms--page has-active has-panel'}>
        {channel === 'email' ? <EmailThread id={id} expanded /> : <ThreadView id={id} channel={channel} expanded showPanel />}
      </div>
    </PageShell>
  );
}
