import { useState } from 'react';
import { ArrowRight, Database, KeyRound, Loader2, Plug, Unplug } from 'lucide-react';
import { Badge, Button, DataState, SkeletonList, useToast } from '../../components/ui/index.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { settingsService } from '../../services/index.js';
import { SettingsHeader, SettingsSection, useSettingsAccess } from './shared.jsx';

function IntegrationRow({ name, sub, connected, onToggle, disabled }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const run = async () => { setBusy(true); await onToggle(); setBusy(false); };
  return (
    <div className="toggle-row">
      <span style={{ minWidth: 0 }}>
        <span className="row" style={{ gap: 8 }}>
          <span className="truncate" style={{ fontWeight: 500 }}>{name}</span>
          <Badge tone={connected ? 'success' : 'neutral'} dot>{connected ? t('ai.connectedShort') : t('ai.notConnected')}</Badge>
        </span>
        {sub && <span className="subtle truncate" style={{ display: 'block', fontSize: 13 }}>{sub}</span>}
      </span>
      <Button size="sm" icon={busy ? Loader2 : connected ? Unplug : Plug} className={busy ? 'is-running' : undefined} onClick={run} disabled={busy || disabled} aria-label={`${connected ? t('ai.disconnect') : t('ai.connect')} ${name}`}>
        <span className="hide-mobile">{connected ? t('ai.disconnect') : t('ai.connect')}</span>
      </Button>
    </div>
  );
}

export default function IntegrationsSettings() {
  const t = useT();
  const toast = useToast();
  const { readOnly } = useSettingsAccess();
  const { data, loading, error, refetch } = useResource(() => settingsService.integrations(), []);

  const toggle = async (kind, row) => {
    await settingsService.setIntegration(kind, row.id, !row.connected);
    toast.show(t(row.connected ? 'settings.channels.disconnected' : 'settings.channels.connected', { name: row.name }));
    refetch();
  };

  return (
    <>
      <SettingsHeader section="integrations" />
      <DataState loading={loading} error={error} onRetry={refetch} skeleton={<SkeletonList rows={8} />}>
        {data && (
          <div className="set-form">
            <SettingsSection title={t('settings.integrations.channels')} description={t('settings.integrations.channelsDesc')}>
              {['whatsapp', 'email', 'calendar'].map((ch) => (
                <div key={ch} className="toggle-row">
                  <span className="row" style={{ gap: 8, minWidth: 0 }}>
                    <span className="truncate" style={{ fontWeight: 500 }}>{t(`settings.channels.${ch}`)}</span>
                    <Badge tone={data.channels[ch].connected ? 'success' : 'neutral'} dot>{data.channels[ch].connected ? t('ai.connectedShort') : t('ai.notConnected')}</Badge>
                  </span>
                  <Button size="sm" variant="ghost" plain iconRight={ArrowRight} to="/settings/channels">{t('settings.integrations.manage')}</Button>
                </div>
              ))}
            </SettingsSection>

            <SettingsSection title={t('settings.integrations.ads')} description={t('settings.integrations.adsDesc')}>
              {data.adAccounts.map((a) => (
                <IntegrationRow key={a.id} name={a.name} sub={a.account || t('settings.integrations.noAccount')} connected={a.connected} disabled={readOnly} onToggle={() => toggle('ads', a)} />
              ))}
            </SettingsSection>

            <SettingsSection title={t('settings.integrations.sources')} description={t('settings.integrations.sourcesDesc')}>
              {data.platforms.map((p) => (
                <IntegrationRow key={p.id} name={p.name} connected={p.connected} disabled={readOnly} onToggle={() => toggle('platforms', p)} />
              ))}
            </SettingsSection>

            <SettingsSection title={t('settings.integrations.planned')} description={t('settings.integrations.plannedDesc')}>
              <ul className="planned-grid">
                {data.future.map((f) => (
                  <li key={f.id} className="planned">
                    <span className="planned__icon" aria-hidden="true">{f.id === 'supabase' ? <Database /> : <Plug />}</span>
                    <span style={{ minWidth: 0 }}>
                      <span className="truncate" style={{ display: 'block', fontWeight: 500 }}>{f.name}</span>
                      <span className="subtle" style={{ fontSize: 12 }}>{t(`settings.integrations.kind.${f.kind}`)}</span>
                    </span>
                    <Badge tone="info">{t('settings.integrations.phase2')}</Badge>
                  </li>
                ))}
              </ul>
              <p className="insight" style={{ marginTop: 16 }}><KeyRound aria-hidden="true" /><span>{t('settings.integrations.keysNote')}</span></p>
            </SettingsSection>
          </div>
        )}
      </DataState>
    </>
  );
}
