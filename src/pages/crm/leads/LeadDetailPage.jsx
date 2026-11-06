import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CalendarPlus, CheckSquare, CircleDot, Mail, MessageCircle, Pencil, Phone, Sparkles, UserPlus, Users } from 'lucide-react';
import { LEAD_STATUS_TONE, Score, StatusBadge } from '../../../components/crm/bits.jsx';
import { useQuickActions } from '../../../components/quick/QuickActionsProvider.jsx';
import { PageShell } from '../../../components/shells/index.js';
import { Avatar, Badge, Button, Card, DataState, Select, Skeleton, useToast } from '../../../components/ui/index.js';
import useResource from '../../../hooks/useResource.js';
import { useT } from '../../../i18n/index.jsx';
import { date, money } from '../../../lib/format.js';
import { crmService, leadsService, opportunitiesService } from '../../../services/index.js';
import { LEAD_STATUSES } from './LeadsPage.jsx';

const ACTIVITY_ICON = { created: UserPlus, referral: Users, contacted: Phone, qualified: CheckSquare, opportunity: Sparkles };

export default function LeadDetailPage() {
  const t = useT();
  const { id } = useParams();
  const toast = useToast();
  const quick = useQuickActions();
  const { data, loading, error, refetch } = useResource(() => crmService.lead(id), [id]);
  const [status, setStatus] = useState(null);
  const lead = data?.lead;
  const currentStatus = status ?? lead?.status;

  const changeStatus = async (value) => {
    setStatus(value);
    await leadsService.update(id, { status: value });
    toast.show(t('leads.statusChanged', { status: t(`leadStatus.${value}`) }));
  };
  const convert = async () => {
    await opportunitiesService.create({
      title: `${lead.lastName} — ${lead.neighborhood || t(`services.${lead.serviceType}`)}`, leadId: lead.id, stage: 'new',
      value: lead.budget || 0, probability: 0.1, nextAction: 'Schedule consultation', nextActionAt: new Date().toISOString(),
      stageEnteredAt: new Date().toISOString(), ownerId: lead.assigneeId, closedAt: null,
    });
    await leadsService.update(id, { status: 'converted' });
    setStatus('converted');
    toast.show(t('leads.converted'));
    refetch();
  };

  return (
    <PageShell
      fallback="/crm/leads"
      breadcrumbs={[{ label: t('nav.crm'), to: '/crm/leads' }, { label: t('leads.title'), to: '/crm/leads' }, { label: lead?.name ?? '…' }]}
    >
      <DataState
        loading={loading && !data}
        error={error}
        onRetry={refetch}
        skeleton={<div className="stack"><Skeleton height={44} width="40%" /><Skeleton height={240} /></div>}
      >
        {lead && (
          <>
            <div className="detail-head">
              <div className="detail-head__main">
                <Avatar name={lead.name} size="lg" />
                <div style={{ minWidth: 0 }}>
                  <h1 className="detail-head__title">{lead.name}</h1>
                  <div className="detail-head__meta">
                    <StatusBadge ns="leadStatus" value={currentStatus} tones={LEAD_STATUS_TONE} />
                    <Badge>{t(`sources.${lead.source}`)}</Badge>
                    <span>{t(`services.${lead.serviceType}`)}</span>
                    {lead.neighborhood && <span>· {lead.neighborhood}</span>}
                  </div>
                </div>
              </div>
              <div className="page-head__actions">
                <Button icon={CalendarPlus} onClick={() => quick.open('appointment')}>{t('quick.appointment')}</Button>
                <Button icon={CheckSquare} onClick={() => quick.open('task')}>{t('quick.task')}</Button>
                <Button icon={Pencil} to={`/crm/leads/${lead.id}/edit`}>{t('common.edit')}</Button>
                {!data.opportunity && <Button variant="primary" icon={ArrowRight} onClick={convert}>{t('leads.convert')}</Button>}
              </div>
            </div>

            <div className="detail-grid">
              <div className="stack">
                <Card title={t('leads.sections.project')}>
                  <dl className="dl dl--2">
                    <div><dt>{t('leads.fields.startWhen')}</dt><dd>{t(`leads.startOptions.${lead.startWhen}`)}</dd></div>
                    <div><dt>{t('leads.fields.budget')}</dt><dd className="tnum">{money(lead.budget)}</dd></div>
                    <div><dt>{t('leads.fields.serviceType')}</dt><dd>{t(`services.${lead.serviceType}`)}</dd></div>
                    <div><dt>{t('leads.fields.neighborhood')}</dt><dd>{lead.neighborhood || '—'}</dd></div>
                  </dl>
                  <div style={{ marginTop: 16 }}>
                    <p className="field__label" style={{ marginBottom: 4 }}>{t('leads.fields.description')}</p>
                    <p className="prose">{lead.description}</p>
                  </div>
                </Card>
                <Card title={t('leads.activity')}>
                  <ol className="timeline">
                    {data.activity.map((a) => {
                      const Icon = ACTIVITY_ICON[a.kind] || CircleDot;
                      return (
                        <li key={a.id} className="timeline__item">
                          <span className="timeline__dot" aria-hidden="true"><Icon /></span>
                          <div>
                            <p>{t(`leads.act.${a.kind}`, { ...a.vars, source: a.vars?.source && t(`sources.${a.vars.source}`) })}</p>
                            <p className="subtle" style={{ fontSize: 12 }}>{date(a.at, 'MMM d, yyyy')}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </Card>
              </div>

              <div className="stack">
                <Card title={t('leads.sections.contact')}>
                  <ul className="stack-sm">
                    <li className="row"><Mail size={16} className="subtle" aria-hidden="true" /><a className="truncate" href={`mailto:${lead.email}`}>{lead.email}</a></li>
                    <li className="row"><Phone size={16} className="subtle" aria-hidden="true" /><a href={`tel:${lead.phone}`}>{lead.phone}</a></li>
                    <li className="row"><MessageCircle size={16} className="subtle" aria-hidden="true" /><Link to="/crm/communications/whatsapp">{t('channels.whatsapp')}</Link></li>
                  </ul>
                </Card>
                <Card title={t('leads.sections.qualification')}>
                  <dl className="dl">
                    <div>
                      <dt><label htmlFor="lead-status">{t('list.status')}</label></dt>
                      <dd>
                        <Select id="lead-status" value={currentStatus} onChange={(e) => changeStatus(e.target.value)} options={LEAD_STATUSES.map((s) => ({ value: s, label: t(`leadStatus.${s}`) }))} />
                      </dd>
                    </div>
                    <div><dt>{t('leads.fields.score')}</dt><dd><Score value={lead.score} /></dd></div>
                    <div><dt>{t('leads.fields.referredBy')}</dt><dd>{data.referrer ? <Link to={`/crm/contacts/${data.referrer.id}`}>{data.referrer.name}</Link> : '—'}</dd></div>
                    <div><dt>{t('leads.fields.assignee')}</dt><dd>{data.assignee?.name ?? '—'}</dd></div>
                    <div><dt>{t('leads.columns.created')}</dt><dd>{date(lead.createdAt)}</dd></div>
                  </dl>
                </Card>
                <Card title={t('leads.opportunity')}>
                  {data.opportunity ? (
                    <Link to={`/crm/pipeline/${data.opportunity.id}`} className="stack-sm" style={{ color: 'inherit', textDecoration: 'none' }}>
                      <span className="row-between"><strong className="truncate">{data.opportunity.title}</strong><Badge tone="accent">{t(`stages.${data.opportunity.stage}`)}</Badge></span>
                      <span className="tnum muted">{money(data.opportunity.value)}</span>
                    </Link>
                  ) : <p className="muted">{t('leads.noOpportunity')}</p>}
                </Card>
              </div>
            </div>
          </>
        )}
      </DataState>
    </PageShell>
  );
}
