import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarPlus, CheckSquare, FileText, StickyNote } from 'lucide-react';
import { useQuickActions } from '../../../components/quick/QuickActionsProvider.jsx';
import { PageShell } from '../../../components/shells/index.js';
import { Badge, Button, Card, DataState, Select, Skeleton, useToast } from '../../../components/ui/index.js';
import useResource from '../../../hooks/useResource.js';
import { useT } from '../../../i18n/index.jsx';
import { date, money, percent } from '../../../lib/format.js';
import { crmService } from '../../../services/index.js';
import cx from '../../../lib/cx.js';
import { STAGES } from './PipelinePage.jsx';

export default function OpportunityPage() {
  const t = useT();
  const { id } = useParams();
  const toast = useToast();
  const quick = useQuickActions();
  const { data, loading, error, refetch } = useResource(() => crmService.opportunity(id), [id]);
  const [stage, setStage] = useState(null);
  const o = data?.opportunity;
  const current = stage ?? o?.stage;
  const flow = STAGES.filter((s) => s !== 'lost');
  const idx = flow.indexOf(current);

  const change = async (value) => {
    setStage(value);
    await crmService.moveOpportunity(id, value);
    toast.show(t('pipeline.moved', { title: o.title, stage: t(`stages.${value}`) }));
  };

  return (
    <PageShell fallback="/crm/pipeline" breadcrumbs={[{ label: t('nav.crm'), to: '/crm/pipeline' }, { label: t('nav.pipeline'), to: '/crm/pipeline' }, { label: o?.title ?? '…' }]}>
      <DataState loading={loading && !data} error={error} onRetry={refetch} skeleton={<div className="stack"><Skeleton height={44} width="40%" /><Skeleton height={240} /></div>}>
        {o && (
          <>
            <div className="detail-head">
              <div style={{ minWidth: 0 }}>
                <h1 className="detail-head__title">{o.title}</h1>
                <div className="detail-head__meta">
                  <Badge tone={current === 'won' ? 'success' : current === 'lost' ? 'danger' : 'accent'} dot>{t(`stages.${current}`)}</Badge>
                  <span className="tnum">{money(o.value)}</span>
                  <span>· {t('pipeline.probability')}: {percent(o.probability)}</span>
                </div>
              </div>
              <div className="page-head__actions">
                <Button icon={CalendarPlus} onClick={() => quick.open('appointment')}>{t('quick.appointment')}</Button>
                <Button icon={CheckSquare} onClick={() => quick.open('task')}>{t('quick.task')}</Button>
                <Button icon={StickyNote} onClick={() => quick.open('note')}>{t('quick.note')}</Button>
              </div>
            </div>
            <Card title={t('pipeline.progress')} style={{ marginBottom: 16 }}>
              <ol className="stepper" aria-label={t('pipeline.progress')}>
                {flow.map((s, i) => (
                  <li key={s} className={cx('stepper__step', current !== 'lost' && i < idx && 'is-done', s === current && 'is-current', current === 'lost' && 'is-lost')} aria-current={s === current ? 'step' : undefined}>
                    <span className="stepper__bar" aria-hidden="true" />
                    {t(`stages.${s}`)}
                  </li>
                ))}
              </ol>
            </Card>
            <div className="detail-grid">
              <div className="stack">
                <Card title={t('pipeline.details')}>
                  <dl className="dl dl--2">
                    <div><dt>{t('pipeline.value')}</dt><dd className="tnum">{money(o.value)}</dd></div>
                    <div><dt>{t('pipeline.nextAction')}</dt><dd>{o.nextAction ? `${o.nextAction} · ${date(o.nextActionAt, 'MMM d')}` : '—'}</dd></div>
                    <div><dt>{t('list.owner')}</dt><dd>{data.owner?.name}</dd></div>
                    <div><dt>{t('pipeline.inStage')}</dt><dd>{t('pipeline.daysInStage', { n: o.daysInStage })}</dd></div>
                    <div><dt>{t('leads.fields.serviceType')}</dt><dd>{data.lead ? t(`services.${data.lead.serviceType}`) : '—'}</dd></div>
                    <div><dt>{t('leads.fields.neighborhood')}</dt><dd>{data.lead?.neighborhood || '—'}</dd></div>
                  </dl>
                  {data.lead?.description && <p className="prose" style={{ marginTop: 16 }}>{data.lead.description}</p>}
                </Card>
                <Card title={t('nav.estimates')} flush>
                  <ul className="list">
                    {data.estimates.map((e) => (
                      <li key={e.id}>
                        <Link className="list-item" to="/finance/estimates">
                          <FileText size={16} className="subtle" aria-hidden="true" />
                          <div className="list-item__main"><p className="list-item__title">{e.number}</p><p className="list-item__meta">{date(e.createdAt)}</p></div>
                          <Badge>{t(`estimateStatus.${e.status}`)}</Badge>
                          <span className="list-item__aside tnum" style={{ color: 'var(--text)' }}>{money(e.total)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
              <div className="stack">
                <Card title={t('dashboard.charts.stage')}>
                  <label className="field__label" htmlFor="opp-stage">{t('pipeline.moveTo')}</label>
                  <Select id="opp-stage" value={current} onChange={(e) => change(e.target.value)} options={STAGES.map((s) => ({ value: s, label: t(`stages.${s}`) }))} style={{ marginTop: 6 }} />
                </Card>
                <Card title={t('pipeline.lead')}>
                  {data.lead ? (
                    <Link to={`/crm/leads/${data.lead.id}`} className="stack-sm" style={{ color: 'inherit', textDecoration: 'none' }}>
                      <strong>{data.lead.name}</strong>
                      <span className="muted">{data.lead.email}</span>
                      <span className="muted tnum">{data.lead.phone}</span>
                    </Link>
                  ) : '—'}
                </Card>
              </div>
            </div>
          </>
        )}
      </DataState>
    </PageShell>
  );
}
