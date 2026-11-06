import { useT } from '../../i18n/index.jsx';
import useForm from '../../hooks/useForm.js';
import { lookupService, notesService } from '../../services/index.js';
import { ModalShell, FormShell } from '../shells/index.js';
import { Field, Select, Textarea, useToast } from '../ui/index.js';

/** Quick note — modal. Size: sm. The textarea auto-grows, then scrolls internally. */
export default function NoteModal({ open, onClose, projectId = '' }) {
  const t = useT();
  const toast = useToast();
  const form = useForm(
    { body: '', projectId },
    {
      validate: (v) => ({ body: !v.body.trim() && t('validation.required') }),
      onSubmit: async (v) => { await notesService.create(v); toast.show(t('note.created')); onClose(); },
    },
  );
  return (
    <ModalShell open={open} onClose={onClose} size="sm" dirty={form.dirty}>
      {({ titleId, requestClose }) => (
        <FormShell titleId={titleId} title={t('note.newTitle')} onCancel={requestClose} onSubmit={form.submit} dirty={form.dirty} saving={form.saving}>
          <div className="field-grid">
            <Field label={t('note.body')} error={form.errors.body} required><Textarea {...form.bind('body')} minRows={4} maxRows={12} /></Field>
            <Field label={t('note.related')} optional><Select {...form.bind('projectId')} placeholder="—" options={lookupService.projectOptions()} /></Field>
          </div>
        </FormShell>
      )}
    </ModalShell>
  );
}
