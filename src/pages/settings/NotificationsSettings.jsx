import { DataState, Field, Input, Select, SkeletonList, Switch } from '../../components/ui/index.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { SETTINGS_META, settingsService } from '../../services/index.js';
import { SettingsForm, SettingsHeader, SettingsSection } from './shared.jsx';

export default function NotificationsSettings() {
  const t = useT();
  const { data, loading, error, refetch } = useResource(() => settingsService.notifications(), []);
  const channels = SETTINGS_META.notifyChannels;
  return (
    <>
      <SettingsHeader section="notifications" />
      <DataState loading={loading} error={error} onRetry={refetch} skeleton={<SkeletonList rows={10} />}>
        {data && (
          <SettingsForm initial={data} onSave={(v) => settingsService.saveNotifications(v)}>
            {(form) => {
              const { values, set, bind } = form;
              const toggle = (ev, ch) => set('rules', { ...values.rules, [ev]: { ...values.rules[ev], [ch]: !values.rules[ev][ch] } });
              const column = (ch, on) => set('rules', Object.fromEntries(Object.entries(values.rules).map(([ev, r]) => [ev, { ...r, [ch]: on }])));
              return (
                <>
                  <SettingsSection title={t('settings.notifications.events')} description={t('settings.notifications.eventsDesc')}>
                    <div className="table-wrap">
                      <table className="table notif-table">
                        <caption className="sr-only">{t('settings.notifications.events')}</caption>
                        <thead>
                          <tr>
                            <th scope="col">{t('settings.notifications.event')}</th>
                            {channels.map((ch) => {
                              const all = Object.values(values.rules).every((r) => r[ch]);
                              return (
                                <th key={ch} scope="col" className="notif-table__ch">
                                  <label className="notif-table__all">
                                    <input type="checkbox" className="checkbox" checked={all} onChange={() => column(ch, !all)} aria-label={t('settings.notifications.allFor', { channel: t(`settings.notifications.channels.${ch}`) })} />
                                    <span>{t(`settings.notifications.channels.${ch}`)}</span>
                                  </label>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {SETTINGS_META.events.map((ev) => (
                            <tr key={ev}>
                              <th scope="row">
                                <span style={{ display: 'block', fontWeight: 500 }}>{t(`settings.notifications.ev.${ev}`)}</span>
                                <span className="subtle notif-table__desc">{t(`settings.notifications.evDesc.${ev}`)}</span>
                              </th>
                              {channels.map((ch) => (
                                <td key={ch} className="notif-table__ch">
                                  <input
                                    type="checkbox"
                                    className="checkbox"
                                    checked={values.rules[ev][ch]}
                                    onChange={() => toggle(ev, ch)}
                                    aria-label={`${t(`settings.notifications.ev.${ev}`)} — ${t(`settings.notifications.channels.${ch}`)}`}
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="field__hint" style={{ marginTop: 12 }}>{t('settings.notifications.pushNote')}</p>
                  </SettingsSection>

                  <SettingsSection title={t('settings.notifications.delivery')} description={t('settings.notifications.deliveryDesc')}>
                    <Field label={t('settings.notifications.digest')}>
                      <Select {...bind('digest')} options={['off', 'daily', 'weekly'].map((x) => ({ value: x, label: t(`settings.notifications.digests.${x}`) }))} />
                    </Field>
                    <Switch className="mt-12" checked={values.quietHours} onChange={(v) => set('quietHours', v)} label={t('settings.notifications.quiet')} description={t('settings.notifications.quietDesc')} />
                    {values.quietHours && (
                      <div className="field-grid field-grid--2">
                        <Field label={t('settings.channels.from')}><Input type="time" {...bind('quietFrom')} /></Field>
                        <Field label={t('settings.channels.to')}><Input type="time" {...bind('quietTo')} /></Field>
                      </div>
                    )}
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
