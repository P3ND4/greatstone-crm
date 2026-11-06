import { Link } from 'react-router-dom';
import { CalendarClock, Lightbulb, Mail, MessageCircle } from 'lucide-react';
import AiModuleShell from '../../components/ai/AiModuleShell.jsx';
import ChartCard from '../../components/charts/ChartCard.jsx';
import HBarChart from '../../components/charts/HBarChart.jsx';
import { PersonCell, Score } from '../../components/crm/bits.jsx';
import { Badge, Card, DataState, Skeleton, Table } from '../../components/ui/index.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { percent } from '../../lib/format.js';
import { aiService } from '../../services/index.js';

export default function ProspectingAnalysisPage() {
  const t = useT();
  const { data, loading, error, refetch } = useResource(() => aiService.prospecting(), []);
  return (
    <AiModuleShell module="prospecting" titleKey="ai.nav.prospecting" subtitleKey="ai.desc.prospecting" onRan={refetch}>
      <DataState loading={loading && !data} error={error} onRetry={refetch} skeleton={<Skeleton height={400} />}>
        {data && (
          <div className="stack">
            <div className="insight"><Lightbulb aria-hidden="true" /><span>{t('ai.pros.insight', { segment: t(`segments.${data.segments[0].segment}`), rate: percent(data.segments[0].replyRate), day: data.bestDay, hour: data.bestHour })}</span></div>
            <div className="grid grid-2">
              <ChartCard
                title={t('ai.pros.bySegment')}
                subtitle={t('prospecting.bySegmentSub')}
                table={{ columns: [{ key: 'segment', header: t('list.segment'), format: (s) => t(`segments.${s}`) }, { key: 'contacted', header: t('prospecting.contacted'), align: 'right' }, { key: 'replyRate', header: t('prospecting.replyRate'), align: 'right', format: (v) => percent(v) }], rows: data.segments }}
              >
                <HBarChart ariaLabel={t('ai.pros.bySegment')} format={(v) => percent(v)} data={data.segments.map((s) => ({ key: s.segment, label: t(`segments.${s.segment}`), value: s.replyRate ?? 0, meta: `${s.replied}/${s.contacted}` }))} />
              </ChartCard>
              <Card title={t('ai.pros.messages')} subtitle={t('ai.pros.messagesSub')} flush>
                <ul className="list">
                  {data.messages.slice(0, 6).map((m) => (
                    <li key={m.id} className="list-item">
                      {m.channel === 'email' ? <Mail size={16} className="subtle" aria-hidden="true" /> : <MessageCircle size={16} className="subtle" aria-hidden="true" />}
                      <div className="list-item__main"><p className="list-item__title">“{m.subject}”</p><p className="list-item__meta">{m.sequence} · {t('prospecting.day', { n: m.day })}</p></div>
                      <span className="list-item__aside tnum" style={{ color: 'var(--text)', fontWeight: 600 }}>{percent(m.replyRate)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
            <Card flush className="list-card" title={t('ai.pros.nba')} subtitle={t('ai.pros.nbaSub')}>
              <Table
                caption={t('ai.pros.nba')}
                rows={data.recommendations}
                columns={[
                  { key: 'name', header: t('leads.columns.name'), render: (p) => <PersonCell name={p.name} sub={`${p.role} · ${p.company}`} /> },
                  { key: 'status', header: t('list.status'), hide: 'md', render: (p) => <Badge>{t(`prospectStatus.${p.status}`)}</Badge> },
                  { key: 'score', header: t('ai.pros.score'), render: (p) => <Score value={p.score} /> },
                  { key: 'action', header: t('ai.pros.action'), render: (p) => <span className="row"><CalendarClock size={14} className="subtle" aria-hidden="true" />{t(`ai.nbaActions.${p.action}`)}</span> },
                  { key: 'list', header: t('list.list'), hide: 'lg', render: (p) => <Link to={`/crm/prospecting?list=${p.listId}`}>{p.list?.name}</Link> },
                ]}
              />
            </Card>
            <Card title={t('ai.pros.scoring')}><p className="muted">{t('ai.pros.scoringBody')}</p></Card>
          </div>
        )}
      </DataState>
    </AiModuleShell>
  );
}
