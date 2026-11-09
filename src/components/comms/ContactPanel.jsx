import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CalendarPlus, CheckSquare, Mail, Phone, ShieldCheck, UserPlus } from 'lucide-react';
import ConsentBadge from './ConsentBadge.jsx';
import ConsentModal from './ConsentModal.jsx';
import { date } from '../../lib/format.js';
import { CONTACT_TYPE_TONE } from '../crm/bits.jsx';
import { useQuickActions } from '../quick/QuickActionsProvider.jsx';
import { Avatar, Badge, Button } from '../ui/index.js';
import { useT } from '../../i18n/index.jsx';
import { percent } from '../../lib/format.js';

/** Right panel: linked contact / project, SMS consent (SMS threads) + quick actions (task, appointment, lead). */
export default function ContactPanel({ conversation, channel, sms, onConsentChange }) {
  const t = useT();
  const [consentOpen, setConsentOpen] = useState(false);
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
      {channel === 'sms' && sms && c && (
        <div className="comms-side__block stack-sm">
          <p className="comms-side__label">{t('comms.sms.consentTitle')}</p>
          <div><ConsentBadge consent={sms.consent} /></div>
          <p className="muted" style={{ fontSize: 13 }}>
            {sms.consent.status === 'unknown'
              ? t('comms.sms.consentUnknownBody')
              : t(`comms.sms.consentBody.${sms.consent.status}`, { source: sms.consent.source ? t(`comms.sms.source.${sms.consent.source}`) : '—', date: sms.consent.at ? date(sms.consent.at) : '—' })}
          </p>
          {sms.consent.status === 'unknown' && <Button size="sm" icon={ShieldCheck} onClick={() => setConsentOpen(true)}>{t('comms.sms.recordConsent')}</Button>}
        </div>
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
      {consentOpen && <ConsentModal contact={c} onClose={() => setConsentOpen(false)} onSaved={onConsentChange} />}
    </aside>
  );
}
