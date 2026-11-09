import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Ban, Mail, MessageCircle, Megaphone, Percent, Send, Target, UserCheck, Users, Workflow, MessageSquareText } from 'lucide-react';
import HBarChart from '../../../components/charts/HBarChart.jsx';
import ChartCard from '../../../components/charts/ChartCard.jsx';
import { PersonCell, PROSPECT_STATUS_TONE, RowMenu, Score, StatusBadge, UserChip } from '../../../components/crm/bits.jsx';
import ListToolbar, { FilterSelect, SearchInput } from '../../../components/list/ListToolbar.jsx';
import { Badge, Button, Card, DataState, Kpi, Pagination, Skeleton, Table, Tabs, useToast } from '../../../components/ui/index.js';
import useListState from '../../../hooks/useListState.js';
import useResource from '../../../hooks/useResource.js';
import { useT } from '../../../i18n/index.jsx';
import { date, number, percent } from '../../../lib/format.js';
import { lookupService, prospectingService } from '../../../services/index.js';

const SEGMENTS = ['architect', 'propertyManager', 'hoaBoard', 'builder', 'developer', 'brokerage', 'agent'];
const STATUSES = ['new', 'contacted', 'replied', 'meeting', 'converted', 'notInterested'];
const CAMPAIGN_TONE = { active: 'success', paused: 'warning', draft: 'neutral' };
const TABS = ['prospects', 'lists', 'campaigns', 'sequences'];

function ProspectsTab({ list }) {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const { list: listId, segment, status } = list.filters;
  const { data: lists } = useResource(() => prospectingService.lists(), []);
  const { data, loading, error, refetch } = useResource(
    () => prospectingService.prospects({ listId, segment, status, q: list.q, page: list.page, pageSize: list.pageSize, sort: list.sort }),
    [listId, segment, status, list.q, list.page, list.sort],
  );
  const users = lookupService.users();

  const convert = async (p) => {
    const lead = await prospectingService.convertToLead(p.id);
    toast.show(t('prospecting.converted', { name: p.name }));
    refetch();
    navigate(`/crm/leads/${lead.id}`);
  };
  const notInterested = async (p) => {
    await prospectingService.update([p.id], { status: 'notInterested', nextTouchAt: null });
    toast.show(t('prospecting.markedNotInterested'));
    refetch();
  };

  const columns = [
    { key: 'name', header: t('leads.columns.name'), sortable: true, render: (p) => <PersonCell name={p.name} sub={`${p.role} · ${p.company}`} /> },
    { key: 'segment', header: t('list.segment'), hide: 'xl', render: (p) => <Badge>{t(`segments.${p.segment}`)}</Badge> },
    { key: 'status', header: t('list.status'), render: (p) => <StatusBadge ns="prospectStatus" value={p.status} tones={PROSPECT_STATUS_TONE} /> },
    { key: 'score', header: t('leads.fields.score'), sortable: true, hide: 'lg', render: (p) => <Score value={p.score} /> },
    {
      key: 'sequence', header: t('prospecting.sequence'), hide: 'xxl',
      render: (p) => (p.sequence ? <span className="muted truncate" style={{ display: 'block', maxWidth: 220 }}>{t('prospecting.step', { n: p.step, total: p.sequence.steps.length })} · {p.sequence.name}</span> : '—'),
    },
    { key: 'nextTouchAt', header: t('prospecting.nextTouch'), sortable: true, hide: 'lg', render: (p) => <span className="tnum muted">{p.nextTouchAt ? date(p.nextTouchAt, 'MMM d') : '—'}</span> },
    { key: 'ownerId', header: t('list.owner'), hide: 'md', render: (p) => <UserChip user={users.find((u) => u.id === p.ownerId)} /> },
    {
      key: 'actions', header: <span className="sr-only">{t('common.actions')}</span>,
      render: (p) => (
        <RowMenu items={[
          ...(p.status !== 'converted' ? [{ label: t('prospecting.convert'), icon: UserCheck, onClick: () => convert(p) }] : []),
          { label: t('channels.email'), icon: Mail, to: `/crm/communications/email/compose?to=${encodeURIComponent(p.email)}` },
          { label: t('channels.whatsapp'), icon: MessageCircle, to: '/crm/communications/whatsapp' },
          { label: t('channels.sms'), icon: MessageSquareText, to: '/crm/communications/sms' },
          ...(p.status !== 'notInterested' ? [{ label: t('prospecting.notInterested'), icon: Ban, onClick: () => notInterested(p) }] : []),
        ]}
        />
      ),
    },
  ];

  return (
    <Card flush className="list-card">
      <ListToolbar
        search={<SearchInput value={list.q} onChange={list.setQ} placeholder={t('prospecting.search')} />}
        activeFilters={[listId, segment, status, list.q].filter(Boolean).length}
        onClear={() => list.setFilters({ list: '', segment: '', status: '', q: '' })}
        filters={(
          <>
            <FilterSelect label={t('list.list')} value={listId} onChange={(v) => list.setFilter('list', v)} options={(lists || []).map((l) => ({ value: l.id, label: l.name }))} />
            <FilterSelect label={t('list.segment')} value={segment} onChange={(v) => list.setFilter('segment', v)} options={SEGMENTS.map((s) => ({ value: s, label: t(`segments.${s}`) }))} />
            <FilterSelect label={t('list.status')} value={status} onChange={(v) => list.setFilter('status', v)} options={STATUSES.map((s) => ({ value: s, label: t(`prospectStatus.${s}`) }))} />
          </>
        )}
      />
      <DataState error={error} onRetry={refetch} empty={data && !data.total} emptyIcon={Target} emptyTitle={t('list.noResults')} emptyBody="">
        <Table caption={t('nav.prospecting')} columns={columns} rows={data?.items || []} loading={loading && !data} sort={list.sort} onSort={list.setSort} />
        {data && data.total > 0 && <Pagination page={list.page} pageSize={list.pageSize} total={data.total} onChange={list.setPage} />}
      </DataState>
    </Card>
  );
}

