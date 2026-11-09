import ChannelBadge from '../../components/comms/ChannelBadge.jsx';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckSquare, Clock, Frown, Lightbulb, Meh, MessageCircle, Smile } from 'lucide-react';
import AiModuleShell from '../../components/ai/AiModuleShell.jsx';
import HBarChart from '../../components/charts/HBarChart.jsx';
import { useQuickActions } from '../../components/quick/QuickActionsProvider.jsx';
import { Avatar, Badge, Button, Card, DataState, EmptyState, Kpi, Skeleton } from '../../components/ui/index.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { number, percent } from '../../lib/format.js';
import { aiService } from '../../services/index.js';

const S_ICON = { positive: Smile, neutral: Meh, negative: Frown };
export function Sentiment({ value }) {
  const t = useT();
  const Icon = S_ICON[value];
  return <span className={`sentiment sentiment--${value}`}><Icon aria-hidden="true" />{t(`ai.sentiment.${value}`)}</span>;
}
const fmtMin = (m, t) => (m == null ? '—' : m < 60 ? t('ai.minutes', { n: m }) : t('ai.hours', { n: Math.round(m / 6) / 10 }));

export default function CommAnalysisPage() {
  const t = useT();
  const quick = useQuickActions();
  const { data, loading, error, refetch } = useResource(() => aiService.communications(), []);
  const tot = data?.totals;
  return (
    <AiModuleShell module="communications" titleKey="ai.nav.communications" subtitleKey="ai.desc.communications" onRan={refetch}>
      <DataState loading={loading && !data} error={error} onRetry={refetch} skeleton={<Skeleton height={400} />}>
        {data && (
          <div className="stack">
            <div className="summary-strip">
              <Kpi icon={MessageCircle} label={t('ai.comms.analyzed')} value={number(tot.conversations)} />
              <Kpi icon={Smile} label={t('ai.comms.sentimentMix')} value={percent(tot.positive / tot.conversations)} meta={t('ai.comms.mix', { pos: tot.positive, neu: tot.neutral, neg: tot.negative })} />
              <Kpi icon={Clock} label={t('ai.comms.medianResponse')} value={fmtMin(data.responseTimes[0].medianMin, t)} meta={`${t('channels.whatsapp')} · ${t('channels.sms')}: ${fmtMin(data.responseTimes[2].medianMin, t)} · ${t('channels.email')}: ${fmtMin(data.responseTimes[1].medianMin, t)}`} />
              <Kpi icon={AlertTriangle} label={t('ai.comms.atRisk')} value={number(tot.atRisk)} metaTone={tot.atRisk ? 'alert' : undefined} meta={t('ai.comms.atRiskHint')} />
            </div>
            <div className="grid grid-3">
              <Card title={t('ai.comms.sentiment')}>
                <div className="stacked-bar" role="img" aria-label={t('ai.comms.mix', { pos: tot.positive, neu: tot.neutral, neg: tot.negative })}>
                  <span style={{ width: `${(tot.positive / tot.conversations) * 100}%`, background: 'var(--success)' }} />
                  <span style={{ width: `${(tot.neutral / tot.conversations) * 100}%`, background: 'var(--border-strong)' }} />
                  <span style={{ width: `${(tot.negative / tot.conversations) * 100}%`, background: 'var(--danger)' }} />
                </div>
                <div className="chart-legend" style={{ marginTop: 10 }}>
                  <span><i style={{ background: 'var(--success)' }} />{t('ai.sentiment.positive')} {tot.positive}</span>
                  <span><i style={{ background: 'var(--border-strong)' }} />{t('ai.sentiment.neutral')} {tot.neutral}</span>
                  <span><i style={{ background: 'var(--danger)' }} />{t('ai.sentiment.negative')} {tot.negative}</span>
                </div>
              </Card>
              <Card title={t('ai.comms.topics')}>
                <HBarChart ariaLabel={t('ai.comms.topics')} data={data.topics.map((x) => ({ key: x.key, label: t(`ai.topics.${x.key}`), value: x.count }))} />
              </Card>
              <Card title={t('ai.comms.objections')}>
                {data.objections.length ? <HBarChart ariaLabel={t('ai.comms.objections')} color="var(--chart-2)" data={data.objections.map((x) => ({ key: x.key, label: t(`ai.objections.${x.key}`), value: x.count }))} /> : <EmptyState compact title={t('ai.none')} />}
              </Card>
            </div>
            <div className="grid grid-2">
              <Card title={t('ai.comms.opportunities')} subtitle={t('ai.comms.opportunitiesSub')} flush>
                <ul className="list">
                  {data.opportunities.map((o) => (
                    <li key={o.id} className="list-item">
                      <Lightbulb size={18} style={{ color: 'var(--accent)' }} aria-hidden="true" />
                      <div className="list-item__main">
                        <p className="list-item__title">{o.contact?.name} · {o.opportunities.map((k) => t(`ai.opps.${k}`)).join(', ')}</p>
                        <p className="list-item__meta">“{o.lastMessage}”</p>
                      </div>
                      <Button size="sm" icon={CheckSquare} onClick={() => quick.open('task', { projectId: o.project?.id ?? '' })}>{t('quick.task')}</Button>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title={t('ai.comms.risky')} subtitle={t('ai.comms.riskySub')} flush>
                {data.atRisk.length ? (
                  <ul className="list">
                    {data.atRisk.map((c) => (
                      <li key={c.id}>
                        <Link className="list-item" to={`/crm/communications/${c.channel}?c=${c.id}`}>
                          <Avatar name={c.contact?.name} size="sm" />
                          <div className="list-item__main">
                            <p className="list-item__title">{c.contact?.name}</p>
                            <p className="list-item__meta">{c.lastMessage}</p>
                          </div>
                          <span className="list-item__aside stack-sm" style={{ alignItems: 'flex-end', gap: 2 }}>
                            <Sentiment value={c.sentiment} />
                            {c.hoursWaiting > 0 && <span style={{ color: 'var(--danger)' }}>{c.hoursWaiting < 48 ? t('ai.comms.waiting', { h: c.hoursWaiting }) : t('ai.comms.waitingDays', { d: Math.round(c.hoursWaiting / 24) })}</span>}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : <EmptyState compact title={t('ai.none')} />}
              </Card>
            </div>
            <Card title={t('ai.comms.summaries')} subtitle={t('ai.comms.summariesSub')} flush>
              <ul className="list">
                {data.summaries.map((s) => (
                  <li key={s.id}>
                    <Link className="list-item" to={`/crm/communications/${s.channel}?c=${s.id}`} style={{ alignItems: 'flex-start' }}>
                      <ChannelBadge channel={s.channel} />
                      <div className="list-item__main">
                        <p className="list-item__title">{s.contact?.name}{s.subject ? ` — ${s.subject}` : ''}</p>
                        <p className="list-item__meta" style={{ whiteSpace: 'normal' }}>
                          {t('ai.comms.summaryLine', {
                            topics: s.topics.map((k) => t(`ai.topics.${k}`)).join(', ') || '—',
                            state: !s.hoursWaiting ? t('ai.comms.awaitingClient') : s.hoursWaiting < 48 ? t('ai.comms.awaitingUs', { h: `${s.hoursWaiting} h` }) : t('ai.comms.awaitingUs', { h: t('ai.comms.daysShort', { d: Math.round(s.hoursWaiting / 24) }) }),
                          })}
                        </p>
                      </div>
                      <Sentiment value={s.sentiment} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </DataState>
    </AiModuleShell>
  );
}
