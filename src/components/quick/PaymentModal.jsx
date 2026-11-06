import { format } from 'date-fns';
import { useT } from '../../i18n/index.jsx';
import useForm from '../../hooks/useForm.js';
import { invoicesService } from '../../services/index.js';
import { money } from '../../lib/format.js';
import { ModalShell, FormShell } from '../shells/index.js';
import { DatePicker, Field, Input, Select, useToast } from '../ui/index.js';

const METHODS = ['wire', 'ach', 'check', 'card', 'zelle'];

/** Record a payment against an invoice — modal (4 fields). Size: sm. */
export default function PaymentModal({ open, onClose, invoice, onSaved }) {
  const t = useT();
  const toast = useToast();
  const balance = Math.round((invoice.total - invoice.paid) * 100) / 100;
  const form = useForm(
    { amount: String(balance), date: format(new Date(), 'yyyy-MM-dd'), method: 'wire', reference: '' },
    {
      validate: (v) => {
        const n = Number(v.amount);
        return {
          amount: v.amount === '' ? t('validation.required') : (Number.isNaN(n) || n <= 0) ? t('validation.number') : n > balance + 0.001 && t('payment.overBalance', { balance: money(balance) }),
          date: !v.date && t('validation.required'),
        };
      },
      onSubmit: async (v) => {
        const paid = Math.round((invoice.paid + Number(v.amount)) * 100) / 100;
        const status = paid >= invoice.total - 0.001 ? 'paid' : 'partial';
        const saved = await invoicesService.update(invoice.id, { paid, status, paidAt: status === 'paid' ? new Date(`${v.date}T12:00:00`).toISOString() : invoice.paidAt });
        toast.show(t('payment.recorded', { amount: money(Number(v.amount)), number: invoice.number }));
        onSaved?.(saved);
        onClose();
      },
    },
  );
  return (
    <ModalShell open={open} onClose={onClose} size="sm" dirty={form.dirty}>
      {({ titleId, requestClose }) => (
        <FormShell titleId={titleId} title={t('payment.title', { number: invoice.number })} subtitle={t('payment.balance', { balance: money(balance) })} onCancel={requestClose} onSubmit={form.submit} dirty={form.dirty} saving={form.saving} submitLabel={t('payment.submit')}>
          <div className="field-grid field-grid--2">
            <Field label={t('payment.amount')} error={form.errors.amount} required><Input {...form.bind('amount')} inputMode="decimal" suffix="USD" /></Field>
            <Field label={t('payment.date')} error={form.errors.date} required><DatePicker {...form.bind('date')} /></Field>
            <Field label={t('payment.method')}><Select {...form.bind('method')} options={METHODS.map((m) => ({ value: m, label: t(`payment.methods.${m}`) }))} /></Field>
            <Field label={t('payment.reference')} optional><Input {...form.bind('reference')} /></Field>
          </div>
        </FormShell>
      )}
    </ModalShell>
  );
}
