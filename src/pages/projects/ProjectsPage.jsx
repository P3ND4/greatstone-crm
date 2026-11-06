import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Building2, CalendarPlus, CheckSquare, Eye, HandCoins, MapPin, Pencil, Plus, Wallet } from 'lucide-react';
import ProgressBar from '../../components/crm/ProgressBar.jsx';
import { PersonCell, PROJECT_TONE, RowMenu, UserChip } from '../../components/crm/bits.jsx';
import ListToolbar, { FilterSelect, SearchInput, ViewToggle } from '../../components/list/ListToolbar.jsx';
import { useQuickActions } from '../../components/quick/QuickActionsProvider.jsx';
import { Badge, Button, Card, DataState, Kpi, Pagination, Skeleton, Table } from '../../components/ui/index.js';
import { NEIGHBORHOODS } from '../../data/constants.js';
import useListState from '../../hooks/useListState.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { date, money, number, percent } from '../../lib/format.js';
import { lookupService, projectsService } from '../../services/index.js';

export const PROJECT_STATUSES = ['planning', 'design', 'permits', 'construction', 'finishing', 'completed', 'onHold'];

export function MarginValue({ value }) {
  if (value == null) return <span className="subtle">—</span>;
  const tone = value < 0.1 ? 'var(--danger)' : value < 0.18 ? 'var(--warning)' : 'var(--success)';
  return <span className="tnum" style={{ color: tone, fontWeight: 600 }}>{percent(value)}</span>;
}

export function ProjectCover({ project, small }) {
  return (
    <span className={`cover cover--${project.cover % 6}${small ? ' cover--sm' : ''}`} aria-hidden="true">
      <Building2 />
      {!small && <span className="cover__label">{project.neighborhood}</span>}
    </span>
  );
}

