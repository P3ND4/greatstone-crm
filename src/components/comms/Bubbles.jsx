import { Fragment } from 'react';
import { Bot, Check, CheckCheck, Clock, FileText, Image as ImageIcon, Lock } from 'lucide-react';
import { useT } from '../../i18n/index.jsx';
import { time } from '../../lib/format.js';
import { lookupService } from '../../services/index.js';
import cx from '../../lib/cx.js';
import { dayDivider } from './util.js';

function Status({ status }) {
  const t = useT();
  if (!status) return null;
  if (status === 'scheduled') return <Clock className="bubble__status" aria-label={t('comms.status.scheduled')} />;
  const Icon = status === 'sent' ? Check : CheckCheck;
  return <Icon className={cx('bubble__status', status === 'read' && 'is-read')} aria-label={t(`comms.status.${status}`)} />;
}

export function Attachment({ file }) {
  const Icon = /jpe?g|png|webp/i.test(file.type) ? ImageIcon : FileText;
  return (
    <span className="attachment">
      <Icon aria-hidden="true" />
      <span className="truncate">{file.name}</span>
      <span className="subtle">{file.size}</span>
    </span>
  );
}

/** Chat message list (WhatsApp / SMS): day dividers, in/out bubbles, delivery ticks, internal notes, auto-replies, scheduled texts. */
export default function Bubbles({ messages }) {
  const t = useT();
  let lastDay = null;
  return (
    <ol className="bubbles" aria-label={t('comms.messages')}>
      {messages.map((m) => {
        const day = dayDivider(m.sentAt);
        const divider = day !== lastDay ? <li className="bubbles__day" aria-hidden="false"><span>{day}</span></li> : null;
        lastDay = day;
        if (m.isNote) {
          return (
            <Fragment key={m.id}>
              {divider}
              <li className="note-msg">
                <span className="note-msg__head"><Lock size={12} aria-hidden="true" />{t('comms.internalNote')} · {lookupService.user(m.authorId)?.name} · {time(m.sentAt)}</span>
                <p className="prose">{m.body}</p>
              </li>
            </Fragment>
          );
        }
        return (
          <Fragment key={m.id}>
            {divider}
            <li className={cx('bubble', m.direction === 'out' ? 'bubble--out' : 'bubble--in')}>
              {m.attachments.map((a) => <Attachment key={a.name} file={a} />)}
              {m.body && <p className="bubble__body">{m.body}</p>}
              <span className="bubble__meta">
                <span className="sr-only">{m.direction === 'out' ? t('comms.sent') : t('comms.received')}</span>
                {m.auto && <span className="bubble__tag"><Bot aria-hidden="true" />{t('comms.sms.auto')}</span>}
                {m.segments > 1 && <span className="bubble__tag">{t('comms.sms.segments', { n: m.segments })}</span>}
                {m.status === 'scheduled' ? t('comms.sms.scheduledFor', { time: time(m.scheduledFor) }) : time(m.sentAt)}
                {m.direction === 'out' && <Status status={m.status} />}
              </span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
