import { Info } from 'lucide-react';
import { DataState, Field, Input, Select, SkeletonList, Textarea } from '../../components/ui/index.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { money } from '../../lib/format.js';
import { lineAmounts } from '../../lib/money.js';
import { settingsService } from '../../services/index.js';
import { SettingsForm, SettingsHeader, SettingsSection } from './shared.jsx';

const METHODS = ['ach', 'wire', 'check', 'zelle', 'card'];
const REMINDERS = [3, 7, 14, 30];
const pct = (rate) => String(Math.round(rate * 100000) / 1000);

export default function BillingSettings() {
  const t = useT();
  const { data, loading, error, refetch } = useResource(() => settingsService.billing(), []);
  return (
    <>
      <SettingsHeader section="billing" />
      <DataState loading={loading} error={error} onRetry={refetch} skeleton={<SkeletonList rows={8} />}>
        {data && (
          <SettingsForm
            initial={{ ...data, taxPct: pct(data.taxRate), invoiceDueDays: String(data.invoiceDueDays), estimateValidDays: String(data.estimateValidDays), lateFeePct: String(data.lateFeePct) }}
            validate={(v) => {
              const n = Number(v.taxPct);
              const fee = Number(v.lateFeePct);
              return {
                taxPct: v.taxPct === '' ? t('validation.required') : (Number.isNaN(n) || n < 0 || n > 20) && t('settings.billing.taxRange'),
                taxLabel: !v.taxLabel.trim() && t('validation.required'),
                lateFeePct: (Number.isNaN(fee) || fee < 0 || fee > 10) && t('settings.billing.feeRange'),
                paymentMethods: !v.paymentMethods.length && t('settings.billing.oneMethod'),
              };
            }}
            onSave={(v) => settingsService.saveBilling({
              ...v,
              taxRate: Math.round(Number(v.taxPct) * 1000) / 100000,
              invoiceDueDays: Number(v.invoiceDueDays),
              estimateValidDays: Number(v.estimateValidDays),
              lateFeePct: Number(v.lateFeePct),
            })}
          >
            {(form) => {
              const { values, errors, bind, set } = form;
              const rate = Number(values.taxPct) / 100;
              const sample = !Number.isNaN(rate) ? lineAmounts({ qty: 1, unitPrice: 1000, discountPct: 0, taxable: true }, rate).tax / 100 : 0;
              const toggleIn = (key, v) => set(key, values[key].includes(v) ? values[key].filter((x) => x !== v) : [...values[key], v].sort((a, b) => (typeof a === 'number' ? a - b : 0)));
              return (
                <>
                  <SettingsSection title={t('settings.billing.tax')} description={t('settings.billing.taxDesc')}>
                    <div className="field-grid field-grid--2">
                      <Field label={t('settings.billing.taxRate')} error={errors.taxPct} required hint={!errors.taxPct ? t('settings.billing.example', { tax: money(sample) }) : undefined}>
                        <Input {...bind('taxPct')} inputMode="decimal" suffix="%" />
                      </Field>
                      <Field label={t('settings.billing.taxLabel')} error={errors.taxLabel} required hint={t('settings.billing.taxLabelHint')}><Input {...bind('taxLabel')} /></Field>
                    </div>
                    <p className="insight" style={{ marginTop: 16 }}><Info aria-hidden="true" /><span>{t('settings.billing.taxNote')}</span></p>
                  </SettingsSection>

                  <SettingsSection title={t('settings.billing.documents')} description={t('settings.billing.documentsDesc')}>
                    <div className="field-grid field-grid--2">
                      <Field label={t('settings.billing.dueDays')}>
                        <Select {...bind('invoiceDueDays')} options={[0, 7, 15, 30, 45, 60].map((d) => ({ value: String(d), label: d ? t('settings.billing.net', { n: d }) : t('settings.billing.onReceipt') }))} />
                      </Field>
                      <Field label={t('settings.billing.validDays')}>
                        <Select {...bind('estimateValidDays')} options={[15, 30, 45, 60, 90].map((d) => ({ value: String(d), label: t('settings.days', { n: d }) }))} />
                      </Field>
                      <Field label={t('settings.billing.terms')} hint={t('settings.billing.termsHint')} full><Textarea {...bind('defaultTerms')} minRows={3} maxRows={8} /></Field>
                      <Field label={t('settings.billing.notes')} full><Textarea {...bind('defaultNotes')} minRows={2} maxRows={6} /></Field>
                    </div>
                  </SettingsSection>

                  <SettingsSection title={t('settings.billing.payments')} description={t('settings.billing.paymentsDesc')}>
                    <div className="stack">
                      <fieldset className="set-choice">
                        <legend className="field__label">{t('settings.billing.methods')}</legend>
                        <div className="check-grid">
                          {METHODS.map((m) => (
                            <label key={m} className="check-row">
                              <input type="checkbox" className="checkbox" name="paymentMethods" checked={values.paymentMethods.includes(m)} onChange={() => toggleIn('paymentMethods', m)} />
                              {t(`payment.methods.${m}`)}
                            </label>
                          ))}
                        </div>
                        {errors.paymentMethods && <p className="field__error" role="alert">{errors.paymentMethods}</p>}
                      </fieldset>
                      <Field label={t('settings.billing.instructions')} hint={t('settings.billing.instructionsHint')}><Textarea {...bind('paymentInstructions')} minRows={2} maxRows={6} /></Field>
                      <div className="field-grid field-grid--2">
                        <Field label={t('settings.billing.lateFee')} error={errors.lateFeePct} hint={t('settings.billing.lateFeeHint')}><Input {...bind('lateFeePct')} inputMode="decimal" suffix={t('settings.billing.perMonth')} /></Field>
                      </div>
                      <fieldset className="set-choice">
                        <legend className="field__label">{t('settings.billing.reminders')}</legend>
                        <div className="chip-select">
                          {REMINDERS.map((d) => (
                            <label key={d}>
                              <input type="checkbox" checked={values.reminderDays.includes(d)} onChange={() => toggleIn('reminderDays', d)} />
                              <span>{t('settings.billing.afterDue', { n: d })}</span>
                            </label>
                          ))}
                        </div>
                        <p className="field__hint">{t('settings.billing.remindersHint')}</p>
                      </fieldset>
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
