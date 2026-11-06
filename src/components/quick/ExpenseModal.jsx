import { format } from 'date-fns';
import { Paperclip } from 'lucide-react';
import { useT } from '../../i18n/index.jsx';
import useForm from '../../hooks/useForm.js';
import { financeService, lookupService } from '../../services/index.js';
import { ModalShell, FormShell } from '../shells/index.js';
import { DatePicker, Field, Input, Select, useToast } from '../ui/index.js';

export const EXPENSE_CATEGORIES = ['materials', 'labor', 'furniture', 'permits', 'subcontractors', 'freight', 'overhead'];

/** New expense / purchase order — modal (short, self-contained). Size: md. Receipt upload is mocked (file name only). */
export default function ExpenseModal({ open, onClose, onSaved, projectId = '' }) {
  const t = useT();
  const toast = useToast();
  const form = useForm(
    { type: 'expense', date: format(new Date(), 'yyyy-MM-dd'), vendorId: '', projectId, category: 'materials', amount: '', receipt: '' },
    {
      validate: (v) => ({
        vendorId: !v.vendorId && t('validation.required'),
        date: !v.date && t('validation.required'),
        amount: v.amount === '' ? t('validation.required') : (Number.isNaN(Number(v.amount)) || Number(v.amount) <= 0) && t('validation.number'),
      }),
      onSubmit: async (v) => {
        const row = await financeService.createExpense({ ...v, receipt: v.receipt || null });
        toast.show(t(v.type === 'po' ? 'expenses.poCreated' : 'expenses.created'));
        onSaved?.(row);
        onClose();
      },
    },
  );
  return (
    <ModalShell open={open} onClose={onClose} size="md" dirty={form.dirty}>
      {({ titleId, requestClose }) => (
        <FormShell titleId={titleId} title={t('expenses.newTitle')} subtitle={t('expenses.newSubtitle')} onCancel={requestClose} onSubmit={form.submit} dirty={form.dirty} saving={form.saving} submitLabel={t('common.create')}>
          <div className="field-grid field-grid--2">
            <Field label={t('list.type')}>
              <Select {...form.bind('type')} options={[{ value: 'expense', label: t('contacts.expense') }, { value: 'po', label: t('expenses.po') }]} />
            </Field>
            <Field label={t('appointment.date')} error={form.errors.date} required><DatePicker {...form.bind('date')} /></Field>
            <Field label={t('projects.sel.vendor')} error={form.errors.vendorId} required>
              <Select {...form.bind('vendorId')} placeholder="—" options={lookupService.contactOptions(['partner', 'contractor'])} />
            </Field>
            <Field label={t('finance.project')} optional hint={t('expenses.overheadHint')}>
              <Select {...form.bind('projectId')} placeholder={t('expenseCategories.overhead')} options={lookupService.projectOptions()} />
            </Field>
            <Field label={t('contacts.category')}>
              <Select {...form.bind('category')} options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: t(`expenseCategories.${c}`) }))} />
            </Field>
            <Field label={t('payment.amount')} error={form.errors.amount} required><Input {...form.bind('amount')} inputMode="decimal" suffix="USD" /></Field>
            <Field label={t('expenses.receipt')} optional full>
              <label className="btn btn--sm" style={{ alignSelf: 'flex-start' }}>
                <Paperclip aria-hidden="true" />{form.values.receipt || t('expenses.attachReceipt')}
                <input type="file" accept="image/*,application/pdf" hidden onChange={(e) => form.set('receipt', e.target.files[0]?.name || '')} />
              </label>
            </Field>
          </div>
        </FormShell>
      )}
    </ModalShell>
  );
}
