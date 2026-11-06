import { useState } from 'react';
import { Lightbulb, Megaphone, MousePointerClick, Plug, Target, TrendingUp, Unplug, Wallet } from 'lucide-react';
import AiModuleShell from '../../components/ai/AiModuleShell.jsx';
import ChartCard from '../../components/charts/ChartCard.jsx';
import HBarChart from '../../components/charts/HBarChart.jsx';
import { Badge, Button, Card, DataState, Kpi, Skeleton, Table, useToast } from '../../components/ui/index.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { money, number, percent } from '../../lib/format.js';
import { aiService } from '../../services/index.js';

const STATUS_TONE = { active: 'success', paused: 'warning', draft: 'neutral' };

export default function CampaignsPage() {
  const t = useT();
  const toast = useToast();
  const { data, loading, error, refetch } = useResource(() => aiService.campaigns(), []);
  const [busy, setBusy] = useState(null);
  const toggle = async (a) => { setBusy(a.id); const r = await aiService.toggleAdAccount(a.id); setBusy(null); toast.show(t(r.connected ? 'ai.connected' : 'ai.disconnected', { name: a.name })); refetch(); };
  const tot = data?.totals;
  const roas = (v) => (v == null ? '—' : `${(Math.round(v * 10) / 10).toFixed(1)}×`);
  return (
    <AiModuleShell module="campaigns" titleKey="ai.nav.campaigns" subtitleKey="ai.desc.campaigns" onRan={refetch}>
      <DataState loading={loading && !data} error={error} onRetry={refetch} skeleton={<Skeleton height={400} />}>
        {data && (
          <div className="stack">
            <div className="grid grid-2">
              {data.accounts.map((a) => (
                <Card key={a.id}>
                  <div className="row-between">
                    <span className="row"><Megaphone size={18} aria-hidden="true" /><strong>{a.name}</strong><Badge tone={a.connected ? 'success' : 'neutral'} dot>{a.connected ? t('ai.connectedShort') : t('ai.notConnected')}</Badge></span>
                    <Button size="sm" icon={a.connected ? Unplug : Plug} onClick={() => toggle(a)} disabled={busy === a.id}>{a.connected ? t('ai.disconnect') : t('ai.connect')}</Button>
                  </div>
                  <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>{a.connected ? a.account : t('ai.ads.connectHint')}</p>
                </Card>
              ))}
            </div>
            <div className="summary-strip summary-strip--5">
              <Kpi icon={Wallet} label={t('ai.ads.spend')} value={money(tot.spend)} />
              <Kpi icon={Target} label={t('ai.ads.leads')} value={number(tot.leads)} />
              <Kpi icon={MousePointerClick} label={t('ai.ads.cpl')} value={money(tot.cpl)} />
              <Kpi icon={TrendingUp} label={t('ai.ads.roas')} value={roas(tot.roas)} meta={t('ai.ads.roasHint')} />
              <Kpi icon={Megaphone} label={t('ai.ads.won')} value={number(tot.won)} meta={t('ai.ads.wonHint')} />
            </div>
            <Card flush className="list-card" title={t('ai.ads.campaigns')}>
              <Table
                caption={t('ai.ads.campaigns')}
                rows={data.campaigns}
                columns={[
                  { key: 'name', header: t('prospecting.campaign'), render: (c) => <span><strong style={{ fontWeight: 500, display: 'block' }}>{c.name}</strong><span className="muted" style={{ fontSize: 12 }}>{c.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}</span></span> },
                  { key: 'status', header: t('list.status'), render: (c) => <Badge tone={STATUS_TONE[c.status]} dot>{t(`campaignStatus.${c.status}`)}</Badge> },
                  { key: 'spend', header: t('ai.ads.spend'), align: 'right', render: (c) => money(c.spend) },
                  { key: 'ctr', header: 'CTR', align: 'right', hide: 'xl', render: (c) => percent(c.ctr, 1) },
                  { key: 'leads', header: t('ai.ads.leads'), align: 'right', render: (c) => number(c.leads) },
                  { key: 'cpl', header: t('ai.ads.cpl'), align: 'right', hide: 'md', render: (c) => money(c.cpl) },
                  { key: 'roas', header: t('ai.ads.roas'), align: 'right', hide: 'lg', render: (c) => roas(c.roas) },
                ]}
              />
            </Card>
            <div className="grid grid-2">
              <ChartCard title={t('ai.ads.leadsByCampaign')} table={{ columns: [{ key: 'name', header: t('prospecting.campaign') }, { key: 'leads', header: t('ai.ads.leads'), align: 'right' }, { key: 'won', header: t('ai.ads.won'), align: 'right' }], rows: data.campaigns }}>
                <HBarChart ariaLabel={t('ai.ads.leadsByCampaign')} data={data.campaigns.filter((c) => c.leads).map((c) => ({ key: c.id, label: c.name, value: c.leads, meta: t('ai.ads.wonShort', { n: c.won }) }))} />
              </ChartCard>
              <Card title={t('ai.ads.audiences')} subtitle={t('ai.ads.audiencesSub')} flush>
                <ul className="list">
                  {data.audiences.map((a) => (
                    <li key={a.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                      <Lightbulb size={18} style={{ color: 'var(--accent)', marginTop: 2 }} aria-hidden="true" />
                      <div className="list-item__main">
                        <p className="list-item__title" style={{ whiteSpace: 'normal' }}>{t(`ai.ads.aud.${a.key}.title`)}</p>
                        <p className="list-item__meta" style={{ whiteSpace: 'normal' }}>{t(`ai.ads.aud.${a.key}.body`, { n: a.basis })} · {t('ai.ads.size', { size: a.size })}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        )}
      </DataState>
    </AiModuleShell>
  );
}
