import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, CircleDollarSign, Landmark, Scale } from 'lucide-react';
import ChartCard, { LegendItem } from '../../components/charts/ChartCard.jsx';
import HBarChart from '../../components/charts/HBarChart.jsx';
import RevenueExpensesChart from '../../components/charts/RevenueExpensesChart.jsx';
import { Card, DataState, Kpi, SegmentedControl, Skeleton, Table } from '../../components/ui/index.js';
import useResource from '../../hooks/useResource.js';
import useUrlState from '../../hooks/useUrlState.js';
import { useT } from '../../i18n/index.jsx';
import { date, money, moneyCompact, percent } from '../../lib/format.js';
import { financeService } from '../../services/index.js';
import { MarginValue } from '../projects/ProjectsPage.jsx';

const RANGES = ['thisMonth', 'quarter', 'ytd', 'last12'];

export default function ReportsPage() {
  const t = useT();
  const [range, setRange] = useUrlState('range', 'ytd');
  const { data, loading, error, refetch } = useResource(() => financeService.reports({ range }), [range]);
  const k = data?.kpis;
  const rangeLabel = t(`dashboard.ranges.${range}`);
  const annual = data && data.months.reduce((a, m) => ({ revenue: a.revenue + m.revenue, expenses: a.expenses + m.expenses }), { revenue: 0, expenses: 0 });

  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-head__eyebrow">{t('nav.finance')}</p>
          <h1 className="page-title">{t('nav.reports')}</h1>
          <p className="page-subtitle">{t('reports.subtitle')}</p>
        </div>
        <div className="page-head__actions">
          <SegmentedControl label={t('dashboard.range')} value={range} onChange={setRange} options={RANGES.map((r) => ({ value: r, label: t(`dashboard.ranges.${r}`) }))} />
        </div>
      </div>
      {error ? <Card><DataState error={error} onRetry={refetch} /></Card> : (
        <>
          <div className="summary-strip summary-strip--5">
            <Kpi loading={loading && !data} icon={ArrowDownLeft} label={t('reports.income')} value={money(k?.income)} meta={rangeLabel} />
            <Kpi loading={loading && !data} icon={ArrowUpRight} label={t('reports.expenses')} value={money(k?.expenses)} meta={rangeLabel} />
            <Kpi loading={loading && !data} icon={Scale} label={t('reports.net')} value={money(k?.net)} meta={t('reports.netHint')} metaTone={k?.net < 0 ? 'alert' : undefined} />
            <Kpi loading={loading && !data} icon={CircleDollarSign} label={t('reports.receivable')} value={money(k?.receivable)} meta={t('reports.receivableHint')} />
            <Kpi loading={loading && !data} icon={Landmark} label={t('reports.payable')} value={money(k?.payable)} meta={t('reports.payableHint')} />
          </div>

          <div className="grid grid-3 dash-section" style={{ marginTop: 0 }}>
            <ChartCard
              className="span-2"
              title={t('reports.monthly')}
              subtitle={t('reports.monthlySub')}
              legend={<><LegendItem color="var(--chart-1)">{t('reports.income')}</LegendItem><LegendItem color="var(--chart-2)">{t('reports.expenses')}</LegendItem></>}
              table={data && { columns: [
                { key: 'fullLabel', header: t('dashboard.charts.month') },
                { key: 'revenue', header: t('reports.income'), align: 'right', format: money },
                { key: 'expenses', header: t('reports.expenses'), align: 'right', format: money },
                { key: 'net', header: t('reports.net'), align: 'right', format: money },
              ], rows: data.months }}
            >
              {data ? <RevenueExpensesChart data={data.months} labels={{ revenue: t('reports.income'), expenses: t('reports.expenses') }} /> : <Skeleton height={260} />}
            </ChartCard>
            <ChartCard
              title={t('reports.aging')}
              subtitle={t('reports.agingSub')}
              table={data && { columns: [
                { key: 'bucket', header: t('reports.daysPastDue'), format: (b) => t(`reports.buckets.${b}`) },
                { key: 'count', header: t('nav.invoices'), align: 'right' },
                { key: 'amount', header: t('contacts.balance'), align: 'right', format: money },
              ], rows: data.aging }}
            >
              {data ? (
                <HBarChart ariaLabel={t('reports.aging')} format={moneyCompact} data={data.aging.map((a) => ({ key: a.bucket, label: t(`reports.buckets.${a.bucket}`), value: a.amount, meta: `${a.count}` }))} />
              ) : <Skeleton height={200} />}
            </ChartCard>
          </div>

          <div className="grid grid-3 dash-section">
            <Card flush className="list-card span-2" title={t('reports.profitability')} subtitle={t('reports.profitabilitySub')}>
              <Table
                caption={t('reports.profitability')}
                loading={!data}
                rows={data?.projects || []}
                columns={[
                  { key: 'name', header: t('projects.columns.project'), render: (p) => <Link to={`/projects/${p.id}?tab=finance`} style={{ fontWeight: 500 }}>{p.name}</Link> },
                  { key: 'contract', header: t('projects.form.contract'), align: 'right', hide: 'xxl', render: (p) => money(p.contract) },
                  { key: 'billed', header: t('projects.billed'), align: 'right', hide: 'lg', render: (p) => money(p.billed) },
                  { key: 'collected', header: t('projects.collected'), align: 'right', render: (p) => money(p.collected) },
                  { key: 'cost', header: t('reports.cost'), align: 'right', hide: 'md', render: (p) => money(p.cost) },
                  { key: 'profit', header: t('reports.profit'), align: 'right', render: (p) => <span style={{ color: p.profit < 0 ? 'var(--danger)' : undefined, fontWeight: 500 }}>{money(p.profit)}</span> },
                  { key: 'margin', header: t('reports.margin'), align: 'right', hide: 'md', render: (p) => <MarginValue value={p.margin} /> },
                ]}
              />
            </Card>
            <div className="stack">
              <Card title={t('reports.annual')} subtitle={t('reports.annualSub')}>
                {annual ? (
                  <dl className="totals">
                    <div><dt>{t('reports.income')}</dt><dd>{money(annual.revenue)}</dd></div>
                    <div><dt>{t('reports.expenses')}</dt><dd>−{money(annual.expenses)}</dd></div>
                    <div className="totals__grand"><dt>{t('reports.net')}</dt><dd>{money(Math.round((annual.revenue - annual.expenses) * 100) / 100)}</dd></div>
                    <div><dt>{t('reports.netMargin')}</dt><dd>{percent(annual.revenue ? (annual.revenue - annual.expenses) / annual.revenue : null)}</dd></div>
                  </dl>
                ) : <Skeleton height={120} />}
              </Card>
              <Card title={t('reports.recentPayments')} flush>
                <ul className="list">
                  {data?.recentPayments.map((p) => (
                    <li key={p.id}>
                      <Link className="list-item" to={`/finance/invoices/${p.invoiceId}`}>
                        <CircleDollarSign size={18} style={{ color: 'var(--success)' }} aria-hidden="true" />
                        <div className="list-item__main">
                          <p className="list-item__title">{p.client?.name ?? '—'}</p>
                          <p className="list-item__meta">{p.number} · {date(p.date, 'MMM d')} · {t(`payment.methods.${p.method}`)}</p>
                        </div>
                        <span className="list-item__aside tnum" style={{ color: 'var(--text)', fontWeight: 600 }}>{money(p.amount)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  );
}
