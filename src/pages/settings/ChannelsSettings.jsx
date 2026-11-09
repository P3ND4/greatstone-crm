import { useState } from 'react';
import { BadgeCheck, CalendarDays, Loader2, Mail, MessageCircle, MessageSquareText, Plug, ShieldCheck, Unplug } from 'lucide-react';
import { smsInfo } from '../../lib/sms.js';
import { Badge, Button, DataState, Field, Input, Select, SkeletonList, Switch, Textarea, useToast } from '../../components/ui/index.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { settingsService } from '../../services/index.js';
import { SettingsForm, SettingsHeader, SettingsSection, setIn, useSettingsAccess } from './shared.jsx';

const ICONS = { whatsapp: MessageCircle, sms: MessageSquareText, email: Mail, calendar: CalendarDays };
const SMS_PROVIDERS = [['twilio', 'Twilio'], ['telnyx', 'Telnyx'], ['vonage', 'Vonage'], ['bandwidth', 'Bandwidth']];
const REG_TONE = { approved: 'success', pending: 'warning', rejected: 'danger', none: 'neutral' };

/** "142 chars · 1 SMS" under texts that are sent as SMS. */
function SmsHint({ text }) {
  const t = useT();
  const i = smsInfo(text);
  return <>{t('comms.sms.counter', { n: i.units, segments: i.segments, encoding: i.encoding === 'GSM-7' ? 'GSM-7' : 'Unicode' })}</>;
}

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
              sms: {
                provider: data.sms.provider, senderPrefix: data.sms.senderPrefix, complianceFooter: data.sms.complianceFooter, footerText: data.sms.footerText,
                stopReply: data.sms.stopReply, helpReply: data.sms.helpReply, startReply: data.sms.startReply,
                quietHours: data.sms.quietHours, quietFrom: data.sms.quietFrom, quietTo: data.sms.quietTo, mms: data.sms.mms,
              },
              email: { fromName: data.email.fromName, trackOpens: data.email.trackOpens, signature: data.email.signature },
              calendar: { syncAppointments: data.calendar.syncAppointments, defaultDuration: String(data.calendar.defaultDuration), bufferMinutes: String(data.calendar.bufferMinutes) },
            }}
            validate={(v) => ({
              waName: !v.whatsapp.displayName.trim() && t('validation.required'),
              waHours: v.whatsapp.businessHours && v.whatsapp.hoursTo <= v.whatsapp.hoursFrom && t('settings.channels.hoursOrder'),
              smsPrefix: v.sms.complianceFooter && !v.sms.senderPrefix.trim() && t('validation.required'),
              smsFooter: v.sms.complianceFooter && !/stop/i.test(v.sms.footerText) && t('settings.sms.footerNeedsStop'),
              smsStop: !v.sms.stopReply.trim() && t('validation.required'),
              smsHelp: !v.sms.helpReply.trim() && t('validation.required'),
            })}
            onSave={(v) => settingsService.saveChannels({
              ...v,
              calendar: { ...v.calendar, defaultDuration: Number(v.calendar.defaultDuration), bufferMinutes: Number(v.calendar.bufferMinutes) },
            })}
          >
            {(form) => {
              const wa = form.values.whatsapp;
              const em = form.values.email;
              const sm = form.values.sms;
              const reg = data.sms.registration;
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

                  <SettingsSection title={t('settings.channels.smsTitle')} description={t('settings.channels.smsDesc')}>
                    <ConnectionBar channel="sms" connected={isOn('sms')} detail={`${data.sms.number} · ${SMS_PROVIDERS.find(([id]) => id === sm.provider)?.[1]} · ${t(`settings.sms.numberType.${data.sms.numberType}`)}`} onChange={(v) => setConn((c) => ({ ...c, sms: v }))} />
                    <div className="sms-reg" aria-label={t('settings.sms.registration')}>
                      <ShieldCheck aria-hidden="true" />
                      <span className="grow" style={{ minWidth: 0 }}>
                        <strong style={{ display: 'block', fontSize: 13 }}>{t('settings.sms.registration')}</strong>
                        <span className="subtle" style={{ fontSize: 12 }}>{t('settings.sms.registrationHint', { useCase: reg.useCase })}</span>
                      </span>
                      <Badge tone={REG_TONE[reg.brand]} dot>{t('settings.sms.brand')}: {t(`settings.sms.reg.${reg.brand}`)}</Badge>
                      <Badge tone={REG_TONE[reg.campaign]} dot>{t('settings.sms.campaign')}: {t(`settings.sms.reg.${reg.campaign}`)}</Badge>
                    </div>
                    <div className="field-grid field-grid--2" style={{ marginTop: 16 }}>
                      <Field label={t('settings.sms.provider')} hint={t('settings.sms.providerHint')}>
                        <Select value={sm.provider} onChange={(e) => setIn(form, 'sms', 'provider', e.target.value)} options={SMS_PROVIDERS.map(([value, label]) => ({ value, label }))} />
                      </Field>
                      <Field label={t('settings.sms.number')}><Input value={data.sms.number} readOnly /></Field>
                    </div>
                    <Switch className="mt-12" checked={sm.complianceFooter} onChange={(v) => setIn(form, 'sms', 'complianceFooter', v)} label={t('settings.sms.footer')} description={t('settings.sms.footerDesc')} />
                    {sm.complianceFooter && (
                      <div className="field-grid field-grid--2">
                        <Field label={t('settings.sms.prefix')} error={form.errors.smsPrefix} hint={t('settings.sms.prefixHint')}>
                          <Input name="smsPrefix" value={sm.senderPrefix} onChange={(e) => setIn(form, 'sms', 'senderPrefix', e.target.value)} />
                        </Field>
                        <Field label={t('settings.sms.footerText')} error={form.errors.smsFooter}>
                          <Input name="smsFooter" value={sm.footerText} onChange={(e) => setIn(form, 'sms', 'footerText', e.target.value)} />
                        </Field>
                      </div>
                    )}
                    <div className="field-grid" style={{ marginTop: 16 }}>
                      <Field label={t('settings.sms.stopReply')} error={form.errors.smsStop} hint={<SmsHint text={sm.stopReply} />} required>
                        <Textarea name="smsStop" value={sm.stopReply} minRows={2} maxRows={4} onChange={(e) => setIn(form, 'sms', 'stopReply', e.target.value)} />
                      </Field>
                      <Field label={t('settings.sms.helpReply')} error={form.errors.smsHelp} hint={<SmsHint text={sm.helpReply} />} required>
                        <Textarea name="smsHelp" value={sm.helpReply} minRows={2} maxRows={4} onChange={(e) => setIn(form, 'sms', 'helpReply', e.target.value)} />
                      </Field>
                      <Field label={t('settings.sms.startReply')} hint={<SmsHint text={sm.startReply} />}>
                        <Textarea value={sm.startReply} minRows={2} maxRows={4} onChange={(e) => setIn(form, 'sms', 'startReply', e.target.value)} />
                      </Field>
                    </div>
                    <Switch className="mt-12" checked={sm.quietHours} onChange={(v) => setIn(form, 'sms', 'quietHours', v)} label={t('settings.sms.quiet')} description={t('settings.sms.quietDesc')} />
                    {sm.quietHours && (
                      <div className="field-grid field-grid--2">
                        <Field label={t('settings.sms.quietFrom')}><Input type="time" value={sm.quietFrom} onChange={(e) => setIn(form, 'sms', 'quietFrom', e.target.value)} /></Field>
                        <Field label={t('settings.sms.quietTo')}><Input type="time" value={sm.quietTo} onChange={(e) => setIn(form, 'sms', 'quietTo', e.target.value)} /></Field>
                      </div>
                    )}
                    <Switch className="mt-12" checked={sm.mms} onChange={(v) => setIn(form, 'sms', 'mms', v)} label={t('settings.sms.mms')} description={t('settings.sms.mmsDesc')} />
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
