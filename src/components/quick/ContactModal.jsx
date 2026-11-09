import { useSession } from '../../app/SessionProvider.jsx';
import { useT } from '../../i18n/index.jsx';
import useForm, { isEmail, isPhone } from '../../hooks/useForm.js';
import { contactsService } from '../../services/index.js';
import { ModalShell, FormShell } from '../shells/index.js';
import { Field, Input, Select, useToast } from '../ui/index.js';

export const CONTACT_TYPES = ['client', 'partner', 'referrer', 'architect', 'contractor'];

/** Quick add / edit contact — modal (6 fields). Size: md. Full record lives on the contact page. */
export default function ContactModal({ open, onClose, contact, type = 'client', onSaved }) {
  const t = useT();
  const session = useSession();
  const toast = useToast();
  const editing = Boolean(contact);
  const form = useForm(
    {
      firstName: contact?.firstName ?? '', lastName: contact?.lastName ?? '', type: contact?.type ?? type,
      email: contact?.email ?? '', phone: contact?.phone ?? '', company: contact?.company ?? '',
    },
    {
      validate: (v) => ({
        firstName: !v.firstName.trim() && t('validation.required'),
        lastName: !v.lastName.trim() && t('validation.required'),
        email: v.email && !isEmail(v.email) && t('validation.email'),
        phone: v.phone && !isPhone(v.phone) && t('validation.phone'),
      }),
      onSubmit: async (v) => {
        const payload = { ...v, name: `${v.firstName.trim()} ${v.lastName.trim()}`, company: v.company || null };
        const saved = editing
          ? await contactsService.update(contact.id, payload)
          : await contactsService.create({ ...payload, tags: [], source: v.type === 'client' ? 'referral' : 'partner', ownerId: session.user.id, neighborhood: '', address: null });
        toast.show(editing ? t('contacts.updated') : t('contacts.created'));
        onSaved?.(saved);
        onClose();
      },
    },
  );
  return (
    <ModalShell open={open} onClose={onClose} size="md" dirty={form.dirty}>
      {({ titleId, requestClose }) => (
        <FormShell titleId={titleId} title={editing ? t('contacts.editTitle') : t('contacts.newTitle')} onCancel={requestClose} onSubmit={form.submit} dirty={form.dirty} saving={form.saving} submitLabel={editing ? t('common.save') : t('common.create')}>
          <div className="field-grid field-grid--2">
            <Field label={t('leads.fields.firstName')} error={form.errors.firstName} required><Input {...form.bind('firstName')} autoComplete="off" /></Field>
            <Field label={t('leads.fields.lastName')} error={form.errors.lastName} required><Input {...form.bind('lastName')} autoComplete="off" /></Field>
            <Field label={t('list.type')}>
              <Select {...form.bind('type')} options={CONTACT_TYPES.map((x) => ({ value: x, label: t(`contactTypes.${x}`) }))} />
            </Field>
            <Field label={t('contacts.company')} optional><Input {...form.bind('company')} /></Field>
            <Field label={t('leads.fields.email')} error={form.errors.email} optional><Input type="email" {...form.bind('email')} /></Field>
            <Field label={t('leads.fields.phone')} error={form.errors.phone} optional><Input type="tel" {...form.bind('phone')} /></Field>
          </div>
        </FormShell>
      )}
    </ModalShell>
  );
}
