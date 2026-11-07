import { Check, ImagePlus, Trash2 } from 'lucide-react';
import { useSession } from '../../app/SessionProvider.jsx';
import { ACCENT_PRESETS, DEFAULT_ACCENT } from '../../app/theme.js';
import { Badge, Button, DataState, Field, Input, Select, SkeletonList, useToast } from '../../components/ui/index.js';
import { isEmail, isPhone } from '../../hooks/useForm.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { accentVars, contrast, isHex } from '../../lib/color.js';
import cx from '../../lib/cx.js';
import { settingsService } from '../../services/index.js';
import { SettingsForm, SettingsHeader, SettingsSection } from './shared.jsx';

const TIMEZONES = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Puerto_Rico', 'America/Santo_Domingo'];
const MAX_LOGO = 512 * 1024;

/** Live sample of the accent on buttons / links / soft highlight (only inside the preview box). */
function AccentPreview({ color }) {
  const t = useT();
  const vars = accentVars(isHex(color) ? color : DEFAULT_ACCENT);
  const ratio = contrast(vars['--accent'], '#FFFFFF');
  return (
    <div className="accent-preview" style={vars}>
      <div className="row wrap-row">
        <span className="btn btn--primary btn--sm" aria-hidden="true">{t('settings.org.sampleButton')}</span>
        <span className="accent-preview__link" aria-hidden="true">{t('settings.org.sampleLink')}</span>
        <span className="accent-preview__soft" aria-hidden="true">{t('settings.org.sampleTag')}</span>
      </div>
      <p className="field__hint" style={{ marginTop: 10 }}>
        {t('settings.org.contrast', { ratio: ratio.toFixed(2) })}{' '}
        {ratio >= 4.5 ? <Badge tone="success" dot>AA</Badge> : <Badge tone="warning" dot>{t('settings.org.lowContrast')}</Badge>}
      </p>
    </div>
  );
}

