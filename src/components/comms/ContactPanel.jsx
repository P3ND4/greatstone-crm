import { Link } from 'react-router-dom';
import { Building2, CalendarPlus, CheckSquare, Mail, Phone, UserPlus } from 'lucide-react';
import { CONTACT_TYPE_TONE } from '../crm/bits.jsx';
import { useQuickActions } from '../quick/QuickActionsProvider.jsx';
import { Avatar, Badge, Button } from '../ui/index.js';
import { useT } from '../../i18n/index.jsx';
import { percent } from '../../lib/format.js';

/** Right panel: linked contact / project + quick actions (task, appointment, lead, project). */
export default function ContactPanel({ conversation }) {
  const t = useT();
  const quick = useQuickActions();
  const c = conversation.contact;
  const p = conversation.project;
  return (
    <aside className="comms-side" aria-label={t('comms.contactPanel')}>
      {c ? (
        <div className="comms-side__block" style={{ textAlign: 'center' }}>
          <Avatar name={c.name} size="lg" className="mx-auto" />
          <p className="comms-side__name">{c.name}</p>
          {c.company && <p className="muted" style={{ fontSize: 13 }}>{c.company}</p>}
          <div style={{ marginTop: 6 }}><Badge tone={CONTACT_TYPE_TONE[c.type]}>{t(`contactTypes.${c.type}`)}</Badge></div>
          <ul className="stack-sm comms-side__links">
            <li className="row"><Phone size={14} aria-hidden="true" /><a href={`tel:${c.phone}`} className="tnum">{c.phone}</a></li>
            <li className="row"><Mail size={14} aria-hidden="true" /><a href={`mailto:${c.email}`} className="truncate">{c.email}</a></li>
          </ul>
          <Button size="sm" block to={`/crm/contacts/${c.id}`}>{t('comms.viewContact')}</Button>
        </div>
      ) : (
        <div className="comms-side__block"><p className="muted">{t('comms.unknownContact')}</p></div>
      )}
      <div className="comms-side__block">
        <p className="comms-side__label">{t('nav.projects')}</p>
        {p ? (
          <Link to={`/projects/${p.id}`} className="comms-side__project">
            <Building2 size={16} aria-hidden="true" />
            <span style={{ minWidth: 0 }}>
              <strong className="truncate" style={{ display: 'block', fontWeight: 500 }}>{p.name}</strong>
              <span className="muted" style={{ fontSize: 12 }}>{t(`projectStatus.${p.status}`)} · {percent(p.progress)}</span>
            </span>
          </Link>
        ) : <p className="muted" style={{ fontSize: 13 }}>{t('comms.noProject')}</p>}
      </div>
      <div className="comms-side__block stack-sm">
        <p className="comms-side__label">{t('common.actions')}</p>
        <Button size="sm" plain icon={CheckSquare} onClick={() => quick.open('task', { projectId: p?.id ?? '' })}>{t('comms.createTask')}</Button>
        <Button size="sm" plain icon={CalendarPlus} onClick={() => quick.open('appointment', { contactId: c?.id ?? '', projectId: p?.id ?? '' })}>{t('comms.createAppointment')}</Button>
        <Button size="sm" plain icon={UserPlus} to="/crm/leads/new">{t('comms.createLead')}</Button>
      </div>
    </aside>
  );
}
