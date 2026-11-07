import { useState } from 'react';
import { BadgeCheck, CalendarDays, Loader2, Mail, MessageCircle, Plug, Unplug } from 'lucide-react';
import { Badge, Button, DataState, Field, Input, Select, SkeletonList, Switch, Textarea, useToast } from '../../components/ui/index.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { settingsService } from '../../services/index.js';
import { SettingsForm, SettingsHeader, SettingsSection, setIn, useSettingsAccess } from './shared.jsx';

const ICONS = { whatsapp: MessageCircle, email: Mail, calendar: CalendarDays };

/** Connection status + simulated connect / disconnect (no OAuth, no keys in this phase). */
function ConnectionBar({ channel, connected, detail, onChange }) {
  const t = useT();
  const toast = useToast();
  const { readOnly } = useSettingsAccess();
  const [busy, setBusy] = useState(false);
  const Icon = ICONS[channel];
  const toggle = async () => {
    setBusy(true);
    await settingsService.setChannelConnected(channel, !connected);
    setBusy(false);
    toast.show(t(connected ? 'settings.channels.disconnected' : 'settings.channels.connected', { name: t(`settings.channels.${channel}`) }));
    onChange(!connected);
  };
  return (
    <div className="conn-bar">
      <span className={`conn-bar__icon conn-bar__icon--${channel}`} aria-hidden="true"><Icon /></span>
      <span className="grow" style={{ minWidth: 0 }}>
        <span className="row" style={{ gap: 8 }}>
          <strong>{t(`settings.channels.${channel}`)}</strong>
          <Badge tone={connected ? 'success' : 'neutral'} dot>{connected ? t('ai.connectedShort') : t('ai.notConnected')}</Badge>
        </span>
        <span className="subtle truncate" style={{ display: 'block', fontSize: 13 }}>{connected ? detail : t('settings.channels.connectHint')}</span>
      </span>
      <Button size="sm" variant={connected ? 'secondary' : 'primary'} icon={busy ? Loader2 : connected ? Unplug : Plug} className={busy ? 'is-running' : undefined} onClick={toggle} disabled={busy || readOnly}>
        {connected ? t('ai.disconnect') : t('ai.connect')}
      </Button>
    </div>
  );
}

