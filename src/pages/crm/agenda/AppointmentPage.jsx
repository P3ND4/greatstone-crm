import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { addMinutes } from 'date-fns';
import { Building2, Clock, MapPin, Pencil, Trash2, User } from 'lucide-react';
import { useQuickActions } from '../../../components/quick/QuickActionsProvider.jsx';
import { ConfirmDialog, PageShell } from '../../../components/shells/index.js';
import { Avatar, Badge, Button, Card, DataState, Skeleton, useToast } from '../../../components/ui/index.js';
import useResource from '../../../hooks/useResource.js';
import { useT } from '../../../i18n/index.jsx';
import { date, time } from '../../../lib/format.js';
import { appointmentsService, lookupService } from '../../../services/index.js';

/** Full appointment detail (page). Quick create/edit happens in the modal. */
export default function AppointmentPage() {
  const t = useT();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const quick = useQuickActions();
  const [confirm, setConfirm] = useState(false);
  const { data: a, loading, error, refetch } = useResource(() => appointmentsService.get(id), [id]);
  const contact = a && lookupService.contact(a.contactId);
  const project = a && lookupService.project(a.projectId);
  const user = a && lookupService.user(a.assigneeId);

  const remove = async () => {
    setConfirm(false);
    await appointmentsService.remove(id);
    toast.show(t('agenda.deleted'));
    navigate('/crm/agenda', { replace: true });
  };

  return (
    <PageShell fallback="/crm/agenda" breadcrumbs={[{ label: t('nav.crm'), to: '/crm/agenda' }, { label: t('nav.agenda'), to: '/crm/agenda' }, { label: a?.title ?? '…' }]}>
      <DataState loading={loading && !a} error={error} onRetry={refetch} skeleton={<Skeleton height={240} />}>
        {a && (
          <>
            <div className="detail-head">
              <div style={{ minWidth: 0 }}>
                <h1 className="detail-head__title">{a.title}</h1>
                <div className="detail-head__meta">
                  <Badge className={`badge-evt evt--${a.type}`}>{t(`appointmentTypes.${a.type}`)}</Badge>
                  <span>{date(a.start, 'EEEE, MMMM d, yyyy')}</span>
                  <span>· {time(a.start)} – {time(addMinutes(new Date(a.start), a.durationMin))}</span>
                </div>
              </div>
              <div className="page-head__actions">
                <Button icon={Pencil} onClick={() => quick.open('appointment', { appointment: a, onSaved: refetch })}>{t('common.edit')}</Button>
                <Button icon={Trash2} onClick={() => setConfirm(true)}>{t('common.delete')}</Button>
              </div>
            </div>
            <div className="detail-grid">
              <Card title={t('agenda.details')}>
                <dl className="dl dl--2">
                  <div><dt><Clock size={13} style={{ display: 'inline', verticalAlign: -2 }} aria-hidden="true" /> {t('appointment.duration')}</dt><dd>{a.durationMin} min</dd></div>
                  <div><dt><MapPin size={13} style={{ display: 'inline', verticalAlign: -2 }} aria-hidden="true" /> {t('appointment.location')}</dt><dd>{a.location || '—'}</dd></div>
                  <div><dt><User size={13} style={{ display: 'inline', verticalAlign: -2 }} aria-hidden="true" /> {t('appointment.contact')}</dt><dd>{contact ? <Link to={`/crm/contacts/${contact.id}`}>{contact.name}</Link> : '—'}</dd></div>
                  <div><dt><Building2 size={13} style={{ display: 'inline', verticalAlign: -2 }} aria-hidden="true" /> {t('nav.projects')}</dt><dd>{project ? <Link to={`/projects/${project.id}`}>{project.name}</Link> : '—'}</dd></div>
                </dl>
              </Card>
              <Card title={t('list.assignee')}>
                <span className="row"><Avatar name={user?.name} /><span><strong style={{ fontWeight: 500, display: 'block' }}>{user?.name}</strong><span className="muted" style={{ fontSize: 12 }}>{user?.title}</span></span></span>
              </Card>
            </div>
          </>
        )}
      </DataState>
      <ConfirmDialog open={confirm} title={t('agenda.deleteTitle')} body={t('agenda.deleteBody')} confirmLabel={t('common.delete')} cancelLabel={t('common.cancel')} onCancel={() => setConfirm(false)} onConfirm={remove} />
    </PageShell>
  );
}