function ListsTab({ onOpenList }) {
  const t = useT();
  const { data: lists, loading } = useResource(() => prospectingService.lists(), []);
  const { data: overview } = useResource(() => prospectingService.overview(), []);
  return (
    <div className="grid grid-3" style={{ alignItems: 'start' }}>
      <div className="span-2 cards-grid" style={{ padding: 0 }}>
        {loading && !lists ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={170} radius={10} />) : lists?.map((l) => (
          <article key={l.id} className="record-card" style={{ cursor: 'default' }}>
            <div className="row-between" style={{ alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <h3 className="record-card__title">{l.name}</h3>
                <p className="record-card__sub">{t(`segments.${l.segment}`)}</p>
              </div>
              <Badge>{l.total}</Badge>
            </div>
            <p className="record-card__body">{l.description}</p>
            <dl className="mini-stats">
              <div><dt>{t('prospecting.contacted')}</dt><dd>{number(l.contacted)}</dd></div>
              <div><dt>{t('prospecting.replied')}</dt><dd>{number(l.replied)}</dd></div>
              <div><dt>{t('prospecting.replyRate')}</dt><dd>{percent(l.replyRate)}</dd></div>
            </dl>
            <Button size="sm" iconRight={ArrowRight} onClick={() => onOpenList(l.id)}>{t('prospecting.viewProspects')}</Button>
          </article>
        ))}
      </div>
      <ChartCard
        title={t('prospecting.bySegment')}
        subtitle={t('prospecting.bySegmentSub')}
        table={overview && {
          columns: [
            { key: 'segment', header: t('list.segment'), format: (s) => t(`segments.${s}`) },
            { key: 'contacted', header: t('prospecting.contacted'), align: 'right' },
            { key: 'replyRate', header: t('prospecting.replyRate'), align: 'right', format: (v) => percent(v) },
          ],
          rows: overview.segments,
        }}
      >
        {overview ? (
          <HBarChart
            ariaLabel={t('prospecting.bySegment')}
            format={(v) => percent(v)}
            data={overview.segments.map((s) => ({ key: s.segment, label: t(`segments.${s.segment}`), value: s.replyRate ?? 0, meta: `${s.replied}/${s.contacted}` }))}
          />
        ) : <Skeleton height={200} />}
      </ChartCard>
    </div>
  );
}

function CampaignsTab() {
  const t = useT();
  const { data, loading } = useResource(() => prospectingService.campaigns(), []);
  return (
    <Card flush className="list-card">
      <Table
        caption={t('prospecting.tabs.campaigns')}
        loading={loading && !data}
        rows={data || []}
        columns={[
          { key: 'name', header: t('prospecting.campaign'), render: (c) => <span className="stack-sm" style={{ gap: 0 }}><strong style={{ fontWeight: 500 }}>{c.name}</strong><span className="muted" style={{ fontSize: 12 }}>{c.list?.name}</span></span> },
          { key: 'status', header: t('list.status'), render: (c) => <Badge tone={CAMPAIGN_TONE[c.status]} dot>{t(`campaignStatus.${c.status}`)}</Badge> },
          { key: 'sequence', header: t('prospecting.sequence'), hide: 'xl', render: (c) => <span className="muted">{c.sequence?.name}</span> },
          { key: 'startedAt', header: t('prospecting.started'), hide: 'lg', render: (c) => <span className="tnum muted">{c.startedAt ? date(c.startedAt, 'MMM d') : '—'}</span> },
          { key: 'total', header: t('prospecting.prospects'), align: 'right', render: (c) => number(c.total) },
          { key: 'contacted', header: t('prospecting.contacted'), align: 'right', hide: 'md', render: (c) => number(c.contacted) },
          { key: 'replied', header: t('prospecting.replied'), align: 'right', hide: 'md', render: (c) => number(c.replied) },
          { key: 'meetings', header: t('prospecting.meetings'), align: 'right', hide: 'lg', render: (c) => number(c.meetings) },
          { key: 'replyRate', header: t('prospecting.replyRate'), align: 'right', render: (c) => percent(c.replyRate) },
        ]}
      />
    </Card>
  );
}

function SequencesTab() {
  const t = useT();
  const { data, loading } = useResource(() => prospectingService.sequences(), []);
  return (
    <div className="grid grid-3">
      {loading && !data ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} height={220} radius={14} />) : data?.map((s) => (
        <Card key={s.id} title={s.name} subtitle={t('prospecting.stepsCount', { n: s.steps.length })}>
          <ol className="timeline">
            {s.steps.map((step, i) => {
              const Icon = step.channel === 'email' ? Mail : MessageCircle;
              return (
                <li key={i} className="timeline__item">
                  <span className="timeline__dot" aria-hidden="true"><Icon /></span>
                  <div>
                    <p style={{ fontWeight: 500 }}>{step.subject}</p>
                    <p className="subtle" style={{ fontSize: 12 }}>{t('prospecting.day', { n: step.day })} · {t(`channels.${step.channel}`)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      ))}
    </div>
  );
}

export default function ProspectingPage() {
  const t = useT();
  const list = useListState({ sort: 'score:desc', filters: ['tab', 'list', 'segment', 'status'] });
  const tab = list.filters.tab || 'prospects';
  const { data: overview, loading } = useResource(() => prospectingService.overview(), []);
  const o = overview?.totals;

  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-head__eyebrow">{t('nav.crm')}</p>
          <h1 className="page-title">{t('nav.prospecting')}</h1>
          <p className="page-subtitle">{t('prospecting.subtitle')}</p>
        </div>
        <div className="page-head__actions">
          <Button icon={Workflow} onClick={() => list.setFilter('tab', 'sequences')}>{t('prospecting.tabs.sequences')}</Button>
          <Button variant="primary" icon={Megaphone} onClick={() => list.setFilter('tab', 'campaigns')}>{t('prospecting.tabs.campaigns')}</Button>
        </div>
      </div>
      <div className="summary-strip summary-strip--5">
        <Kpi loading={loading} icon={Users} label={t('prospecting.prospects')} value={number(o?.total)} />
        <Kpi loading={loading} icon={Send} label={t('prospecting.contacted')} value={number(o?.contacted)} />
        <Kpi loading={loading} icon={Percent} label={t('prospecting.replyRate')} value={percent(o?.replyRate)} meta={o && t('prospecting.repliedOf', { n: o.replied, total: o.contacted })} />
        <Kpi loading={loading} icon={MessageCircle} label={t('prospecting.meetings')} value={number(o?.meetings)} />
        <Kpi loading={loading} icon={UserCheck} label={t('prospecting.convertedLeads')} value={number(o?.converted)} meta={o && percent(o.conversionRate)} />
      </div>
      <Tabs label={t('nav.prospecting')} value={tab} onChange={(v) => list.setFilter('tab', v === 'prospects' ? '' : v)} tabs={TABS.map((x) => ({ id: x, label: t(`prospecting.tabs.${x}`) }))} />
      <div className="tab-panel" role="tabpanel">
        {tab === 'prospects' && <ProspectsTab list={list} />}
        {tab === 'lists' && <ListsTab onOpenList={(id) => list.setFilters({ tab: '', list: id })} />}
        {tab === 'campaigns' && <CampaignsTab />}
        {tab === 'sequences' && <SequencesTab />}
      </div>
      <p className="subtle" style={{ fontSize: 12, marginTop: 16 }}>{t('prospecting.footnote')} <Link to="/ai">{t('nav.ai')}</Link></p>
    </>
  );
}
