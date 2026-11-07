import { ShieldCheck } from 'lucide-react';
import { useSession } from '../../app/SessionProvider.jsx';
import ProgressBar from '../../components/crm/ProgressBar.jsx';
import { DataState, Field, Select, SkeletonList, Switch } from '../../components/ui/index.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { date } from '../../lib/format.js';
import { settingsService } from '../../services/index.js';
import { SettingsForm, SettingsHeader, SettingsSection, setIn } from './shared.jsx';

const SOURCES = ['communications', 'contacts', 'projects', 'finance'];

export default function AiSettings() {
  const t = useT();
  const session = useSession();
  const { data, loading, error, refetch } = useResource(() => settingsService.ai(), []);
  return (
    <>
      <SettingsHeader section="ai" />
      <DataState loading={loading} error={error} onRetry={refetch} skeleton={<SkeletonList rows={8} />}>
        {data && (
          <SettingsForm
            initial={{ assistantEnabled: data.assistantEnabled, tone: data.tone, replyLanguage: data.replyLanguage, humanReview: data.humanReview, dataAccess: data.dataAccess, schedule: data.schedule }}
            onSave={async (v) => { await settingsService.saveAi(v); session.refresh(); }}
          >
            {(form) => {
              const { values, bind, set } = form;
              return (
                <>
                  <SettingsSection title={t('settings.ai.assistant')} description={t('settings.ai.assistantDesc')}>
                    <Switch checked={values.assistantEnabled} onChange={(v) => set('assistantEnabled', v)} label={t('settings.ai.enabled')} description={t('settings.ai.enabledDesc')} />
                    <div className="field-grid field-grid--2" style={{ marginTop: 12 }}>
                      <Field label={t('settings.ai.tone')} hint={t(`settings.ai.toneHint.${values.tone}`)}>
                        <Select {...bind('tone')} options={['warm', 'professional', 'concise'].map((x) => ({ value: x, label: t(`settings.ai.tones.${x}`) }))} />
                      </Field>
                      <Field label={t('settings.ai.language')}>
                        <Select {...bind('replyLanguage')} options={[{ value: 'auto', label: t('settings.ai.auto') }, { value: 'en', label: 'English' }, { value: 'es', label: 'Español' }]} />
                      </Field>
                    </div>
                  </SettingsSection>

                  <SettingsSection title={t('settings.ai.data')} description={t('settings.ai.dataDesc')}>
                    {SOURCES.map((s) => (
                      <Switch key={s} checked={values.dataAccess[s]} onChange={(v) => setIn(form, 'dataAccess', s, v)} label={t(`settings.ai.sources.${s}`)} description={t(`settings.ai.sourcesDesc.${s}`)} />
                    ))}
                  </SettingsSection>

                  <SettingsSection title={t('settings.ai.safety')} description={t('settings.ai.safetyDesc')}>
                    <Switch checked={values.humanReview} onChange={(v) => set('humanReview', v)} label={t('settings.ai.review')} description={t('settings.ai.reviewDesc')} />
                    <p className="insight" style={{ marginTop: 12 }}><ShieldCheck aria-hidden="true" /><span>{t('settings.ai.safetyNote')}</span></p>
                    <Field label={t('settings.ai.schedule')} hint={t('settings.ai.scheduleHint')} className="mt-12">
                      <Select {...bind('schedule')} options={['off', 'daily', 'weekly', 'monthly'].map((x) => ({ value: x, label: t(`ai.schedule.${x}`) }))} />
                    </Field>
                  </SettingsSection>

                  <SettingsSection title={t('settings.ai.usage')} description={t('settings.ai.usageDesc', { date: date(data.usageResetAt, 'MMM d') })}>
                    <div className="usage">
                      <p className="usage__nums"><strong className="tnum">{data.usedCredits.toLocaleString('en-US')}</strong> <span className="muted">/ {data.monthlyCredits.toLocaleString('en-US')} {t('settings.ai.credits')}</span></p>
                      <ProgressBar value={data.usedCredits / data.monthlyCredits} label={t('settings.ai.usage')} />
                      <p className="field__hint">{t('settings.ai.usageNote')}</p>
                    </div>
                  </SettingsSection>
                </>
              );
            }}
          </SettingsForm>
        )}
      </DataState>
    </>
  );
}
