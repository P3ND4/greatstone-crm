import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRightLeft, BellRing, CircleDollarSign, Clock, Copy, Eye, FileText, Pencil, Percent, Plus, Receipt, Send, Timer } from 'lucide-react';
import { ESTIMATE_TONE, INVOICE_TONE, PersonCell, RowMenu } from '../../components/crm/bits.jsx';
import ListToolbar, { FilterSelect, SearchInput } from '../../components/list/ListToolbar.jsx';
import { useQuickActions } from '../../components/quick/QuickActionsProvider.jsx';
import { Badge, Button, Card, DataState, Kpi, Pagination, Table, useToast } from '../../components/ui/index.js';
import useListState from '../../hooks/useListState.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { date, money, number, percent } from '../../lib/format.js';
import { estimatesApi, financeService, invoicesApi, lookupService } from '../../services/index.js';

export const STATUSES = {
  estimate: ['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'],
  invoice: ['draft', 'sent', 'partial', 'paid', 'overdue'],
};
export const API = { estimate: estimatesApi, invoice: invoicesApi };
export const TONE = { estimate: ESTIMATE_TONE, invoice: INVOICE_TONE };
export const BASE = { estimate: '/finance/estimates', invoice: '/finance/invoices' };

export default function DocsListPage({ kind }) {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const quick = useQuickActions();
  const isInvoice = kind === 'invoice';
  const api = API[kind];
  const base = BASE[kind];
  const list = useListState({ sort: isInvoice ? 'issuedAt:desc' : 'createdAt:desc', filters: ['status', 'project'] });
  const { status, project } = list.filters;
  const { data, loading, error, refetch } = useResource(() => api.list({ q: list.q, status, projectId: project, page: list.page, pageSize: list.pageSize, sort: list.sort }), [kind, list.q, status, project, list.page, list.sort]);
  const { data: sum, refetch: refetchSum } = useResource(() => api.summary(), [kind]);
  const reload = () => { refetch(); refetchSum(); };
  const ns = isInvoice ? 'invoiceStatus' : 'estimateStatus';

  const act = async (fn, msg) => { await fn(); toast.show(msg); reload(); };
  const menu = (d) => [
    { label: t('common.view'), icon: Eye, to: `${base}/${d.id}` },
    ...(d.status === 'draft' ? [{ label: t('common.edit'), icon: Pencil, to: `${base}/${d.id}/edit` }] : []),
    ...(d.status === 'draft' ? [{ label: t('finance.actions.send'), icon: Send, onClick: () => act(() => api.setStatus(d.id, 'sent'), t('finance.sentToast', { number: d.number })) }] : []),
    ...(isInvoice && ['sent', 'partial', 'overdue'].includes(d.status) ? [
      { label: t('payment.short'), icon: CircleDollarSign, onClick: () => quick.open('payment', { invoice: d, onSaved: reload }) },
      { label: t('finance.actions.remind'), icon: BellRing, onClick: () => act(() => financeService.sendReminder(d.id), t('finance.reminderToast', { number: d.number })) },
    ] : []),
    ...(!isInvoice && ['sent', 'viewed', 'accepted'].includes(d.status) ? [{
      label: t('finance.actions.convert'), icon: ArrowRightLeft,
      onClick: async () => { const inv = await financeService.convertToInvoice(d.id); toast.show(t('finance.convertedToast', { number: inv.number })); navigate(`/finance/invoices/${inv.id}/edit`); },
    }] : []),
    { label: t('finance.actions.duplicate'), icon: Copy, onClick: async () => { const draft = api.draft({ projectId: d.projectId, clientId: d.clientId }); const copy = await api.save({ ...draft, lines: d.lines.map((l, k) => ({ ...l, id: `ln_dup_${Date.now()}_${k}` })), terms: d.terms, notes: d.notes }); toast.show(t('finance.duplicatedToast', { number: copy.number })); navigate(`${base}/${copy.id}/edit`); } },
  ];

  const columns = [
    { key: 'number', header: '#', sortable: true, render: (d) => <span className="row tnum" style={{ fontWeight: 500 }}>{isInvoice ? <Receipt size={16} className="subtle" aria-hidden="true" /> : <FileText size={16} className="subtle" aria-hidden="true" />}{d.number}</span> },
    { key: 'client', header: t('projects.columns.client'), sortable: true, render: (d) => <PersonCell name={d.client?.name ?? '—'} sub={d.project?.name} /> },
    { key: isInvoice ? 'issuedAt' : 'createdAt', header: isInvoice ? t('contacts.issued') : t('finance.date'), sortable: true, hide: 'xl', render: (d) => <span className="tnum muted">{date(isInvoice ? d.issuedAt : d.createdAt, 'MMM d, yyyy')}</span> },
    {
      key: isInvoice ? 'dueAt' : 'expiresAt', header: isInvoice ? t('contacts.due') : t('finance.validUntil'), sortable: true, hide: 'lg',
      render: (d) => <span className="tnum" style={{ color: d.daysOverdue ? 'var(--danger)' : 'var(--text-muted)' }}>{date(isInvoice ? d.dueAt : d.expiresAt, 'MMM d, yyyy')}{d.daysOverdue ? ` · ${t('finance.daysLate', { n: d.daysOverdue })}` : ''}</span>,
    },
    { key: 'status', header: t('list.status'), render: (d) => <Badge tone={TONE[kind][d.status]} dot>{t(`${ns}.${d.status}`)}</Badge> },
    { key: 'total', header: t('contacts.total'), align: 'right', sortable: true, render: (d) => money(d.totals.total) },
    ...(isInvoice ? [{ key: 'balance', header: t('contacts.balance'), align: 'right', hide: 'md', render: (d) => <span style={{ fontWeight: d.balance > 0 ? 600 : 400 }}>{money(d.balance)}</span> }] : []),
    { key: 'actions', header: <span className="sr-only">{t('common.actions')}</span>, render: (d) => <RowMenu items={menu(d)} /> },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-head__eyebrow">{t('nav.finance')}</p>
          <h1 className="page-title">{t(isInvoice ? 'nav.invoices' : 'nav.estimates')}</h1>
          <p className="page-subtitle">{t(`finance.${kind}Subtitle`)}</p>
        </div>
        <div className="page-head__actions">
          <Button variant="primary" icon={Plus} to={`${base}/new`}>{t(`finance.new.${kind}`)}</Button>
        </div>
      </div>

      <div className="summary-strip">
        {isInvoice ? (
          <>
            <Kpi loading={!sum} icon={Receipt} label={t('dashboard.kpi.pendingInvoices')} value={money(sum?.outstanding.amount)} meta={sum && t('dashboard.kpi.countSuffix', { n: sum.outstanding.count })} />
            <Kpi loading={!sum} icon={AlertCircle} label={t('dashboard.kpi.overdueInvoices')} value={money(sum?.overdue.amount)} meta={sum && t('dashboard.kpi.countSuffix', { n: sum.overdue.count })} metaTone={sum?.overdue.count ? 'alert' : undefined} />
            <Kpi loading={!sum} icon={CircleDollarSign} label={t('finance.collectedMonth')} value={money(sum?.collectedMonth)} meta={t('dashboard.ranges.thisMonth')} />
            <Kpi loading={!sum} icon={Timer} label={t('finance.avgDaysToPay')} value={sum?.avgDaysToPay == null ? '—' : t('finance.days', { n: number(Math.round(sum.avgDaysToPay)) })} meta={t('finance.paidInvoices')} />
          </>
        ) : (
          <>
            <Kpi loading={!sum} icon={FileText} label={t('dashboard.kpi.openEstimates')} value={money(sum?.open.amount)} meta={sum && t('dashboard.kpi.estimatesSuffix', { n: sum.open.count })} />
            <Kpi loading={!sum} icon={CircleDollarSign} label={t('finance.acceptedValue')} value={money(sum?.accepted.amount)} meta={sum && t('dashboard.kpi.estimatesSuffix', { n: sum.accepted.count })} />
            <Kpi loading={!sum} icon={Percent} label={t('finance.acceptRate')} value={percent(sum?.acceptRate)} meta={t('finance.acceptRateHint')} />
            <Kpi loading={!sum} icon={Clock} label={t('finance.expiringSoon')} value={number(sum?.expiringSoon)} meta={t('finance.next7')} metaTone={sum?.expiringSoon ? 'alert' : undefined} />
          </>
        )}
      </div>

      <Card flush className="list-card">
        <ListToolbar
          search={<SearchInput value={list.q} onChange={list.setQ} placeholder={t('finance.search')} />}
          activeFilters={list.activeFilters}
          onClear={list.clear}
          filters={(
            <>
              <FilterSelect label={t('list.status')} value={status} onChange={(v) => list.setFilter('status', v)} options={[{ value: 'open', label: t('finance.openOnly') }, ...STATUSES[kind].map((s) => ({ value: s, label: t(`${ns}.${s}`) }))]} />
              <FilterSelect label={t('finance.project')} value={project} onChange={(v) => list.setFilter('project', v)} options={lookupService.projectOptions()} />
            </>
          )}
        />
        <DataState error={error} onRetry={refetch} empty={data && !data.total} emptyIcon={isInvoice ? Receipt : FileText} emptyTitle={t('list.noResults')} emptyBody="">
          <Table caption={t(isInvoice ? 'nav.invoices' : 'nav.estimates')} columns={columns} rows={data?.items || []} loading={loading && !data} sort={list.sort} onSort={list.setSort} onRowClick={(d) => navigate(`${base}/${d.id}`)} />
          {data && data.total > 0 && <Pagination page={list.page} pageSize={list.pageSize} total={data.total} onChange={list.setPage} />}
        </DataState>
      </Card>
    </>
  );
}
