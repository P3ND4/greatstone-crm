import { useState } from 'react';
import { FlaskConical, History, Loader2, Play, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Table, Tabs, useToast } from '../ui/index.js';
import useResource from '../../hooks/useResource.js';
import useUrlState from '../../hooks/useUrlState.js';
import { useT } from '../../i18n/index.jsx';
import { ago, date, time } from '../../lib/format.js';
import { aiService } from '../../services/index.js';

/**
 * Shared frame for every AI module: title + "demo data" status, Run now (simulated), and
 * three views: Results (actionable output) · Configure · Run history. Tab lives in the URL.
 */
export default function AiModuleShell({ module, titleKey, subtitleKey, config, onRan, children }) {
  const t = useT();
  const toast = useToast();
  const [view, setView] = useUrlState('view', 'results');
  const [running, setRunning] = useState(false);
  const { data: runs, refetch } = useResource(() => aiService.runs(module), [module]);
  const last = runs?.[0];

  const run = async () => {
    setRunning(true);
    const r = await aiService.run(module);
    setRunning(false);
    toast.show(t('ai.runDone', { n: r.items }));
    refetch();
    onRan?.(r);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-head__eyebrow"><Sparkles size={12} style={{ display: 'inline', verticalAlign: -1 }} aria-hidden="true" /> {t('nav.ai')}</p>
          <h1 className="page-title">{t(titleKey)}</h1>
          <p className="page-subtitle">{t(subtitleKey)}</p>
          <div className="row wrap-row" style={{ marginTop: 10 }}>
            <Badge tone="warning" icon={FlaskConical}>{t('ai.demoBadge')}</Badge>
            {last && <span className="muted" style={{ fontSize: 13 }}>{t('ai.lastRun', { when: ago(last.startedAt) })}</span>}
          </div>
        </div>
        <div className="page-head__actions">
          <Button variant="primary" icon={running ? Loader2 : Play} onClick={run} disabled={running} className={running ? 'is-running' : undefined} aria-live="polite">
            {running ? t('ai.running') : t('ai.runNow')}
          </Button>
        </div>
      </div>
      {running && <div className="ai-progress" role="progressbar" aria-label={t('ai.running')}><span /></div>}
      <Tabs
        label={t(titleKey)}
        value={view}
        onChange={setView}
        tabs={[
          { id: 'results', label: t('ai.views.results') },
          ...(config ? [{ id: 'config', label: t('ai.views.config') }] : []),
          { id: 'history', label: t('ai.views.history'), count: runs?.length },
        ]}
      />
      <div className="tab-panel" role="tabpanel">
        {view === 'results' && children}
        {view === 'config' && config}
        {view === 'history' && (
          <Card flush className="list-card" title={t('ai.views.history')} actions={<History size={16} className="subtle" aria-hidden="true" />}>
            {runs?.length ? (
              <Table
                caption={t('ai.views.history')}
                rows={runs}
                columns={[
                  { key: 'startedAt', header: t('ai.history.when'), render: (r) => <span className="tnum">{date(r.startedAt, 'MMM d, yyyy')} · {time(r.startedAt)}</span> },
                  { key: 'trigger', header: t('ai.history.trigger'), render: (r) => <Badge>{t(`ai.trigger.${r.trigger}`)}</Badge> },
                  { key: 'status', header: t('list.status'), render: (r) => <Badge tone={r.status === 'completed' ? 'success' : 'danger'} dot>{t(`ai.runStatus.${r.status}`)}</Badge> },
                  { key: 'items', header: t('ai.history.items'), align: 'right', render: (r) => r.items },
                  { key: 'durationSec', header: t('ai.history.duration'), align: 'right', hide: 'md', render: (r) => `${r.durationSec}s` },
                  { key: 'note', header: t('ai.history.note'), hide: 'lg', render: (r) => (r.note ? <span className="muted">{t(`ai.notes.${r.note}`)}</span> : '—') },
                ]}
              />
            ) : <EmptyState icon={History} title={t('ai.noRuns')} />}
          </Card>
        )}
      </div>
    </>
  );
}

/** Simple config card wrapper with a Save button (settings are mock-persisted in memory). */
export function ConfigCard({ title, children, onSave, saving }) {
  const t = useT();
  return (
    <Card title={title} actions={<SlidersHorizontal size={16} className="subtle" aria-hidden="true" />} footer={onSave && <div className="row" style={{ justifyContent: 'flex-end' }}><Button variant="primary" size="sm" onClick={onSave} disabled={saving}>{saving ? t('common.saving') : t('common.save')}</Button></div>}>
      {children}
    </Card>
  );
}