export default function OrganizationSettings() {
  const t = useT();
  const toast = useToast();
  const session = useSession();
  const { data, loading, error, refetch } = useResource(() => settingsService.organization(), []);

  const pickLogo = (form, file) => {
    if (!file) return;
    if (file.size > MAX_LOGO) { toast.show(t('settings.org.logoTooBig'), { tone: 'danger' }); return; }
    const reader = new FileReader();
    reader.onload = () => form.set('logo', reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <>
      <SettingsHeader section="organization" />
      <DataState loading={loading} error={error} onRetry={refetch} skeleton={<SkeletonList rows={8} />}>
        {data && (
          <SettingsForm
            initial={data}
            validate={(v) => ({
              name: !v.name.trim() && t('validation.required'),
              email: !v.email.trim() ? t('validation.required') : !isEmail(v.email) && t('validation.email'),
              phone: v.phone && !isPhone(v.phone) && t('validation.phone'),
              accent: !isHex(v.accent) && t('settings.org.badColor'),
            })}
            onSave={async (v) => { await settingsService.saveOrganization(v); session.refresh(); }}
          >
            {(form) => {
              const { values, errors, bind } = form;
              return (
                <>
                  <SettingsSection title={t('settings.org.company')} description={t('settings.org.companyDesc')}>
                    <div className="field-grid field-grid--2">
                      <Field label={t('settings.fields.companyName')} error={errors.name} required><Input {...bind('name')} autoComplete="organization" /></Field>
                      <Field label={t('settings.fields.legalName')}><Input {...bind('legalName')} /></Field>
                      <Field label={t('settings.fields.tagline')} full><Input {...bind('tagline')} /></Field>
                      <Field label={t('settings.fields.email')} error={errors.email} required><Input {...bind('email')} type="email" /></Field>
                      <Field label={t('settings.fields.phone')} error={errors.phone}><Input {...bind('phone')} type="tel" /></Field>
                      <Field label={t('settings.fields.website')}><Input {...bind('website')} /></Field>
                      <Field label={t('settings.fields.license')} hint={t('settings.org.licenseHint')}><Input {...bind('license')} /></Field>
                      <Field label={t('settings.fields.address')} full><Input {...bind('address')} autoComplete="street-address" /></Field>
                      <Field label={t('settings.fields.city')}><Input {...bind('city')} autoComplete="address-level2" /></Field>
                      <div className="field-grid field-grid--2">
                        <Field label={t('settings.fields.state')}><Input {...bind('state')} autoComplete="address-level1" maxLength={2} /></Field>
                        <Field label={t('settings.fields.zip')}><Input {...bind('zip')} autoComplete="postal-code" inputMode="numeric" maxLength={10} /></Field>
                      </div>
                    </div>
                  </SettingsSection>

                  <SettingsSection title={t('settings.org.brand')} description={t('settings.org.brandDesc')}>
                    <div className="stack">
                      <div className="field">
                        <span className="field__label" id="logo-label">{t('settings.fields.logo')}</span>
                        <div className="logo-pick">
                          <div className="logo-pick__box" aria-hidden="true">
                            {values.logo ? <img src={values.logo} alt="" /> : <span className="paper__brand">{String(values.name || 'G').split(' ')[0]}<span>.</span></span>}
                          </div>
                          <div className="stack-sm">
                            <div className="row wrap-row">
                              <label className="btn btn--sm">
                                <ImagePlus aria-hidden="true" />{values.logo ? t('settings.org.replaceLogo') : t('settings.org.uploadLogo')}
                                <input type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" className="sr-only" aria-labelledby="logo-label" onChange={(e) => { pickLogo(form, e.target.files[0]); e.target.value = ''; }} />
                              </label>
                              {values.logo && <Button size="sm" variant="ghost" icon={Trash2} onClick={() => form.set('logo', null)}>{t('settings.remove')}</Button>}
                            </div>
                            <p className="field__hint">{t('settings.org.logoHint')}</p>
                          </div>
                        </div>
                      </div>
                      <fieldset className="set-choice">
                        <legend className="field__label">{t('settings.fields.accent')}</legend>
                        <div className="swatches">
                          {ACCENT_PRESETS.map((p) => (
                            <label key={p.id} className={cx('swatch', values.accent.toUpperCase() === p.value && 'is-on')} title={t(`settings.accent.${p.id}`)}>
                              <input type="radio" name="accent" value={p.value} checked={values.accent.toUpperCase() === p.value} onChange={() => form.set('accent', p.value)} />
                              <span className="swatch__dot" style={{ background: p.value }} aria-hidden="true">{values.accent.toUpperCase() === p.value && <Check />}</span>
                              <span className="swatch__label">{t(`settings.accent.${p.id}`)}</span>
                            </label>
                          ))}
                        </div>
                        <div className="row wrap-row" style={{ marginTop: 12 }}>
                          <Field label={t('settings.org.custom')} error={errors.accent} className="accent-custom">
                            <Input {...bind('accent')} maxLength={7} spellCheck={false} />
                          </Field>
                          <input type="color" className="color-input" value={isHex(values.accent) ? values.accent : DEFAULT_ACCENT} onChange={(e) => form.set('accent', e.target.value.toUpperCase())} aria-label={t('settings.org.pickColor')} />
                          {values.accent.toUpperCase() !== DEFAULT_ACCENT && <Button size="sm" variant="ghost" onClick={() => form.set('accent', DEFAULT_ACCENT)}>{t('settings.org.resetBrand')}</Button>}
                        </div>
                        <AccentPreview color={values.accent} />
                      </fieldset>
                    </div>
                  </SettingsSection>

                  <SettingsSection title={t('settings.org.regional')} description={t('settings.org.regionalDesc')}>
                    <div className="field-grid field-grid--2">
                      <Field label={t('settings.fields.timezone')}>
                        <Select {...bind('timezone')} options={TIMEZONES.map((z) => ({ value: z, label: z.replace('America/', '').replace('_', ' ') }))} />
                      </Field>
                      <Field label={t('settings.fields.currency')} hint={t('settings.org.currencyHint')}>
                        <Select {...bind('currency')} disabled options={[{ value: 'USD', label: 'USD — US dollar' }]} />
                      </Field>
                      <Field label={t('settings.fields.defaultLanguage')} hint={t('settings.org.languageHint')}>
                        <Select {...bind('defaultLanguage')} options={[{ value: 'en', label: 'English' }, { value: 'es', label: 'Español' }]} />
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
