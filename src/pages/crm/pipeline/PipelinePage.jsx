import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Clock, HandCoins, Percent, Scale, Trophy } from 'lucide-react';
import { SearchInput, FilterSelect } from '../../../components/list/ListToolbar.jsx';
import { Avatar, Card, DataState, Kpi, Skeleton, useToast } from '../../../components/ui/index.js';
import Kanban from '../../../components/ui/Kanban.jsx';
import useResource from '../../../hooks/useResource.js';
import useUrlState from '../../../hooks/useUrlState.js';
import { useT } from '../../../i18n/index.jsx';
import { date, money, moneyCompact, percent } from '../../../lib/format.js';
import { crmService, lookupService } from '../../../services/index.js';

export const STAGES = ['new', 'contacted', 'consultation', 'proposal', 'negotiation', 'won', 'lost'];

function DealCard({ deal, t }) {
  const late = deal.nextActionAt && new Date(deal.nextActionAt) < new Date(new Date().toDateString());
  return (
    <article className="deal">
      <div className="row-between" style={{ alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <h3 className="deal__title">{deal.title}</h3>
          <p className="deal__sub">{deal.lead ? t(`services.${deal.lead.serviceType}`) : '—'}</p>
        </div>
        <Avatar name={deal.owner?.name} size="sm" />
      </div>
      <span className="deal__value">{money(deal.value)}</span>
      {deal.nextAction && (
        <span className={`deal__next${late ? ' is-late' : ''}`}>
          <CalendarClock aria-hidden="true" />
          <span className="truncate">{deal.nextAction} · {date(deal.nextActionAt, 'MMM d')}</span>
        </span>
      )}
      <div className="deal__foot">
        <span className="row" style={{ gap: 4 }}><Clock size={12} aria-hidden="true" />{t('pipeline.daysInStage', { n: deal.daysInStage })}</span>
        <Link className="deal__open" to={`/crm/pipeline/${deal.id}`} onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>{t('common.view')}</Link>
      </div>
    </article>
  );
}

export default function PipelinePage() {
  const t = useT();
  const toast = useToast();
  const [owner, setOwner] = useUrlState('owner', '');
  const [q, setQ] = useUrlState('q', '');
  const { data, loading, error, refetch } = useResource(() => crmService.pipeline({ ownerId: owner || undefined }), [owner]);
  const [deals, setDeals] = useState([]);
  useEffect(() => { if (data) setDeals(data); }, [data]);

  const visible = useMemo(() => deals.filter((d) => !q || d.title.toLowerCase().includes(q.toLowerCase())), [deals, q]);
  const open = visible.filter((d) => !['won', 'lost'].includes(d.stage));
  const won = visible.filter((d) => d.stage === 'won');
  const lost = visible.filter((d) => d.stage === 'lost');
  const sum = (rows, f) => rows.reduce((a, r) => a + f(r), 0);

  const columns = STAGES.map((s) => {
    const rows = visible.filter((d) => d.stage === s);
    return {
      id: s,
      title: t(`stages.${s}`),
      meta: rows.length ? moneyCompact(sum(rows, (d) => d.value)) : t('common.none'),
      tone: s === 'won' ? 'success' : s === 'lost' ? 'muted' : undefined,
      emptyLabel: t('pipeline.dropHere'),
    };
  });

  const move = async (id, stage) => {
    setDeals((list) => list.map((d) => (d.id === id ? { ...d, stage, daysInStage: 0, nextAction: ['won', 'lost'].includes(stage) ? null : d.nextAction } : d)));
    const deal = deals.find((d) => d.id === id);
    await crmService.moveOpportunity(id, stage);
    toast.show(t('pipeline.moved', { title: deal.title, stage: t(`stages.${stage}`) }));
  };

  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-head__eyebrow">{t('nav.crm')}</p>
          <h1 className="page-title">{t('nav.pipeline')}</h1>
          <p className="page-subtitle">{t('pipeline.subtitle')}</p>
        </div>
        <div className="page-head__actions">
          <SearchInput value={q} onChange={setQ} placeholder={t('pipeline.search')} />
          <FilterSelect label={t('list.owner')} value={owner} onChange={setOwner} options={lookupService.users().map((u) => ({ value: u.id, label: u.name }))} />
        </div>
      </div>
      {error ? <Card><DataState error={error} onRetry={refetch} /></Card> : (
        <>
          <div className="summary-strip">
            <Kpi loading={loading && !data} icon={HandCoins} label={t('pipeline.openValue')} value={money(sum(open, (d) => d.value))} meta={t('dashboard.kpi.openOpps', { n: open.length })} />
            <Kpi loading={loading && !data} icon={Scale} label={t('pipeline.weighted')} value={money(sum(open, (d) => d.value * d.probability))} meta={t('pipeline.weightedHint')} />
            <Kpi loading={loading && !data} icon={Trophy} label={t('pipeline.wonValue')} value={money(sum(won, (d) => d.value))} meta={t('pipeline.dealsCount', { n: won.length })} />
            <Kpi loading={loading && !data} icon={Percent} label={t('pipeline.winRate')} value={percent(won.length + lost.length ? won.length / (won.length + lost.length) : null)} meta={t('pipeline.winRateHint', { won: won.length, lost: lost.length })} />
          </div>
          {loading && !data ? (
            <div className="kanban">{STAGES.map((s) => <Skeleton key={s} height={360} radius={14} />)}</div>
          ) : (
            <Kanban label={t('nav.pipeline')} columns={columns} items={visible} onMove={move} renderCard={(d) => <DealCard deal={d} t={t} />} />
          )}
        </>
      )}
    </>
  );
}
