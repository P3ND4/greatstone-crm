import ChannelBadge from '../../components/comms/ChannelBadge.jsx';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle, Building2, CalendarDays, Check, CircleDollarSign, Clock, FileText, Gauge, HandCoins,
  Mail, MessageCircle, Receipt, ShoppingCart, TrendingUp, UserPlus,
} from 'lucide-react';
import ChartCard, { LegendItem } from '../../components/charts/ChartCard.jsx';
import HBarChart from '../../components/charts/HBarChart.jsx';
import RevenueExpensesChart from '../../components/charts/RevenueExpensesChart.jsx';
import { Avatar, Badge, Card, DataState, Kpi, SegmentedControl, Skeleton, SkeletonList } from '../../components/ui/index.js';
import { useQuickActions } from '../../components/quick/QuickActionsProvider.jsx';
import { useT } from '../../i18n/index.jsx';
import useResource from '../../hooks/useResource.js';
import useUrlState from '../../hooks/useUrlState.js';
import { ago, date, dayLabel, money, moneyCompact, number, percent, time } from '../../lib/format.js';
import { dashboardService, tasksService } from '../../services/index.js';
import { DASHBOARD_RANGES } from '../../services/dashboardService.js';
import cx from '../../lib/cx.js';


export default function DashboardPage() {
  const t = useT();
  const quick = useQuickActions();
  const [range, setRange] = useUrlState('range', 'thisMonth');
  const { data, loading, error, refetch } = useResource(() => dashboardService.getSummary({ range }), [range]);
  const k = data?.kpis;
  const rangeLabel = t(`dashboard.ranges.${range}`);

  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-head__eyebrow">{t('app.org')}</p>
          <h1 className="page-title">{t('dashboard.title')}</h1>
          <p className="page-subtitle">{t('dashboard.subtitle', { range: rangeLabel.toLowerCase() })}</p>
        </div>
        <div className="page-head__actions">
          <SegmentedControl
            label={t('dashboard.range')}
            value={range}
            onChange={setRange}
            options={DASHBOARD_RANGES.map((r) => ({ value: r, label: t(`dashboard.ranges.${r}`) }))}
          />
        </div>
      </div>

      {error ? (
        <Card><DataState error={error} onRetry={refetch} /></Card>
      ) : (
        <>
          {/* ---------------- KPIs ---------------- */}
          <section aria-label="Key metrics" className="dash-kpis">
            <Kpi loading={loading} icon={CircleDollarSign} label={t('dashboard.kpi.revenue')} value={money(k?.revenue)} meta={rangeLabel} />
            <Kpi loading={loading} icon={TrendingUp} label={t('dashboard.kpi.revenueYtd')} value={money(k?.revenueYtd)} meta={t('dashboard.ranges.ytd')} />
            <Kpi loading={loading} icon={Receipt} label={t('dashboard.kpi.pendingInvoices')} value={money(k?.outstanding.amount)} meta={k && t('dashboard.kpi.countSuffix', { n: k.outstanding.count })} />
            <Kpi
              loading={loading}
              icon={AlertCircle}
              label={t('dashboard.kpi.overdueInvoices')}
              value={money(k?.overdue.amount)}
              meta={k && t('dashboard.kpi.countSuffix', { n: k.overdue.count })}
              metaTone={k?.overdue.count ? 'alert' : undefined}
            />
            <Kpi loading={loading} icon={FileText} label={t('dashboard.kpi.openEstimates')} value={money(k?.openEstimates.amount)} meta={k && t('dashboard.kpi.estimatesSuffix', { n: k.openEstimates.count })} />
            <Kpi loading={loading} icon={Building2} label={t('dashboard.kpi.activeProjects')} value={number(k?.activeProjects)} />
            <Kpi loading={loading} icon={UserPlus} label={t('dashboard.kpi.newLeads')} value={number(k?.newLeads)} meta={rangeLabel} />
            <Kpi
              loading={loading}
              icon={Gauge}
              label={t('dashboard.kpi.conversion')}
              value={percent(k?.conversion?.rate)}
              meta={k?.conversion ? t('dashboard.kpi.wonOf', { won: k.conversion.won, total: k.conversion.total }) : rangeLabel}
            />
            <Kpi loading={loading} icon={HandCoins} label={t('dashboard.kpi.pipelineValue')} value={money(k?.pipeline.amount)} meta={k && t('dashboard.kpi.openOpps', { n: k.pipeline.count })} />
            <Kpi loading={loading} icon={ShoppingCart} label={t('dashboard.kpi.totalSpend')} value={money(k?.spend)} meta={rangeLabel} />
          </section>

          {/* ---------------- Charts row 1 ---------------- */}
          <div className="grid grid-3 dash-section">
            <ChartCard
              className="span-2"
              title={t('dashboard.charts.revenueVsExpenses')}
              subtitle={t('dashboard.charts.revenueVsExpensesSub')}
              legend={<><LegendItem color="var(--chart-1)">{t('dashboard.charts.revenue')}</LegendItem><LegendItem color="var(--chart-2)">{t('dashboard.charts.expenses')}</LegendItem></>}
              table={data && {
                columns: [
                  { key: 'fullLabel', header: t('dashboard.charts.month') },
                  { key: 'revenue', header: t('dashboard.charts.revenue'), align: 'right', format: money },
                  { key: 'expenses', header: t('dashboard.charts.expenses'), align: 'right', format: money },
                ],
                rows: data.charts.monthly,
              }}
            >
              {loading ? <Skeleton height={260} /> : <RevenueExpensesChart data={data.charts.monthly} labels={{ revenue: t('dashboard.charts.revenue'), expenses: t('dashboard.charts.expenses') }} />}
            </ChartCard>

            <ChartCard
              title={t('dashboard.charts.funnel')}
              subtitle={t('dashboard.charts.funnelSub')}
              table={data && {
                columns: [
                  { key: 'stage', header: t('dashboard.charts.stage'), format: (s) => t(`stages.${s}`) },
                  { key: 'count', header: t('dashboard.charts.deals'), align: 'right' },
                  { key: 'value', header: t('dashboard.charts.value'), align: 'right', format: money },
                ],
                rows: data.charts.funnel,
              }}
            >
              {loading ? <Skeleton height={200} /> : (
                <HBarChart
                  ariaLabel={t('dashboard.charts.funnel')}
                  format={moneyCompact}
                  data={data.charts.funnel.map((f) => ({ key: f.stage, label: t(`stages.${f.stage}`), value: f.value, meta: `${f.count}` }))}
                />
              )}
            </ChartCard>
          </div>

          {/* ---------------- Charts row 2 ---------------- */}
          <div className="grid grid-3 dash-section">
            <ChartCard
              title={t('dashboard.charts.leadsBySource')}
              subtitle={rangeLabel}
              table={data && {
                columns: [
                  { key: 'source', header: t('dashboard.charts.source'), format: (s) => t(`sources.${s}`) },
                  { key: 'count', header: t('dashboard.charts.leads'), align: 'right' },
                ],
                rows: data.charts.leadsBySource,
              }}
            >
              <DataState loading={loading} skeleton={<Skeleton height={180} />} empty={data && !data.charts.leadsBySource.length} compact emptyIcon={UserPlus}>
                {data && (
                  <HBarChart
                    ariaLabel={t('dashboard.charts.leadsBySource')}
                    data={data.charts.leadsBySource.map((s) => ({ key: s.source, label: t(`sources.${s.source}`), value: s.count }))}
                  />
                )}
              </DataState>
            </ChartCard>

            <ChartCard
              title={t('dashboard.charts.projectsByStatus')}
              subtitle={t('dashboard.charts.projectsByStatusSub')}
              table={data && {
                columns: [
                  { key: 'status', header: t('dashboard.charts.status'), format: (s) => t(`projectStatus.${s}`) },
                  { key: 'count', header: t('dashboard.charts.projects'), align: 'right' },
                ],
                rows: data.charts.projectsByStatus,
              }}
            >
              {loading ? <Skeleton height={200} /> : (
                <HBarChart
                  ariaLabel={t('dashboard.charts.projectsByStatus')}
                  data={data.charts.projectsByStatus.map((s) => ({ key: s.status, label: t(`projectStatus.${s.status}`), value: s.count }))}
                />
              )}
            </ChartCard>

            <Card title={t('dashboard.lists.approvals')} flush actions={data && <Badge tone={data.lists.approvals.length ? 'warning' : 'neutral'}>{data.lists.approvals.length}</Badge>}>
              <DataState loading={loading} skeleton={<SkeletonList rows={4} />} empty={data && !data.lists.approvals.length} emptyTitle={t('dashboard.lists.noApprovals')} emptyBody="" compact emptyIcon={Check}>
                <ul className="list">
                  {data?.lists.approvals.map((a) => (
                    <li key={a.id}>
                      <Link className="list-item" to={a.projectId ? `/projects/${a.projectId}` : '/finance/expenses'}>
                        <Badge tone="accent">{t(`approvals.${a.kind}`)}</Badge>
                        <div className="list-item__main">
                          <p className="list-item__title">{a.label}</p>
                          <p className="list-item__meta">{a.projectName ?? t('common.none')} · {date(a.requestedAt, 'MMM d')}</p>
                        </div>
                        <span className="list-item__aside tnum" style={{ color: 'var(--text)', fontWeight: 600 }}>{money(a.amount)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </DataState>
            </Card>
          </div>

          {/* ---------------- Lists ---------------- */}
          <div className="grid grid-3 dash-section">
            <Card title={t('dashboard.lists.appointments')} subtitle={t('dashboard.lists.next7')} flush actions={<Link to="/crm/agenda" className="caps">{t('common.viewAll')}</Link>}>
              <DataState loading={loading} skeleton={<SkeletonList rows={5} />} empty={data && !data.lists.appointments.length} emptyTitle={t('dashboard.lists.noAppointments')} emptyBody="" compact emptyIcon={CalendarDays}>
                <ul className="list">
                  {data?.lists.appointments.map((a) => (
                    <li key={a.id}>
                      <Link className="list-item" to={`/crm/agenda?date=${a.start.slice(0, 10)}`}>
                        <span className="date-chip" aria-hidden="true">
                          <span className="date-chip__m">{date(a.start, 'MMM')}</span>
                          <span className="date-chip__d">{date(a.start, 'd')}</span>
                        </span>
                        <div className="list-item__main">
                          <p className="list-item__title">{a.title}</p>
                          <p className="list-item__meta">{dayLabel(a.start)} · {time(a.start)} · {t(`appointmentTypes.${a.type}`)}</p>
                        </div>
                        <Avatar name={a.assigneeName} size="sm" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </DataState>
            </Card>

            <TodayTasks loading={loading} tasks={data?.lists.tasks} onNew={() => quick.open('task')} />

            <Card title={t('dashboard.lists.unanswered')} flush actions={<Link to="/crm/communications" className="caps">{t('common.viewAll')}</Link>}>
              <DataState loading={loading} skeleton={<SkeletonList rows={5} />} empty={data && !data.lists.unanswered.length} emptyTitle={t('dashboard.lists.noUnanswered')} emptyBody="" compact emptyIcon={MessageCircle}>
                <ul className="list">
                  {data?.lists.unanswered.map((c) => (
                    <li key={c.id}>
                      <Link className="list-item" to={`/crm/communications/${c.channel}?c=${c.id}`}>
                        <Avatar name={c.contactName} />
                        <div className="list-item__main">
                          <p className="list-item__title">{c.contactName}</p>
                          <p className="list-item__meta">{c.subject || c.lastMessage}</p>
                        </div>
                        <span className="list-item__aside stack-sm" style={{ alignItems: 'flex-end', gap: 4 }}>
                          <ChannelBadge channel={c.channel} />
                          <span className="row" style={{ gap: 4 }}><Clock size={12} aria-hidden="true" />{ago(c.lastMessageAt)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </DataState>
            </Card>
          </div>

          {/* ---------------- Project health ---------------- */}
          <div className="grid grid-3 dash-section">
            <Card
              className="span-2"
              title={t('dashboard.health.title')}
              subtitle={t('dashboard.health.sub')}
              flush
              footer={<Link to="/projects" className="caps">{t('common.viewAll')} ({data?.health.length ?? '—'})</Link>}
              actions={(
                <div className="chart-legend">
                  <LegendItem color="var(--chart-1)">{t('dashboard.health.legendProgress')}</LegendItem>
                  <LegendItem color="var(--chart-2)">{t('dashboard.health.legendBudget')}</LegendItem>
                </div>
              )}
            >
              <DataState loading={loading} skeleton={<SkeletonList rows={5} />} empty={data && !data.health.length}>
                <div className="health">
                  {data?.health.slice(0, 8).map((h) => {
                    const over = h.budgetUsed > 1;
                    return (
                      <Link key={h.id} to={`/projects/${h.id}`} className="health__row">
                        <div className="health__head">
                          <span className="health__name">{h.name}</span>
                          <span className="health__money">{money(h.spent)} / {money(h.budget)}</span>
                        </div>
                        <div className="health__bars">
                          <div className="health__bar">
                            <span>{t('dashboard.health.progress')}</span>
                            <span className="health__track"><span className="health__fill health__fill--progress" style={{ width: `${Math.min(h.progress, 1) * 100}%` }} /></span>
                            <span className="health__pct">{percent(h.progress)}</span>
                          </div>
                          <div className="health__bar">
                            <span>{t('dashboard.health.budgetUsed')}</span>
                            <span className="health__track"><span className={cx('health__fill', over ? 'health__fill--over' : 'health__fill--budget')} style={{ width: `${Math.min(h.budgetUsed, 1) * 100}%` }} /></span>
                            <span className="health__pct" style={over ? { color: 'var(--danger)', fontWeight: 600 } : undefined}>{percent(h.budgetUsed)}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </DataState>
            </Card>

            <Card title={t('dashboard.lists.budgetRisk')} flush actions={data && <Badge tone={data.lists.budgetRisk.length ? 'danger' : 'success'}>{data.lists.budgetRisk.length}</Badge>}>
              <DataState loading={loading} skeleton={<SkeletonList rows={3} />} empty={data && !data.lists.budgetRisk.length} emptyTitle={t('dashboard.lists.noBudgetRisk')} emptyBody="" compact emptyIcon={Check}>
                <ul className="list">
                  {data?.lists.budgetRisk.map((p) => (
                    <li key={p.id}>
                      <Link className="list-item" to={`/projects/${p.id}`}>
                        <span className="empty__icon" style={{ width: 32, height: 32, margin: 0, background: 'var(--danger-soft)', color: 'var(--danger)' }} aria-hidden="true"><AlertCircle size={16} /></span>
                        <div className="list-item__main">
                          <p className="list-item__title">{p.name}</p>
                          <p className="list-item__meta">{t('dashboard.lists.overBy', { pct: percent(p.budgetUsed), progress: percent(p.progress) })}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </DataState>
            </Card>
          </div>
        </>
      )}
    </>
  );
}

function TodayTasks({ loading, tasks, onNew }) {
  const t = useT();
  const [done, setDone] = useState({});
  const isDone = (task) => done[task.id] ?? task.done;
  const toggle = (task) => {
    const next = !isDone(task);
    setDone((d) => ({ ...d, [task.id]: next }));
    tasksService.update(task.id, { done: next });
  };
  return (
    <Card title={t('dashboard.lists.tasks')} flush actions={<button type="button" className="chart-table-toggle caps" onClick={onNew}>+ {t('quick.task')}</button>}>
      <DataState loading={loading} skeleton={<SkeletonList rows={5} />} empty={tasks && !tasks.length} emptyTitle={t('dashboard.lists.noTasks')} emptyBody="" compact emptyIcon={Check}>
        <ul className="list">
          {tasks?.map((task) => (
            <li key={task.id}>
              <button type="button" className={cx('list-item', isDone(task) && 'is-done')} onClick={() => toggle(task)} aria-pressed={isDone(task)}>
                <span className={cx('check', isDone(task) && 'is-on')} aria-hidden="true">{isDone(task) && <Check />}</span>
                <div className="list-item__main">
                  <p className="list-item__title">{task.title}</p>
                  <p className="list-item__meta">{task.projectName} · {task.assigneeName}</p>
                </div>
                <span className={`prio prio--${task.priority}`} title={t(`task.priorities.${task.priority}`)} aria-label={t(`task.priorities.${task.priority}`)} />
              </button>
            </li>
          ))}
        </ul>
      </DataState>
    </Card>
  );
}
