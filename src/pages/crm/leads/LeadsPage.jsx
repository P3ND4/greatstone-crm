import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarPlus, CheckSquare, Eye, Pencil, Plus, UserPlus } from 'lucide-react';
import { LEAD_STATUS_TONE, PersonCell, RowMenu, Score, StatusBadge, UserChip } from '../../../components/crm/bits.jsx';
import ListToolbar, { FilterSelect, SearchInput, ViewToggle } from '../../../components/list/ListToolbar.jsx';
import { useQuickActions } from '../../../components/quick/QuickActionsProvider.jsx';
import { Badge, Button, Card, DataState, Pagination, Skeleton, Table } from '../../../components/ui/index.js';
import useListState from '../../../hooks/useListState.js';
import useResource from '../../../hooks/useResource.js';
import { useT } from '../../../i18n/index.jsx';
import { date, money } from '../../../lib/format.js';
import { leadsService, lookupService } from '../../../services/index.js';

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'disqualified'];
const SOURCES = ['referral', 'instagram', 'website', 'google', 'houzz', 'facebook', 'partner', 'event'];
const SERVICES = ['design', 'remodel', 'kitchen', 'bath', 'closet', 'flooring', 'staging', 'planning', 'furnishing'];

export default function LeadsPage() {
  const t = useT();
  const navigate = useNavigate();
  const { state: navState } = useLocation();
  const quick = useQuickActions();
  const list = useListState({ sort: 'createdAt:desc', filters: ['status', 'source', 'service', 'assignee'] });
  const { status, source, service, assignee } = list.filters;

  const { data, loading, error, refetch } = useResource(() => leadsService.list({
    q: list.q, page: list.page, pageSize: list.pageSize, sort: list.sort,
    where: { status, source, serviceType: service, assigneeId: assignee },
  }), [list.q, list.page, list.sort, status, source, service, assignee]);

  const users = lookupService.users();
  const rowMenu = (l) => [
    { label: t('common.view'), icon: Eye, to: `/crm/leads/${l.id}` },
    { label: t('common.edit'), icon: Pencil, to: `/crm/leads/${l.id}/edit` },
    { label: t('quick.appointment'), icon: CalendarPlus, onClick: () => quick.open('appointment') },
    { label: t('quick.task'), icon: CheckSquare, onClick: () => quick.open('task') },
  ];

  const columns = [
    { key: 'name', header: t('leads.columns.name'), sortable: true, render: (l) => <PersonCell name={l.name} sub={l.email} /> },
    { key: 'serviceType', hide: 'xxl', header: t('leads.fields.serviceType'), render: (l) => <span className="truncate">{t(`services.${l.serviceType}`)}</span> },
    { key: 'source', hide: 'xl', header: t('leads.fields.source'), render: (l) => <Badge>{t(`sources.${l.source}`)}</Badge> },
    { key: 'budget', header: t('leads.columns.budget'), align: 'right', sortable: true, render: (l) => money(l.budget) },
    { key: 'score', hide: 'xl', header: t('leads.fields.score'), sortable: true, render: (l) => <Score value={l.score} /> },
    { key: 'status', header: t('list.status'), render: (l) => <StatusBadge ns="leadStatus" value={l.status} tones={LEAD_STATUS_TONE} /> },
    { key: 'assigneeId', hide: 'md', header: t('list.assignee'), render: (l) => <UserChip user={users.find((u) => u.id === l.assigneeId)} /> },
    { key: 'createdAt', hide: 'lg', header: t('leads.columns.created'), sortable: true, render: (l) => <span className="muted tnum">{date(l.createdAt, 'MMM d')}</span> },
    { key: 'actions', header: <span className="sr-only">{t('common.actions')}</span>, render: (l) => <RowMenu items={rowMenu(l)} /> },
  ];

  const empty = data && data.total === 0;
  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-head__eyebrow">{t('nav.crm')}</p>
          <h1 className="page-title">{t('leads.title')}</h1>
          <p className="page-subtitle">{t('leads.subtitle')}</p>
        </div>
        <div className="page-head__actions">
          <Button variant="primary" icon={Plus} to="/crm/leads/new">{t('leads.new')}</Button>
        </div>
      </div>
      <Card flush className="list-card">
        <ListToolbar
          search={<SearchInput value={list.q} onChange={list.setQ} placeholder={t('leads.search')} />}
          activeFilters={list.activeFilters}
          onClear={list.clear}
          filters={(
            <>
              <FilterSelect label={t('list.status')} value={status} onChange={(v) => list.setFilter('status', v)} options={LEAD_STATUSES.map((s) => ({ value: s, label: t(`leadStatus.${s}`) }))} />
              <FilterSelect label={t('list.source')} value={source} onChange={(v) => list.setFilter('source', v)} options={SOURCES.map((s) => ({ value: s, label: t(`sources.${s}`) }))} />
              <FilterSelect label={t('list.service')} value={service} onChange={(v) => list.setFilter('service', v)} options={SERVICES.map((s) => ({ value: s, label: t(`services.${s}`) }))} />
              <FilterSelect label={t('list.assignee')} value={assignee} onChange={(v) => list.setFilter('assignee', v)} options={users.map((u) => ({ value: u.id, label: u.name }))} />
            </>
          )}
          end={<ViewToggle value={list.view} onChange={list.setView} />}
        />
        <DataState
          error={error}
          onRetry={refetch}
          empty={empty}
          emptyIcon={UserPlus}
          emptyTitle={list.activeFilters ? t('list.noResults') : t('leads.emptyTitle')}
          emptyBody={list.activeFilters ? '' : t('leads.emptyBody')}
          emptyAction={list.activeFilters ? <Button size="sm" onClick={list.clear}>{t('list.clearFilters')}</Button> : <Button size="sm" variant="primary" to="/crm/leads/new">{t('leads.new')}</Button>}
        >
          {list.view === 'cards' ? (
            <div className="cards-grid">
              {loading && !data ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={150} radius={10} />) : data?.items.map((l) => (
                <a key={l.id} href={`/crm/leads/${l.id}`} className="record-card" onClick={(e) => { e.preventDefault(); navigate(`/crm/leads/${l.id}`); }}>
                  <div className="record-card__head">
                    <PersonCell name={l.name} sub={`${l.neighborhood} · ${t(`services.${l.serviceType}`)}`} />
                    <span style={{ marginLeft: 'auto' }}><Score value={l.score} /></span>
                  </div>
                  <p className="record-card__body">{l.description}</p>
                  <div className="record-card__foot">
                    <StatusBadge ns="leadStatus" value={l.status} tones={LEAD_STATUS_TONE} />
                    <span className="tnum" style={{ color: 'var(--text)', fontWeight: 600 }}>{money(l.budget)}</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <Table
              caption={t('leads.title')}
              columns={columns}
              rows={data?.items || []}
              loading={loading && !data}
              sort={list.sort}
              onSort={list.setSort}
              onRowClick={(l) => navigate(`/crm/leads/${l.id}`)}
              rowClassName={(l) => (navState?.highlight === l.id ? 'is-highlight' : undefined)}
            />
          )}
          {data && data.total > 0 && <Pagination page={list.page} pageSize={list.pageSize} total={data.total} onChange={list.setPage} />}
        </DataState>
      </Card>
    </>
  );
}
