import { useEffect, useState } from 'react';
import { Check, Clock, FileText, Paperclip, Plus, ShoppingCart, Wallet, X } from 'lucide-react';
import ListToolbar, { FilterSelect, SearchInput } from '../../components/list/ListToolbar.jsx';
import { EXPENSE_CATEGORIES } from '../../components/quick/ExpenseModal.jsx';
import { useQuickActions } from '../../components/quick/QuickActionsProvider.jsx';
import { ModalShell } from '../../components/shells/index.js';
import { Badge, Button, Card, DataState, IconButton, Kpi, Pagination, Table, useToast } from '../../components/ui/index.js';
import useListState from '../../hooks/useListState.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { date, money, number } from '../../lib/format.js';
import { financeService, lookupService } from '../../services/index.js';

const STATUS_TONE = { pending: 'warning', approved: 'success', rejected: 'danger' };

export default function ExpensesPage() {
  const t = useT();
  const toast = useToast();
  const quick = useQuickActions();
  const list = useListState({ sort: 'date:desc', filters: ['type', 'status', 'category', 'project'] });
  const { type, status, category, project } = list.filters;
  const [selected, setSelected] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const { data, loading, error, refetch } = useResource(
    () => financeService.expenses({ q: list.q, type, status, category, projectId: project, page: list.page, pageSize: list.pageSize, sort: list.sort }),
    [list.q, type, status, category, project, list.page, list.sort],
  );
  useEffect(() => { setSelected([]); }, [data]);
  const s = data?.summary;
  const rows = data?.items || [];
  const pendingIds = rows.filter((e) => e.status === 'pending').map((e) => e.id);

  const decide = async (ids, st) => {
    await financeService.setExpenseStatus(ids, st);
    toast.show(t(st === 'approved' ? 'expenses.approvedToast' : 'expenses.rejectedToast', { n: ids.length }));
    refetch();
  };

  const columns = [
    {
      key: 'select', header: <input type="checkbox" className="checkbox" aria-label={t('expenses.selectPending')} checked={pendingIds.length > 0 && pendingIds.every((id) => selected.includes(id))} onChange={(e) => setSelected(e.target.checked ? pendingIds : [])} disabled={!pendingIds.length} />,
      render: (e) => (e.status === 'pending' ? <input type="checkbox" className="checkbox" aria-label={t('expenses.selectRow', { id: e.id })} checked={selected.includes(e.id)} onChange={() => setSelected((sel) => (sel.includes(e.id) ? sel.filter((x) => x !== e.id) : [...sel, e.id]))} /> : null),
    },
    { key: 'date', header: t('appointment.date'), sortable: true, render: (e) => <span className="tnum">{date(e.date, 'MMM d, yyyy')}</span> },
    { key: 'vendor', header: t('projects.sel.vendor'), render: (e) => <span style={{ display: 'block', minWidth: 0 }}><strong style={{ fontWeight: 500 }}>{e.vendor?.company || e.vendor?.name}</strong><span className="muted" style={{ display: 'block', fontSize: 12 }}>{e.project?.name || t('expenseCategories.overhead')}</span></span> },
    { key: 'category', header: t('contacts.category'), hide: 'lg', render: (e) => t(`expenseCategories.${e.category}`) },
    { key: 'type', header: t('list.type'), hide: 'xl', render: (e) => <Badge>{e.type === 'po' ? t('expenses.po') : t('contacts.expense')}</Badge> },
    { key: 'receipt', header: t('expenses.receipt'), hide: 'xl', render: (e) => <IconButton icon={Paperclip} size="sm" label={t('expenses.viewReceipt', { id: e.id })} onClick={() => setReceipt(e)} /> },
    { key: 'status', header: t('list.status'), render: (e) => <Badge tone={STATUS_TONE[e.status]} dot>{t(`approvalStatus.${e.status}`)}</Badge> },
    { key: 'amount', header: t('payment.amount'), align: 'right', sortable: true, render: (e) => money(e.amount) },
    {
      key: 'decide', header: <span className="sr-only">{t('common.actions')}</span>,
      render: (e) => (e.status === 'pending' ? (
        <span className="row-actions">
          <IconButton icon={Check} size="sm" label={t('expenses.approve')} onClick={() => decide([e.id], 'approved')} />
          <IconButton icon={X} size="sm" label={t('expenses.reject')} onClick={() => decide([e.id], 'rejected')} />
        </span>
      ) : null),
    },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-head__eyebrow">{t('nav.finance')}</p>
          <h1 className="page-title">{t('nav.expenses')}</h1>
          <p className="page-subtitle">{t('expenses.subtitle')}</p>
        </div>
        <div className="page-head__actions">
          <Button variant="primary" icon={Plus} onClick={() => quick.open('expense', { onSaved: refetch })}>{t('expenses.new')}</Button>
        </div>
      </div>
      <div className="summary-strip">
        <Kpi loading={!s} icon={Wallet} label={t('expenses.thisMonth')} value={money(s?.month)} meta={t('expenses.excludesRejected')} />
        <Kpi loading={!s} icon={Clock} label={t('expenses.pending')} value={money(s?.pending.amount)} meta={s && t('expenses.records', { n: s.pending.count })} metaTone={s?.pending.count ? 'alert' : undefined} />
        <Kpi loading={!s} icon={ShoppingCart} label={t('expenses.openPOs')} value={money(s?.openPOs.amount)} meta={s && t('expenses.records', { n: s.openPOs.count })} />
        <Kpi loading={!s} icon={FileText} label={t('expenses.filteredTotal')} value={money(s?.filtered)} meta={s && t('expenses.records', { n: number(data.total) })} />
      </div>
      <Card flush className="list-card">
        <ListToolbar
          search={<SearchInput value={list.q} onChange={list.setQ} placeholder={t('expenses.search')} />}
          activeFilters={list.activeFilters}
          onClear={list.clear}
          filters={(
            <>
              <FilterSelect label={t('list.type')} value={type} onChange={(v) => list.setFilter('type', v)} options={[{ value: 'expense', label: t('contacts.expense') }, { value: 'po', label: t('expenses.po') }]} />
              <FilterSelect label={t('list.status')} value={status} onChange={(v) => list.setFilter('status', v)} options={['pending', 'approved', 'rejected'].map((x) => ({ value: x, label: t(`approvalStatus.${x}`) }))} />
              <FilterSelect label={t('contacts.category')} value={category} onChange={(v) => list.setFilter('category', v)} options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: t(`expenseCategories.${c}`) }))} />
              <FilterSelect label={t('finance.project')} value={project} onChange={(v) => list.setFilter('project', v)} options={[{ value: 'overhead', label: t('expenseCategories.overhead') }, ...lookupService.projectOptions()]} />
            </>
          )}
          end={selected.length > 0 && (
            <div className="row" role="toolbar" aria-label={t('comms.bulkActions')}>
              <span className="muted" style={{ fontSize: 13 }}>{t('comms.selected', { n: selected.length })}</span>
              <Button size="sm" icon={Check} onClick={() => decide(selected, 'approved')}>{t('expenses.approve')}</Button>
              <Button size="sm" icon={X} onClick={() => decide(selected, 'rejected')}>{t('expenses.reject')}</Button>
            </div>
          )}
        />
        <DataState error={error} onRetry={refetch} empty={data && !data.total} emptyIcon={ShoppingCart} emptyTitle={t('list.noResults')} emptyBody="">
          <Table caption={t('nav.expenses')} columns={columns} rows={rows} loading={loading && !data} sort={list.sort} onSort={list.setSort} />
          {data && data.total > 0 && <Pagination page={list.page} pageSize={list.pageSize} total={data.total} onChange={list.setPage} />}
        </DataState>
      </Card>

      <ModalShell open={Boolean(receipt)} onClose={() => setReceipt(null)} size="md">
        {({ titleId, requestClose }) => receipt && (
          <div className="form-shell">
            <header className="form-header">
              <div className="form-header__titles">
                <h2 className="form-title" id={titleId}>{t('expenses.receiptTitle', { vendor: receipt.vendor?.company || receipt.vendor?.name })}</h2>
                <p className="form-subtitle">{date(receipt.date)} · {money(receipt.amount)}</p>
              </div>
              <Button size="sm" onClick={requestClose}>{t('common.close')}</Button>
            </header>
            <div className="form-body"><div className="doc-preview" style={{ maxHeight: '50vh' }} aria-hidden="true"><Paperclip /><span>{receipt.receipt || t('projects.previewDemo')}</span></div></div>
          </div>
        )}
      </ModalShell>
    </>
  );
}
