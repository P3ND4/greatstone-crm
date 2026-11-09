import { FormShell, ModalShell } from '../shells/index.js';
import { Field, Select, Textarea, useToast } from '../ui/index.js';
import useForm from '../../hooks/useForm.js';
import { useT } from '../../i18n/index.jsx';
import { communicationsService } from '../../services/index.js';

export const CONSENT_SOURCES = ['web_form', 'signed_contract', 'verbal', 'reply_start'];

/** Record SMS consent collected outside a text (who, how, when) — needed before reminders or promotions. */
export default function ConsentModal({ contact, onClose, onSaved }) {
  const t = useT();
  const toast = useToast();
  const form = useForm({ source: 'web_form', note: '' }, {
    onSubmit: async (v) => {
      await communicationsService.recordSmsConsent(contact.id, v);
      toast.show(t('comms.sms.consentSaved', { name: contact.name }));
      onSaved?.();
      onClose();
    },
  });
  return (
    <ModalShell open onClose={onClose} size="sm" dirty={form.dirty}>
      {({ titleId, requestClose }) => (
        <FormShell titleId={titleId} title={t('comms.sms.recordConsent')} subtitle={contact.name} onCancel={requestClose} onSubmit={form.submit} dirty={form.dirty} saving={form.saving} submitLabel={t('comms.sms.saveConsent')}>
          <div className="stack">
            <Field label={t('comms.sms.consentSource')}>
              <Select {...form.bind('source')} options={CONSENT_SOURCES.filter((s) => s !== 'reply_start').map((s) => ({ value: s, label: t(`comms.sms.source.${s}`) }))} />
            </Field>
            <Field label={t('comms.sms.consentNote')} optional hint={t('comms.sms.consentNoteHint')}>
              <Textarea {...form.bind('note')} minRows={2} maxRows={4} />
            </Field>
            <p className="field__hint">{t('comms.sms.consentLegal')}</p>
          </div>
        </FormShell>
      )}
    </ModalShell>
  );
}