export default function ProjectsPage() {
  const t = useT();
  const navigate = useNavigate();
  const quick = useQuickActions();
  const list = useListState({ sort: 'startDate:desc', view: 'table', pageSize: 12, filters: ['status', 'manager', 'hood'] });
  const { status, manager, hood } = list.filters;
  const users = lookupService.users();

  const { data, loading, error, refetch } = useResource(
    () => projectsService.list({ q: list.q, status, managerId: manager, neighborhood: hood, page: list.page, pageSize: list.pageSize, sort: list.sort }),
    [list.q, status, manager, hood, list.page, list.sort],
  );
  const tot = data?.totals;

  const menu = (p) => [
    { label: t('common.view'), icon: Eye, to: `/projects/${p.id}` },
    { label: t('common.edit'), icon: Pencil, to: `/projects/${p.id}/edit` },
    { label: t('quick.task'), icon: CheckSquare, onClick: () => quick.open('task', { projectId: p.id }) },
    { label: t('quick.appointment'), icon: CalendarPlus, onClick: () => quick.open('appointment', { projectId: p.id, contactId: p.clientId }) },
  ];

  const columns = [
    {
      key: 'name', header: t('projects.columns.project'), sortable: true,
      render: (p) => (
        <span className="cell-person">
          <ProjectCover project={p} small />
          <span style={{ minWidth: 0 }}>
            <span className="cell-person__name" style={{ display: 'block' }}>{p.name}</span>
            <span className="cell-person__sub" style={{ display: 'block' }}>{p.address || p.neighborhood}</span>
          </span>
        </span>
      ),
    },
    { key: 'client', header: t('projects.columns.client'), sortable: true, hide: 'xxl', render: (p) => <PersonCell name={p.client?.name} /> },
    { key: 'status', header: t('list.status'), render: (p) => <Badge tone={PROJECT_TONE[p.status]} dot>{t(`projectStatus.${p.status}`)}</Badge> },
    { key: 'startDate', header: t('projects.columns.dates'), sortable: true, hide: '3xl', render: (p) => <span className="tnum muted" style={{ whiteSpace: 'nowrap' }}>{date(p.startDate, 'MMM d')} – {date(p.endDate, 'MMM d, yy')}</span> },
    { key: 'budget', header: t('contacts.budget'), align: 'right', sortable: true, render: (p) => money(p.budget) },
    { key: 'spent', header: t('projects.columns.spent'), align: 'right', sortable: true, hide: 'lg', render: (p) => money(p.spent) },
    { key: 'progress', header: t('dashboard.health.progress'), sortable: true, hide: 'md', render: (p) => <ProgressBar value={p.progress} label={t('dashboard.health.progress')} /> },
    { key: 'projectedMargin', header: t('projects.columns.margin'), align: 'right', sortable: true, hide: 'lg', render: (p) => <MarginValue value={p.projectedMargin} /> },
    { key: 'managerId', header: t('projects.columns.manager'), hide: '3xl', render: (p) => <UserChip user={p.manager} /> },
    { key: 'actions', header: <span className="sr-only">{t('common.actions')}</span>, render: (p) => <RowMenu items={menu(p)} /> },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-head__eyebrow">{t('app.org')}</p>
          <h1 className="page-title">{t('nav.projects')}</h1>
          <p className="page-subtitle">{t('projects.subtitle')}</p>
        </div>
        <div className="page-head__actions">
          <Button variant="primary" icon={Plus} to="/projects/new">{t('projects.new')}</Button>
        </div>
      </div>

      <div className="summary-strip">
        <Kpi loading={!data} icon={Building2} label={t('projects.kpi.projects')} value={number(tot?.count)} meta={list.activeFilters ? t('projects.kpi.filtered') : t('projects.kpi.all')} />
        <Kpi loading={!data} icon={HandCoins} label={t('projects.kpi.contract')} value={money(tot?.contract)} />
        <Kpi loading={!data} icon={Wallet} label={t('projects.kpi.spent')} value={money(tot?.spent)} meta={tot && t('projects.kpi.ofBudget', { pct: percent(tot.budget ? tot.spent / tot.budget : null), budget: money(tot.budget) })} />
        <Kpi loading={!data} icon={AlertTriangle} label={t('projects.kpi.atRisk')} value={number(tot?.atRisk)} metaTone={tot?.atRisk ? 'alert' : undefined} meta={t('projects.kpi.atRiskHint')} />
      </div>

      <Card flush className="list-card">
        <ListToolbar
          search={<SearchInput value={list.q} onChange={list.setQ} placeholder={t('projects.search')} />}
          activeFilters={list.activeFilters}
          onClear={list.clear}
          filters={(
            <>
              <FilterSelect label={t('list.status')} value={status} onChange={(v) => list.setFilter('status', v)} options={[{ value: 'active', label: t('projects.activeOnly') }, ...PROJECT_STATUSES.map((s) => ({ value: s, label: t(`projectStatus.${s}`) }))]} />
              <FilterSelect label={t('projects.columns.manager')} value={manager} onChange={(v) => list.setFilter('manager', v)} options={users.map((u) => ({ value: u.id, label: u.name }))} />
              <FilterSelect label={t('leads.fields.neighborhood')} value={hood} onChange={(v) => list.setFilter('hood', v)} options={NEIGHBORHOODS.map((n) => ({ value: n, label: n }))} />
            </>
          )}
          end={<ViewToggle value={list.view} onChange={list.setView} />}
        />
        <DataState
          error={error}
          onRetry={refetch}
          empty={data && !data.total}
          emptyIcon={Building2}
          emptyTitle={list.activeFilters ? t('list.noResults') : t('projects.emptyTitle')}
          emptyBody=""
          emptyAction={list.activeFilters ? <Button size="sm" onClick={list.clear}>{t('list.clearFilters')}</Button> : <Button size="sm" variant="primary" to="/projects/new">{t('projects.new')}</Button>}
        >
          {list.view === 'cards' ? (
            <div className="cards-grid cards-grid--projects">
              {loading && !data ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={260} radius={10} />) : data?.items.map((p) => (
                <a key={p.id} href={`/projects/${p.id}`} className="record-card project-card" onClick={(e) => { e.preventDefault(); navigate(`/projects/${p.id}`); }}>
                  <ProjectCover project={p} />
                  <div className="row-between" style={{ alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <p className="record-card__title">{p.name}</p>
                      <p className="record-card__sub"><MapPin size={12} style={{ display: 'inline', verticalAlign: -1 }} aria-hidden="true" /> {p.address || p.neighborhood} · {p.client?.name}</p>
                    </div>
                    <Badge tone={PROJECT_TONE[p.status]} dot>{t(`projectStatus.${p.status}`)}</Badge>
                  </div>
                  <div className="stack-sm" style={{ gap: 6 }}>
                    <div className="project-card__bar"><span>{t('dashboard.health.progress')}</span><ProgressBar value={p.progress} /></div>
                    <div className="project-card__bar"><span>{t('dashboard.health.budgetUsed')}</span><ProgressBar value={p.budgetUsed} tone="budget" /></div>
                  </div>
                  <div className="record-card__foot">
                    <span className="tnum">{money(p.spent)} / {money(p.budget)}</span>
                    <span>{t('projects.columns.margin')}: <MarginValue value={p.projectedMargin} /></span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <Table caption={t('nav.projects')} columns={columns} rows={data?.items || []} loading={loading && !data} sort={list.sort} onSort={list.setSort} onRowClick={(p) => navigate(`/projects/${p.id}`)} />
          )}
          {data && data.total > 0 && <Pagination page={list.page} pageSize={list.pageSize} total={data.total} onChange={list.setPage} />}
        </DataState>
      </Card>
    </>
  );
}
