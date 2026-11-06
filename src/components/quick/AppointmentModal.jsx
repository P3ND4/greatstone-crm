import { format } from 'date-fns';
import { useT } from '../../i18n/index.jsx';
import useForm from '../../hooks/useForm.js';
import { appointmentsService, lookupService } from '../../services/index.js';
import { ModalShell, FormShell } from '../shells/index.js';
import { DatePicker, Field, Input, Select, useToast } from '../ui/index.js';

const TYPES = ['consultation', 'siteVisit', 'showroom', 'virtual', 'install'];
const DURATIONS = [30, 60, 90, 120, 180];

/** Quick appointment — modal. Size: md (two-column grid collapses to one on small widths). */
export default function AppointmentModal({ open, onClose, contactId = '', projectId = '', date: presetDate, time: presetTime, appointment, onSaved }) {
  const editing = Boolean(appointment);
  const start = appointment ? new Date(appointment.start) : null;
  const t = useT();
  const toast = useToast();
  const form = useForm(
    appointment
      ? {
        title: appointment.title, type: appointment.type, date: format(start, 'yyyy-MM-dd'), time: format(start, 'HH:mm'),
        durationMin: String(appointment.durationMin), contactId: appointment.contactId || '', projectId: appointment.projectId || '', location: appointment.location || '',
      }
      : { title: '', type: 'consultation', date: presetDate || format(new Date(), 'yyyy-MM-dd'), time: presetTime || '10:00', durationMin: '60', contactId, projectId, location: '' },
    {
      validate: (v) => ({
        title: !v.title.trim() && t('validation.required'),
        date: !v.date && t('validation.required'),
        time: !v.time && t('validation.required'),
        contactId: !v.contactId && t('validation.required'),
      }),
      onSubmit: async (v) => {
        const payload = { title: v.title, type: v.type, contactId: v.contactId, projectId: v.projectId || null, location: v.location, start: new Date(`${v.date}T${v.time}:00`).toISOString(), durationMin: Number(v.durationMin) };
        const saved = editing ? await appointmentsService.update(appointment.id, payload) : await appointmentsService.create({ ...payload, assigneeId: 'u_1' });
        toast.show(editing ? t('appointment.updated') : t('appointment.created'));
        onSaved?.(saved);
        onClose();
      },
    },
  );
  return (
    <ModalShell open={open} onClose={onClose} size="md" dirty={form.dirty}>
      {({ titleId, requestClose }) => (
        <FormShell titleId={titleId} title={editing ? t('appointment.editTitle') : t('appointment.newTitle')} onCancel={requestClose} onSubmit={form.submit} dirty={form.dirty} saving={form.saving} submitLabel={editing ? t('common.save') : t('common.create')}>
          <div className="field-grid field-grid--2">
            <Field label={t('appointment.title')} error={form.errors.title} required full><Input {...form.bind('title')} autoComplete="off" /></Field>
            <Field label={t('appointment.type')}>
              <Select {...form.bind('type')} options={TYPES.map((x) => ({ value: x, label: t(`appointmentTypes.${x}`) }))} />
            </Field>
            <Field label={t('appointment.contact')} error={form.errors.contactId} required>
              <Select {...form.bind('contactId')} placeholder="—" options={lookupService.contactOptions(['client', 'partner', 'architect', 'contractor'])} />
            </Field>
            <Field label={t('appointment.date')} error={form.errors.date} required><DatePicker {...form.bind('date')} /></Field>
            <div className="field-grid field-grid--2">
              <Field label={t('appointment.time')} error={form.errors.time} required><Input type="time" step={900} {...form.bind('time')} /></Field>
              <Field label={t('appointment.duration')}>
                <Select {...form.bind('durationMin')} options={DURATIONS.map((d) => ({ value: String(d), label: `${d} min` }))} />
              </Field>
            </div>
            <Field label={t('task.related')} optional><Select {...form.bind('projectId')} placeholder="—" options={lookupService.projectOptions()} /></Field>
            <Field label={t('appointment.location')} optional><Input {...form.bind('location')} /></Field>
          </div>
        </FormShell>
      )}
    </ModalShell>
  );
}
