import { Receipt } from 'lucide-react';
import ProgressBar from '../../../components/crm/ProgressBar.jsx';
import { Badge, Card, EmptyState, Table } from '../../../components/ui/index.js';
import { useT } from '../../../i18n/index.jsx';
import { date, money } from '../../../lib/format.js';
import BudgetBreakdown from './BudgetBreakdown.jsx';

export default function BudgetTab({ d }) {
  const t = useT();
  const lines = d.budgetLines;
  const totals = lines.reduce((a, l) => ({ budget: a.budget + l.budget, actual: a.actual + l.actual }), { budget: 0, actual: 0 });
  const rows = [...lines, { category: '__total', ...totals }];
  return (
    <div className="stack">
      <div className="grid grid-3" style={{ alignItems: 'start' }}>
        <Card flush className="list-card span-2" title={t('projects.budgetByCategory')}>
          <Table
            caption={t('projects.budgetByCategory')}
            rows={rows}
            rowKey="category"
            rowClassName={(l) => (l.category === '__total' ? 'is-total' : undefined)}
            columns={[
              { key: 'category', header: t('contacts.category'), render: (l) => (l.category === '__total' ? <strong>{t('contacts.total')}</strong> : t(`budgetCategories.${l.category}`)) },
              { key: 'budget', header: t('projects.form.budget'), align: 'right', render: (l) => money(l.budget) },
              { key: 'actual', header: t('projects.actual'), align: 'right', render: (l) => money(l.actual) },
              { key: 'variance', header: t('projects.variance'), align: 'right', render: (l) => { const v = l.budget - l.actual; return <span style={{ color: v < 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 500 }}>{v < 0 ? '−' : '+'}{money(Math.abs(v))}</span>; } },
              { key: 'used', header: t('dashboard.health.budgetUsed'), hide: 'md', render: (l) => <ProgressBar value={l.budget ? l.actual / l.budget : null} tone="budget" /> },
            ]}
          />
        </Card>
        <Card title={t('projects.budgetVsActual')}><BudgetBreakdown lines={lines} /></Card>
      </div>
      <Card flush className="list-card" title={t('projects.expenses')} subtitle={t('projects.expensesSub', { n: d.expenses.length })}>
        {d.expenses.length ? (
          <Table
            caption={t('projects.expenses')}
            rows={d.expenses}
            columns={[
              { key: 'date', header: t('appointment.date'), render: (e) => <span className="tnum">{date(e.date)}</span> },
              { key: 'vendor', header: t('projects.sel.vendor'), render: (e) => e.vendor?.company || e.vendor?.name },
              { key: 'category', header: t('contacts.category'), hide: 'md', render: (e) => t(`expenseCategories.${e.category}`) },
              { key: 'type', header: t('list.type'), hide: 'lg', render: (e) => <Badge>{e.type === 'po' ? 'PO' : t('contacts.expense')}</Badge> },
              { key: 'status', header: t('list.status'), render: (e) => <Badge tone={e.status === 'approved' ? 'success' : 'warning'} dot>{t(`approvalStatus.${e.status}`)}</Badge> },
              { key: 'amount', header: t('contacts.total'), align: 'right', render: (e) => money(e.amount) },
            ]}
          />
        ) : <EmptyState icon={Receipt} title={t('contacts.noExpenses')} />}
      </Card>
    </div>
  );
}
