import { format } from 'date-fns';
import { useT } from '../../i18n/index.jsx';
import useForm from '../../hooks/useForm.js';
import { lookupService, tasksService } from '../../services/index.js';
import { ModalShell, FormShell } from '../shells/index.js';
import { DatePicker, Field, Input, Select, Textarea, useToast } from '../ui/index.js';

/** Quick task — modal (≤ 6 fields). Size: sm. */
export default function TaskModal({ open, onClose, projectId = '', onSaved }) {
  const t = useT();
  const toast = useToast();
  const form = useForm(
    { title: '', dueAt: format(new Date(), 'yyyy-MM-dd'), priority: 'medium', projectId, assigneeId: 'u_1', notes: '' },
    {
      validate: (v) => ({ title: !v.title.trim() && t('validation.required'), dueAt: !v.dueAt && t('validation.required') }),
      onSubmit: async (v) => {
        await tasksService.create({ ...v, dueAt: new Date(`${v.dueAt}T12:00:00`).toISOString(), done: false });
        toast.show(t('task.created'));
        onSaved?.();
        onClose();
      },
    },
  );
  const users = lookupService.users().map((u) => ({ value: u.id, label: u.name }));
  return (
    <ModalShell open={open} onClose={onClose} size="sm" dirty={form.dirty}>
      {({ titleId, requestClose }) => (
        <FormShell titleId={titleId} title={t('task.newTitle')} onCancel={requestClose} onSubmit={form.submit} dirty={form.dirty} saving={form.saving} submitLabel={t('common.create')}>
          <div className="field-grid">
            <Field label={t('task.title')} error={form.errors.title} required full><Input {...form.bind('title')} autoComplete="off" /></Field>
            <div className="field-grid field-grid--2">
              <Field label={t('task.due')} error={form.errors.dueAt} required><DatePicker {...form.bind('dueAt')} /></Field>
              <Field label={t('task.priority')}>
                <Select {...form.bind('priority')} options={['high', 'medium', 'low'].map((p) => ({ value: p, label: t(`task.priorities.${p}`) }))} />
              </Field>
            </div>
            <div className="field-grid field-grid--2">
              <Field label={t('task.related')} optional><Select {...form.bind('projectId')} placeholder="—" options={lookupService.projectOptions()} /></Field>
              <Field label={t('leads.fields.assignee')}><Select {...form.bind('assigneeId')} options={users} /></Field>
            </div>
            <Field label={t('task.notes')} optional full><Textarea {...form.bind('notes')} minRows={2} maxRows={6} /></Field>
          </div>
        </FormShell>
      )}
    </ModalShell>
  );
}
