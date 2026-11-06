import { Link } from 'react-router-dom';
import { Bot, ChartSpline, FlaskConical, MailSearch, Megaphone, MessageSquareText, Plug, Radar, Sparkles, Target } from 'lucide-react';
import { Badge, Card, Skeleton } from '../../components/ui/index.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { ago, date } from '../../lib/format.js';
import { aiService } from '../../services/index.js';

export const AI_META = {
  communications: { icon: MessageSquareText, to: '/ai/communications' },
  prospecting: { icon: Target, to: '/ai/prospecting' },
  leadFinder: { icon: Radar, to: '/ai/lead-finder' },
  patterns: { icon: ChartSpline, to: '/ai/patterns' },
  emailMining: { icon: MailSearch, to: '/ai/email-mining' },
  campaigns: { icon: Megaphone, to: '/ai/campaigns' },
};

export default function AiHubPage() {
  const t = useT();
  const { data } = useResource(() => aiService.hub(), []);
  const connected = data?.platforms.filter((p) => p.connected).length;
  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-head__eyebrow"><Sparkles size={12} style={{ display: 'inline', verticalAlign: -1 }} aria-hidden="true" /> {t('nav.ai')}</p>
          <h1 className="page-title">{t('ai.hub.title')}</h1>
          <p className="page-subtitle">{t('ai.hub.subtitle')}</p>
        </div>
      </div>
      <p className="notice" style={{ marginBottom: 20 }}><FlaskConical aria-hidden="true" />{t('ai.hub.demoNotice')}</p>
      <div className="ai-grid">
        {!data ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={190} radius={14} />) : data.modules.map((m) => {
          const meta = AI_META[m.module];
          const Icon = meta.icon;
          return (
            <Link key={m.module} to={meta.to} className="ai-card">
              <span className="ai-card__icon" aria-hidden="true"><Icon /></span>
              <span className="ai-card__title">{t(`ai.nav.${m.module}`)}</span>
              <span className="ai-card__body">{t(`ai.desc.${m.module}`)}</span>
              <span className="ai-card__foot">
                <span>{m.lastRun ? t('ai.lastRun', { when: ago(m.lastRun.startedAt) }) : t('ai.neverRun')}</span>
                {m.next && <span>{t('ai.nextRun', { when: date(m.next, 'MMM d') })}</span>}
              </span>
            </Link>
          );
        })}
        <Link to="/ai/assistant" className="ai-card">
          <span className="ai-card__icon" aria-hidden="true"><Bot /></span>
          <span className="ai-card__title">{t('ai.nav.assistant')}</span>
          <span className="ai-card__body">{t('ai.desc.assistant')}</span>
          <span className="ai-card__foot"><span>{t('ai.assistant.alsoFloating')}</span></span>
        </Link>
      </div>
      <Card title={t('ai.hub.platforms')} subtitle={data ? t('ai.hub.platformsSub', { n: connected, total: data.platforms.length }) : ''} style={{ marginTop: 20 }}>
        <div className="chip-row">
          {data?.platforms.map((p) => <Badge key={p.id} tone={p.connected ? 'success' : 'neutral'} icon={Plug}>{p.name}</Badge>)}
          {data?.adAccounts.map((a) => <Badge key={a.id} tone={a.connected ? 'success' : 'neutral'} icon={Megaphone}>{a.name}</Badge>)}
        </div>
      </Card>
    </>
  );
}
