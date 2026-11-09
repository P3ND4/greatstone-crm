import ChannelBadge from '../../../components/comms/ChannelBadge.jsx';
import { Link } from 'react-router-dom';
import { Mail, MessageCircle } from 'lucide-react';
import { Badge, Card, EmptyState } from '../../../components/ui/index.js';
import { useT } from '../../../i18n/index.jsx';
import { ago } from '../../../lib/format.js';
import { lookupService } from '../../../services/index.js';

export default function CommsTab({ d }) {
  const t = useT();
  return (
    <Card flush title={t('nav.communications')}>
      {d.conversations.length ? (
        <ul className="list">
          {d.conversations.map((cv) => (
            <li key={cv.id}>
              <Link className="list-item" to={`/crm/communications/${cv.channel}?c=${cv.id}`}>
                <ChannelBadge channel={cv.channel} />
                <div className="list-item__main">
                  <p className="list-item__title">{cv.subject || lookupService.contact(cv.contactId)?.name}</p>
                  <p className="list-item__meta">{cv.lastMessage}</p>
                </div>
                {cv.unread > 0 && <span className="conv__badge">{cv.unread}</span>}
                <span className="list-item__aside">{ago(cv.lastMessageAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : <EmptyState icon={MessageCircle} title={t('projects.noComms')} />}
    </Card>
  );
}
