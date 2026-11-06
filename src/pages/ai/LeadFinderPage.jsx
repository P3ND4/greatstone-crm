import { useState } from 'react';
import { CalendarClock, Plug, Radar, Target, Unplug, UserPlus, X } from 'lucide-react';
import AiModuleShell, { ConfigCard } from '../../components/ai/AiModuleShell.jsx';
import { PersonCell, Score } from '../../components/crm/bits.jsx';
import { Badge, Button, Card, DataState, EmptyState, Field, IconButton, Input, Select, Skeleton, Table, Textarea, useToast } from '../../components/ui/index.js';
import { NEIGHBORHOODS } from '../../data/constants.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { ago, date, money } from '../../lib/format.js';
import { aiService } from '../../services/index.js';

const TYPES = ['design', 'remodel', 'kitchen', 'bath', 'closet', 'staging'];
const SOURCE_TONE = { instagram: 'accent', google: 'info', realestate: 'success', directories: 'neutral', houzz: 'warning', facebook: 'info', linkedin: 'info' };

function ChipSelect({ legend, options, value, onChange }) {
  return (
    <fieldset className="chip-select">
      <legend className="field__label" style={{ marginBottom: 6 }}>{legend}</legend>
      {options.map((o) => (
        <label key={o.value}>
          <input type="checkbox" checked={value.includes(o.value)} onChange={() => onChange(value.includes(o.value) ? value.filter((x) => x !== o.value) : [...value, o.value])} />
          <span>{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

function Config({ data, onSaved }) {
  const t = useT();
  const toast = useToast();
  const [cfg, setCfg] = useState(data.config);
  const [platforms, setPlatforms] = useState(data.platforms);
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); await aiService.saveLeadFinderConfig(cfg); setSaving(false); toast.show(t('ai.saved')); onSaved(); };
  const toggle = async (p) => { const r = await aiService.togglePlatform(p.id); setPlatforms((list) => list.map((x) => (x.id === p.id ? { ...r } : x))); toast.show(t(r.connected ? 'ai.connected' : 'ai.disconnected', { name: p.name })); };
  return (
    <div className="grid grid-2" style={{ alignItems: 'start' }}>
      <ConfigCard title={t('ai.finder.criteria')} onSave={save} saving={saving}>
        <div className="stack">
          <ChipSelect legend={t('ai.finder.zones')} options={NEIGHBORHOODS.map((n) => ({ value: n, label: n }))} value={cfg.zones} onChange={(zones) => setCfg({ ...cfg, zones })} />
          <ChipSelect legend={t('ai.finder.types')} options={TYPES.map((x) => ({ value: x, label: t(`services.${x}`) }))} value={cfg.projectTypes} onChange={(projectTypes) => setCfg({ ...cfg, projectTypes })} />
          <div className="field-grid field-grid--2">
            <Field label={t('ai.finder.budgetMin')}><Input value={cfg.budgetMin} inputMode="numeric" suffix="USD" onChange={(e) => setCfg({ ...cfg, budgetMin: e.target.value })} /></Field>
            <Field label={t('ai.finder.budgetMax')}><Input value={cfg.budgetMax} inputMode="numeric" suffix="USD" onChange={(e) => setCfg({ ...cfg, budgetMax: e.target.value })} /></Field>
          </div>
          <Field label={t('ai.finder.keywords')} hint={t('ai.finder.keywordsHint')}><Textarea value={cfg.keywords} minRows={2} maxRows={6} onChange={(e) => setCfg({ ...cfg, keywords: e.target.value })} /></Field>
          <Field label={t('ai.finder.schedule')}>
            <Select value={cfg.schedule} onChange={(e) => setCfg({ ...cfg, schedule: e.target.value })} options={['off', 'daily', 'weekly', 'monthly'].map((x) => ({ value: x, label: t(`ai.schedule.${x}`) }))} />
          </Field>
        </div>
      </ConfigCard>
      <Card title={t('ai.finder.platforms')} subtitle={t('ai.finder.platformsSub')}>
        {platforms.map((p) => (
          <div key={p.id} className="toggle-row">
            <span className="row" style={{ minWidth: 0 }}>
              <Badge tone={p.connected ? 'success' : 'neutral'} dot>{p.connected ? t('ai.connectedShort') : t('ai.notConnected')}</Badge>
              <span className="truncate">{p.name}</span>
            </span>
            <Button size="sm" icon={p.connected ? Unplug : Plug} onClick={() => toggle(p)}>{p.connected ? t('ai.disconnect') : t('ai.connect')}</Button>
          </div>
        ))}
        <p className="subtle" style={{ fontSize: 12, marginTop: 12 }}>{t('ai.finder.connectNote')}</p>
      </Card>
    </div>
  );
}

export default function LeadFinderPage() {
  const t = useT();
  const toast = useToast();
  const [filter, setFilter] = useState('new');
  const { data, loading, error, refetch } = useResource(() => aiService.leadFinder(), []);
  const rows = (data?.results || []).filter((r) => filter === 'all' || r.status === filter);
  const resolve = async (r, action) => {
    await aiService.resolveResult(r.id, action);
    toast.show(t(`ai.finder.done.${action}`, { name: r.name }));
    refetch();
  };
  return (
    <AiModuleShell module="leadFinder" titleKey="ai.nav.leadFinder" subtitleKey="ai.desc.leadFinder" onRan={refetch} config={data && <Config data={data} onSaved={refetch} />}>
      <DataState loading={loading && !data} error={error} onRetry={refetch} skeleton={<Skeleton height={400} />}>
        {data && (
          <div className="stack">
            <div className="row wrap-row" style={{ justifyContent: 'space-between' }}>
              <span className="muted row" style={{ fontSize: 13 }}><CalendarClock size={14} aria-hidden="true" />{t('ai.finder.nextRun', { when: date(data.next, 'EEE MMM d'), schedule: t(`ai.schedule.${data.config.schedule}`) })}</span>
              <Select className="select--sm" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label={t('list.status')} options={['new', 'added', 'dismissed', 'all'].map((x) => ({ value: x, label: t(`ai.finder.filter.${x}`) }))} />
            </div>
            <Card flush className="list-card" title={t('ai.finder.results')} subtitle={t('ai.finder.resultsSub', { n: rows.length })}>
              {rows.length ? (
                <Table
                  caption={t('ai.finder.results')}
                  rows={rows}
                  columns={[
                    { key: 'name', header: t('leads.columns.name'), render: (r) => <PersonCell name={r.name} sub={`${r.persona} · ${r.neighborhood}`} /> },
                    { key: 'signal', header: t('ai.finder.signal'), hide: 'lg', render: (r) => <span className="muted" style={{ display: 'block', maxWidth: 420, whiteSpace: 'normal', fontSize: 13 }}>{r.signal}</span> },
                    { key: 'source', header: t('leads.fields.source'), hide: 'md', render: (r) => <Badge tone={SOURCE_TONE[r.source]}>{data.platforms.find((p) => p.id === r.source)?.name ?? r.source}</Badge> },
                    { key: 'estBudget', header: t('ai.finder.estBudget'), align: 'right', hide: 'xl', render: (r) => money(r.estBudget) },
                    { key: 'score', header: t('ai.pros.score'), render: (r) => <Score value={r.score} /> },
                    { key: 'foundAt', header: t('ai.finder.found'), hide: 'xxl', render: (r) => <span className="muted">{ago(r.foundAt)}</span> },
                    {
                      key: 'act', header: <span className="sr-only">{t('common.actions')}</span>,
                      render: (r) => (r.status === 'new' ? (
                        <span className="row-actions">
                          <IconButton icon={UserPlus} size="sm" label={t('ai.finder.toLead', { name: r.name })} onClick={() => resolve(r, 'lead')} />
                          <IconButton icon={Target} size="sm" label={t('ai.finder.toProspect', { name: r.name })} onClick={() => resolve(r, 'prospect')} />
                          <IconButton icon={X} size="sm" label={t('ai.finder.dismiss', { name: r.name })} onClick={() => resolve(r, 'dismiss')} />
                        </span>
                      ) : <Badge tone={r.status === 'added' ? 'success' : 'neutral'}>{t(`ai.finder.filter.${r.status}`)}</Badge>),
                    },
                  ]}
                />
              ) : <EmptyState icon={Radar} title={t('ai.finder.empty')} body={t('ai.finder.emptyBody')} />}
            </Card>
          </div>
        )}
      </DataState>
    </AiModuleShell>
  );
}
