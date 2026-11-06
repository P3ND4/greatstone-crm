import { Inbox } from 'lucide-react';
import cx from '../../lib/cx.js';

export default function EmptyState({ icon: Icon = Inbox, title, body, action, tone, compact, className }) {
  return (
    <div className={cx('empty', compact && 'empty--compact', tone === 'danger' && 'empty--danger', className)} role={tone === 'danger' ? 'alert' : undefined}>
      <span className="empty__icon" aria-hidden="true"><Icon /></span>
      {title && <p className="empty__title">{title}</p>}
      {body && <p className="empty__body">{body}</p>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  );
}
