import { Link } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';
import AiModuleShell from '../../components/ai/AiModuleShell.jsx';
import ChartCard from '../../components/charts/ChartCard.jsx';
import HBarChart from '../../components/charts/HBarChart.jsx';
import { Avatar, Card, DataState, Skeleton } from '../../components/ui/index.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { money, moneyCompact, percent } from '../../lib/format.js';
import { aiService } from '../../services/index.js';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PatternsPage() {
  const t = useT();
  const { data, loading, error, refetch } = useResource(() => aiService.patterns(), []);
  return (
    <AiModuleShell module="patterns" titleKey="ai.nav.patterns" subtitleKey="ai.desc.patterns" onRan={refetch}>
      <DataState loading={loading && !data} error={error} onRetry={refetch} skeleton={<Skeleton height={400} />}>
        {data && (
          <div className="stack">
            <div className="grid grid-3">
              {data.insights.map((i) => (
                <div key={i.key} className="insight"><Lightbulb aria-hidden="true" /><span>{t(`ai.patterns.insights.${i.key}`, { ...i.vars, rate: percent(i.vars.rate) })}</span></div>
              ))}
            </div>
            <div className="grid grid-2">
              <ChartCard title={t('ai.patterns.seasonality')} subtitle={t('ai.patterns.seasonalitySub')} table={{ columns: [{ key: 'fullLabel', header: t('dashboard.charts.month') }, { key: 'leads', header: t('dashboard.charts.leads'), align: 'right' }], rows: data.seasonality }}>
                <div className="season" role="img" aria-label={t('ai.patterns.seasonality')}>
                  {data.seasonality.map((m) => {
                    const max = Math.max(...data.seasonality.map((x) => x.leads), 1);
                    return (
                      <div key={m.key} className="season__col" title={`${m.fullLabel}: ${m.leads}`}>
                        <span className="season__val">{m.leads}</span>
                        <span className="season__bar" style={{ height: `${(m.leads / max) * 100}%` }} />
                        <span className="season__label">{m.label}</span>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>
              <ChartCard title={t('ai.patterns.channels')} subtitle={t('ai.patterns.channelsSub')} table={{ columns: [{ key: 'source', header: t('leads.fields.source'), format: (s) => t(`sources.${s}`) }, { key: 'total', header: t('dashboard.charts.leads'), align: 'right' }, { key: 'rate', header: t('dashboard.kpi.conversion'), align: 'right', format: (v) => percent(v) }, { key: 'avgBudget', header: t('ai.patterns.avgBudget'), align: 'right', format: moneyCompact }], rows: data.channels }}>
                <HBarChart ariaLabel={t('ai.patterns.channels')} format={(v) => percent(v)} data={data.channels.map((c) => ({ key: c.source, label: t(`sources.${c.source}`), value: c.rate ?? 0, meta: `${c.converted}/${c.total}` }))} />
              </ChartCard>
            </div>
            <div className="grid grid-2">
              <Card title={t('ai.patterns.ltv')} subtitle={t('ai.patterns.ltvSub')} flush>
                <ul className="list">
                  {data.ltv.map((x) => (
                    <li key={x.contact.id}>
                      <Link className="list-item" to={`/crm/contacts/${x.contact.id}`}>
                        <Avatar name={x.contact.name} size="sm" />
                        <div className="list-item__main"><p className="list-item__title">{x.contact.name}</p><p className="list-item__meta">{t('ai.patterns.projects', { n: x.projects })}</p></div>
                        <span className="list-item__aside tnum" style={{ color: 'var(--text)', fontWeight: 600 }}>{money(x.value)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title={t('ai.patterns.hours')} subtitle={t('ai.patterns.hoursSub')}>
                <div className="heatmap" role="table" aria-label={t('ai.patterns.hours')}>
                  <span role="columnheader" />
                  {data.heatmap.blocks.map((b) => <span key={b} role="columnheader" className="heatmap__head">{b}</span>)}
                  {data.heatmap.rows.map((row, d) => [
                    <span key={`d${d}`} role="rowheader">{DAYS[d]}</span>,
                    ...row.map((c) => <span key={`${d}-${c.block}`} role="cell" className="heatmap__cell" data-l={c.level} title={`${DAYS[d]} ${data.heatmap.blocks[c.block]}: ${t('ai.patterns.level', { n: c.level })}`} aria-label={`${DAYS[d]} ${data.heatmap.blocks[c.block]}: ${t('ai.patterns.level', { n: c.level })}`} />),
                  ])}
                </div>
                <div className="chart-legend" style={{ marginTop: 10 }}>
                  <span>{t('ai.patterns.less')}</span>
                  {[0, 1, 2, 3, 4].map((l) => <span key={l} className="heatmap__cell" data-l={l} style={{ width: 18, height: 12, display: 'inline-block' }} aria-hidden="true" />)}
                  <span>{t('ai.patterns.more')}</span>
                </div>
              </Card>
            </div>
          </div>
        )}
      </DataState>
    </AiModuleShell>
  );
}