export default function ChannelsSettings() {
  const t = useT();
  const { data, loading, error, refetch } = useResource(() => settingsService.channels(), []);
  const [conn, setConn] = useState({});
  const isOn = (ch) => conn[ch] ?? data?.[ch]?.connected;

  return (
    <>
      <SettingsHeader section="channels" />
      <DataState loading={loading} error={error} onRetry={refetch} skeleton={<SkeletonList rows={8} />}>
        {data && (
          <SettingsForm
            initial={{
              whatsapp: { displayName: data.whatsapp.displayName, businessHours: data.whatsapp.businessHours, hoursFrom: data.whatsapp.hoursFrom, hoursTo: data.whatsapp.hoursTo, awayMessage: data.whatsapp.awayMessage },
              email: { fromName: data.email.fromName, trackOpens: data.email.trackOpens, signature: data.email.signature },
              calendar: { syncAppointments: data.calendar.syncAppointments, defaultDuration: String(data.calendar.defaultDuration), bufferMinutes: String(data.calendar.bufferMinutes) },
            }}
            validate={(v) => ({
              waName: !v.whatsapp.displayName.trim() && t('validation.required'),
              waHours: v.whatsapp.businessHours && v.whatsapp.hoursTo <= v.whatsapp.hoursFrom && t('settings.channels.hoursOrder'),
            })}
            onSave={(v) => settingsService.saveChannels({
              ...v,
              calendar: { ...v.calendar, defaultDuration: Number(v.calendar.defaultDuration), bufferMinutes: Number(v.calendar.bufferMinutes) },
            })}
          >
            {(form) => {
              const wa = form.values.whatsapp;
              const em = form.values.email;
              const cal = form.values.calendar;
              return (
                <>
                  <SettingsSection title={t('settings.channels.whatsapp')} description={t('settings.channels.whatsappDesc')}>
                    <ConnectionBar channel="whatsapp" connected={isOn('whatsapp')} detail={`${data.whatsapp.number} · WhatsApp Business`} onChange={(v) => setConn((c) => ({ ...c, whatsapp: v }))} />
                    <div className="field-grid field-grid--2" style={{ marginTop: 16 }}>
                      <Field label={t('settings.channels.displayName')} error={form.errors.waName} required>
                        <Input name="waName" value={wa.displayName} onChange={(e) => setIn(form, 'whatsapp', 'displayName', e.target.value)} />
                      </Field>
                      <Field label={t('settings.channels.number')} hint={data.whatsapp.verified ? <span className="row" style={{ gap: 4, color: 'var(--success)' }}><BadgeCheck size={14} aria-hidden="true" />{t('settings.channels.verified')}</span> : t('settings.channels.unverified')}>
                        <Input value={data.whatsapp.number} readOnly />
                      </Field>
                    </div>
                    <Switch className="mt-12" checked={wa.businessHours} onChange={(v) => setIn(form, 'whatsapp', 'businessHours', v)} label={t('settings.channels.businessHours')} description={t('settings.channels.businessHoursDesc')} />
                    {wa.businessHours && (
                      <div className="field-grid field-grid--2">
                        <Field label={t('settings.channels.from')}><Input type="time" value={wa.hoursFrom} onChange={(e) => setIn(form, 'whatsapp', 'hoursFrom', e.target.value)} /></Field>
                        <Field label={t('settings.channels.to')} error={form.errors.waHours}><Input name="waHours" type="time" value={wa.hoursTo} onChange={(e) => setIn(form, 'whatsapp', 'hoursTo', e.target.value)} /></Field>
                        <Field label={t('settings.channels.awayMessage')} hint={t('settings.channels.awayHint')} full>
                          <Textarea value={wa.awayMessage} minRows={2} maxRows={6} maxLength={1024} onChange={(e) => setIn(form, 'whatsapp', 'awayMessage', e.target.value)} />
                        </Field>
                      </div>
                    )}
                  </SettingsSection>

                  <SettingsSection title={t('settings.channels.email')} description={t('settings.channels.emailDesc')}>
                    <ConnectionBar channel="email" connected={isOn('email')} detail={`${data.email.address} · Google Workspace`} onChange={(v) => setConn((c) => ({ ...c, email: v }))} />
                    <div className="field-grid field-grid--2" style={{ marginTop: 16 }}>
                      <Field label={t('settings.channels.fromName')}><Input value={em.fromName} onChange={(e) => setIn(form, 'email', 'fromName', e.target.value)} /></Field>
                      <Field label={t('settings.channels.address')}><Input value={data.email.address} readOnly /></Field>
                      <Field label={t('settings.channels.signature')} hint={t('settings.channels.signatureHint')} full>
                        <Textarea value={em.signature} minRows={3} maxRows={8} onChange={(e) => setIn(form, 'email', 'signature', e.target.value)} />
                      </Field>
                    </div>
                    <Switch className="mt-12" checked={em.trackOpens} onChange={(v) => setIn(form, 'email', 'trackOpens', v)} label={t('settings.channels.trackOpens')} description={t('settings.channels.trackOpensDesc')} />
                  </SettingsSection>

                  <SettingsSection title={t('settings.channels.calendar')} description={t('settings.channels.calendarDesc')}>
                    <ConnectionBar channel="calendar" connected={isOn('calendar')} detail={`${data.calendar.account} · Google Calendar`} onChange={(v) => setConn((c) => ({ ...c, calendar: v }))} />
                    <Switch className="mt-12" checked={cal.syncAppointments} onChange={(v) => setIn(form, 'calendar', 'syncAppointments', v)} label={t('settings.channels.sync')} description={t('settings.channels.syncDesc')} />
                    <div className="field-grid field-grid--2">
                      <Field label={t('settings.channels.duration')}>
                        <Select value={cal.defaultDuration} onChange={(e) => setIn(form, 'calendar', 'defaultDuration', e.target.value)} options={[30, 45, 60, 90, 120].map((m) => ({ value: String(m), label: t('settings.minutes', { n: m }) }))} />
                      </Field>
                      <Field label={t('settings.channels.buffer')} hint={t('settings.channels.bufferHint')}>
                        <Select value={cal.bufferMinutes} onChange={(e) => setIn(form, 'calendar', 'bufferMinutes', e.target.value)} options={[0, 15, 30, 45, 60].map((m) => ({ value: String(m), label: m ? t('settings.minutes', { n: m }) : t('settings.noBuffer') }))} />
                      </Field>
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
