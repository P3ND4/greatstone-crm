import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Mail, RefreshCcw, Snowflake, UserPlus, Users } from 'lucide-react';
import AiModuleShell from '../../components/ai/AiModuleShell.jsx';
import { useQuickActions } from '../../components/quick/QuickActionsProvider.jsx';
import { Avatar, Badge, Button, Card, DataState, EmptyState, Kpi, SegmentedControl, Skeleton } from '../../components/ui/index.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { number } from '../../lib/format.js';
import { aiService } from '../../services/index.js';

const KIND_ICON = { referral: UserPlus, contactNoLead: Users, coldThread: Snowflake, reactivate: RefreshCcw };
const KINDS = ['all', 'referral', 'contactNoLead', 'coldThread', 'reactivate'];

export default function EmailMiningPage() {
  const t = useT();
  const quick = useQuickActions();
  const [kind, setKind] = useState('all');
  const [done, setDone] = useState([]);
  const { data, loading, error, refetch } = useResource(() => aiService.emailMining(), []);
  const rows = (data?.findings || []).filter((f) => (kind === 'all' || f.kind === kind) && !done.includes(f.id));
  const count = (k) => data?.findings.filter((f) => f.kind === k).length ?? 0;

  const action = (f) => {
    if (f.suggestion === 'createLead') return <Button size="sm" icon={UserPlus} to="/crm/leads/new">{t('ai.mining.actions.createLead')}</Button>;
    if (f.suggestion === 'followUp') return <Button size="sm" icon={Mail} to={`/crm/communications/email/compose?reply=${f.conversationId}`}>{t('ai.mining.actions.followUp')}</Button>;
    if (f.suggestion === 'checkIn') return <Button size="sm" icon={Mail} to={`/crm/communications/email/compose?to=${encodeURIComponent(f.contact?.email || '')}&contact=${f.contact?.id}`}>{t('ai.mining.actions.checkIn')}</Button>;
    return <Button size="sm" icon={CheckSquare} onClick={() => { quick.open('task'); setDone((d) => [...d, f.id]); }}>{t('ai.mining.actions.askReferral')}</Button>;
  };

  return (
    <AiModuleShell module="emailMining" titleKey="ai.nav.emailMining" subtitleKey="ai.desc.emailMining" onRan={refetch}>
      <DataState loading={loading && !data} error={error} onRetry={refetch} skeleton={<Skeleton height={400} />}>
        {data && (
          <div className="stack">
            <div className="summary-strip">
              <Kpi icon={Mail} label={t('ai.mining.scanned')} value={number(data.scanned)} meta={t('ai.mining.messages', { n: data.messages })} />
              <Kpi icon={UserPlus} label={t('ai.mining.kinds.referral')} value={number(count('referral'))} />
              <Kpi icon={Snowflake} label={t('ai.mining.kinds.coldThread')} value={number(count('coldThread'))} />
              <Kpi icon={RefreshCcw} label={t('ai.mining.kinds.reactivate')} value={number(count('reactivate'))} />
            </div>
            <SegmentedControl label={t('list.type')} value={kind} onChange={setKind} options={KINDS.map((k) => ({ value: k, label: k === 'all' ? t('common.all') : t(`ai.mining.kinds.${k}`) }))} />
            <Card flush title={t('ai.mining.findings')} subtitle={t('ai.mining.findingsSub')}>
              {rows.length ? (
                <ul className="list">
                  {rows.map((f) => {
                    const Icon = KIND_ICON[f.kind];
                    return (
                      <li key={f.id} className="list-item wrap-row" style={{ flexWrap: 'wrap' }}>
                        <span className="timeline__dot" style={{ width: 32, height: 32 }} aria-hidden="true"><Icon /></span>
                        <Avatar name={f.contact?.name} size="sm" />
                        <div className="list-item__main" style={{ minWidth: 180 }}>
                          <p className="list-item__title">{f.contact ? <Link to={`/crm/contacts/${f.contact.id}`}>{f.contact.name}</Link> : '—'} <Badge>{t(`ai.mining.kinds.${f.kind}`)}</Badge></p>
                          <p className="list-item__meta" style={{ whiteSpace: 'normal' }}>{t(`ai.mining.why.${f.kind}`, { detail: f.detail, days: f.days })}</p>
                        </div>
                        {action(f)}
                        <Button size="sm" variant="ghost" plain onClick={() => setDone((d) => [...d, f.id])}>{t('ai.mining.dismiss')}</Button>
                      </li>
                    );
                  })}
                </ul>
              ) : <EmptyState icon={Mail} title={t('ai.none')} />}
            </Card>
          </div>
        )}
      </DataState>
    </AiModuleShell>
  );
}
