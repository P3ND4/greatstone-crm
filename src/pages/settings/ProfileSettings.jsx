import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, CheckCircle2, Download, Monitor, Moon, Share, SquarePlus, Sun, WifiOff } from 'lucide-react';
import { notificationPermission, showLocalNotification, usePwa } from '../../app/pwa.js';
import { useSession } from '../../app/SessionProvider.jsx';
import { Avatar, Badge, Button, DataState, Field, Input, Select, SkeletonList, useToast } from '../../components/ui/index.js';
import { isEmail, isPhone } from '../../hooks/useForm.js';
import useResource from '../../hooks/useResource.js';
import { useI18n } from '../../i18n/index.jsx';
import cx from '../../lib/cx.js';
import { settingsService } from '../../services/index.js';
import { SettingsForm, SettingsHeader, SettingsSection } from './shared.jsx';

const THEMES = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
];

/** "This device": install as an app, local notifications, offline. Not part of the form (acts immediately). */
function DeviceSection() {
  const { t } = useI18n();
  const toast = useToast();
  const pwa = usePwa();
  const { hash } = useLocation();
  const ref = useRef(null);
  const [perm, setPerm] = useState(notificationPermission);
  useEffect(() => { if (hash === '#device') ref.current?.scrollIntoView({ block: 'start' }); }, [hash]);

  const install = async () => {
    const outcome = await pwa.install();
    if (outcome === 'accepted') toast.show(t('pwa.installed'));
  };
  const enable = async () => {
    const result = await Notification.requestPermission();
    setPerm(result);
    if (result === 'granted') await showLocalNotification('Greatstone CRM', t('pwa.testBody'));
  };
  return (
    <div id="device" ref={ref} className="set-anchor">
      <SettingsSection title={t('pwa.deviceTitle')} description={t('pwa.deviceDesc')}>
        <div className="device-row">
          <span className="device-row__icon" aria-hidden="true"><Download /></span>
          <div className="grow" style={{ minWidth: 0 }}>
            <p className="device-row__title">{t('pwa.appTitle')}</p>
            <p className="device-row__desc">
              {pwa.installed ? t('pwa.appInstalled') : pwa.canInstall ? t('pwa.appCan') : pwa.isIOS ? t('pwa.appIos') : t('pwa.appManual')}
            </p>
            {!pwa.installed && pwa.isIOS && (
              <ol className="ios-steps">
                <li><Share aria-hidden="true" />{t('pwa.ios1')}</li>
                <li><SquarePlus aria-hidden="true" />{t('pwa.ios2')}</li>
              </ol>
            )}
          </div>
          {pwa.installed
            ? <Badge tone="success" icon={CheckCircle2}>{t('pwa.installedBadge')}</Badge>
            : pwa.canInstall && <Button variant="primary" size="sm" icon={Download} onClick={install}>{t('pwa.install')}</Button>}
        </div>
        <div className="device-row">
          <span className="device-row__icon" aria-hidden="true"><Bell /></span>
          <div className="grow" style={{ minWidth: 0 }}>
            <p className="device-row__title">{t('pwa.notifTitle')}</p>
            <p className="device-row__desc">{t(`pwa.notif.${perm}`)}</p>
          </div>
          {perm === 'default' && <Button size="sm" icon={Bell} onClick={enable}>{t('pwa.enable')}</Button>}
          {perm === 'granted' && <Button size="sm" variant="ghost" onClick={() => showLocalNotification('Greatstone CRM', t('pwa.testBody'))}>{t('pwa.test')}</Button>}
        </div>
        <div className="device-row">
          <span className="device-row__icon" aria-hidden="true"><WifiOff /></span>
          <div className="grow" style={{ minWidth: 0 }}>
            <p className="device-row__title">{t('pwa.offlineTitle')}</p>
            <p className="device-row__desc">{t('pwa.offlineDesc')}</p>
          </div>
          <Badge tone={pwa.online ? 'success' : 'warning'} dot>{pwa.online ? t('pwa.online') : t('pwa.offline')}</Badge>
        </div>
      </SettingsSection>
    </div>
  );
}

/** My profile & preferences (language, theme). Theme is remembered per browser. */
export default function ProfileSettings() {
  const { t, locale, setLocale } = useI18n();
  const session = useSession();
  const { data, loading, error, refetch } = useResource(() => settingsService.profile(session.user.id), [session.user.id]);

  return (
    <>
      <SettingsHeader section="profile" />
      <DataState loading={loading} error={error} onRetry={refetch} skeleton={<SkeletonList rows={6} />}>
        {data && (
          <SettingsForm
            initial={{ name: data.name, title: data.title, email: data.email, phone: data.phone, language: locale, theme: session.theme }}
            validate={(v) => ({
              name: !v.name.trim() && t('validation.required'),
              email: !v.email.trim() ? t('validation.required') : !isEmail(v.email) && t('validation.email'),
              phone: v.phone && !isPhone(v.phone) && t('validation.phone'),
            })}
            onSave={async (v) => {
              await settingsService.saveProfile(session.user.id, v);
              setLocale(v.language);
              session.setTheme(v.theme);
              session.refresh();
            }}
          >
            {(form) => (
              <>
                <SettingsSection title={t('settings.profile.personal')} description={t('settings.profile.personalDesc')}>
                  <div className="row" style={{ marginBottom: 16 }}>
                    <Avatar name={form.values.name || data.name} size="lg" dark title="" />
                    <div style={{ minWidth: 0 }}>
                      <p className="truncate" style={{ fontWeight: 600 }}>{form.values.name || '—'}</p>
                      <Badge>{t(`roles.${data.role}`)}</Badge>
                    </div>
                  </div>
                  <div className="field-grid field-grid--2">
                    <Field label={t('settings.fields.fullName')} error={form.errors.name} required><Input {...form.bind('name')} autoComplete="name" /></Field>
                    <Field label={t('settings.fields.jobTitle')}><Input {...form.bind('title')} autoComplete="organization-title" /></Field>
                    <Field label={t('settings.fields.email')} error={form.errors.email} required><Input {...form.bind('email')} type="email" autoComplete="email" /></Field>
                    <Field label={t('settings.fields.phone')} error={form.errors.phone} optional><Input {...form.bind('phone')} type="tel" autoComplete="tel" /></Field>
                  </div>
                </SettingsSection>
                <SettingsSection title={t('settings.profile.prefs')} description={t('settings.profile.prefsDesc')}>
                  <div className="stack">
                    <Field label={t('settings.fields.language')}>
                      <Select {...form.bind('language')} options={[{ value: 'en', label: 'English' }, { value: 'es', label: 'Español' }]} />
                    </Field>
                    <fieldset className="set-choice">
                      <legend className="field__label">{t('settings.fields.theme')}</legend>
                      <div className="theme-picker">
                        {THEMES.map(({ value, icon: Icon }) => (
                          <label key={value} className={cx('theme-opt', form.values.theme === value && 'is-on')}>
                            <input type="radio" name="theme" value={value} checked={form.values.theme === value} onChange={() => form.set('theme', value)} />
                            <span className={`theme-opt__preview theme-opt__preview--${value}`} aria-hidden="true"><span /><span /><span /></span>
                            <span className="theme-opt__label"><Icon aria-hidden="true" />{t(`settings.theme.${value}`)}</span>
                          </label>
                        ))}
                      </div>
                      <p className="field__hint">{t('settings.profile.themeHint')}</p>
                    </fieldset>
                  </div>
                </SettingsSection>
              </>
            )}
          </SettingsForm>
        )}
      </DataState>
      {data && <div style={{ marginTop: 24 }}><DeviceSection /></div>}
    </>
  );
}
