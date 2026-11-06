import { Link } from 'react-router-dom';
import { Avatar } from '../ui/index.js';
import { useT } from '../../i18n/index.jsx';
import cx from '../../lib/cx.js';
import { shortTime } from './util.js';

/** Left pane list for WhatsApp. Links keep other query params (filters) intact. */
export default function ConversationList({ items, activeId, buildHref }) {
  const t = useT();
  return (
    <ul className="conv-list" aria-label={t('comms.conversations')}>
      {items.map((c) => (
        <li key={c.id}>
          <Link to={buildHref(c.id)} className={cx('conv', c.id === activeId && 'is-active', c.unread > 0 && 'is-unread')} aria-current={c.id === activeId ? 'true' : undefined}>
            <Avatar name={c.contact?.name} />
            <span className="conv__main">
              <span className="conv__row">
                <span className="conv__name truncate">{c.contact?.name ?? t('comms.unknownContact')}</span>
                <span className="conv__time">{shortTime(c.lastMessageAt)}</span>
              </span>
              <span className="conv__row">
                <span className="conv__preview truncate">{c.lastDirection === 'out' ? `${t('comms.you')}: ` : ''}{c.lastMessage}</span>
                {c.unread > 0 && <span className="conv__badge" aria-label={t('comms.unreadCount', { n: c.unread })}>{c.unread}</span>}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
