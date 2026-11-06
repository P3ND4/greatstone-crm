import { useNavigate, useParams } from 'react-router-dom';
import { addMonths, format } from 'date-fns';
import { FormPage, PageShell } from '../../components/shells/index.js';
import { Card, DataState, DatePicker, Field, Input, Select, Skeleton, Textarea, useToast } from '../../components/ui/index.js';
import { NEIGHBORHOODS } from '../../data/constants.js';
import useForm from '../../hooks/useForm.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { lookupService, projectsService } from '../../services/index.js';
import { PROJECT_STATUSES } from './ProjectsPage.jsx';

const toDate = (iso) => (iso ? format(new Date(iso), 'yyyy-MM-dd') : '');
const num = (v) => (v === '' || v == null ? '' : String(v));

/** Route entry: /projects/new and /projects/:id/edit. Long form with sections → PAGE. */
export default function ProjectFormRoute() {
  const t = useT();
  const { id } = useParams();
  const { data, loading, error, refetch } = useResource(() => (id ? projectsService.get(id) : Promise.resolve(null)), [id]);
  if (id && (loading || error)) {
    return (
      <PageShell fallback="/projects" breadcrumbs={[{ label: t('nav.projects'), to: '/projects' }, { label: t('common.edit') }]}>
        <Card><DataState loading={loading} error={error} onRetry={refetch} skeleton={<Skeleton height={320} />} /></Card>
      </PageShell>
    );
  }
  return <ProjectForm key={id || 'new'} project={data?.project} />;
}

function ProjectForm({ project }) {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const editing = Boolean(project);
  const today = new Date();
  const form = useForm(
    {
      name: project?.name ?? '',
      clientId: project?.clientId ?? '',
      status: project?.status ?? 'planning',
      managerId: project?.managerId ?? 'u_1',
      address: project?.address ?? '',
      neighborhood: project?.neighborhood ?? '',
      startDate: toDate(project?.startDate) || format(today, 'yyyy-MM-dd'),
      endDate: toDate(project?.endDate) || format(addMonths(today, 4), 'yyyy-MM-dd'),
      budget: num(project?.budget),
      contractValue: num(project?.contractValue),
      progress: String(Math.round((project?.progress ?? 0) * 100)),
      partnerIds: project?.partnerIds ?? [],
      description: project?.description ?? '',
    },
    {
      validate: (v) => ({
        name: !v.name.trim() && t('validation.required'),
        clientId: !v.clientId && t('validation.required'),
        startDate: !v.startDate && t('validation.required'),
        endDate: !v.endDate ? t('validation.required') : v.endDate < v.startDate && t('projects.form.endBeforeStart'),
        budget: v.budget === '' ? t('validation.required') : (Number.isNaN(Number(v.budget)) || Number(v.budget) < 0) && t('validation.number'),
        contractValue: v.contractValue !== '' && (Number.isNaN(Number(v.contractValue)) || Number(v.contractValue) < 0) && t('validation.number'),
        progress: (Number.isNaN(Number(v.progress)) || Number(v.progress) < 0 || Number(v.progress) > 100) && t('projects.form.progressRange'),
      }),
      onSubmit: async (v) => {
        const payload = {
          ...v,
          budget: Number(v.budget),
          contractValue: v.contractValue === '' ? Number(v.budget) : Number(v.contractValue),
          progress: Number(v.progress) / 100,
          startDate: new Date(`${v.startDate}T12:00:00`).toISOString(),
          endDate: new Date(`${v.endDate}T12:00:00`).toISOString(),
          neighborhood: v.neighborhood || lookupService.contact(v.clientId)?.neighborhood || '',
        };
        if (editing) {
          await projectsService.update(project.id, payload);
          toast.show(t('projects.updated'));
          navigate(`/projects/${project.id}`, { replace: true });
        } else {
          const created = await projectsService.create(payload);
          toast.show(t('projects.createdToast'));
          navigate(`/projects/${created.id}`, { replace: true });
        }
      },
    },
  );
  const { bind, errors, values } = form;
  const partnerOptions = lookupService.contactOptions(['partner', 'contractor']);
  const togglePartner = (pid) => form.set('partnerIds', values.partnerIds.includes(pid) ? values.partnerIds.filter((x) => x !== pid) : [...values.partnerIds, pid]);

  return (
    <FormPage
      fallback={editing ? `/projects/${project.id}` : '/projects'}
      breadcrumbs={[
        { label: t('nav.projects'), to: '/projects' },
        ...(editing ? [{ label: project.name, to: `/projects/${project.id}` }, { label: t('common.edit') }] : [{ label: t('projects.new') }]),
      ]}
      title={editing ? `${t('common.edit')}: ${project.name}` : t('projects.new')}
      subtitle={t('projects.form.subtitle')}
      dirty={form.dirty}
      saving={form.saving}
      onSubmit={form.submit}
      submitLabel={editing ? t('common.save') : t('common.create')}
    >
      <div className="form-section">
        <h3 className="form-section__title">{t('projects.form.general')}</h3>
        <div className="field-grid field-grid--2">
          <Field label={t('projects.form.name')} error={errors.name} required full><Input {...bind('name')} placeholder="Bayshore Condo Kitchen" /></Field>
          <Field label={t('projects.columns.client')} error={errors.clientId} required>
            <Select {...bind('clientId')} placeholder="—" options={lookupService.contactOptions(['client'])} />
          </Field>
          <Field label={t('list.status')}>
            <Select {...bind('status')} options={PROJECT_STATUSES.map((s) => ({ value: s, label: t(`projectStatus.${s}`) }))} />
          </Field>
          <Field label={t('projects.columns.manager')}>
            <Select {...bind('managerId')} options={lookupService.users().map((u) => ({ value: u.id, label: u.name }))} />
          </Field>
          <Field label={t('leads.fields.neighborhood')} optional>
            <Select {...bind('neighborhood')} placeholder="—" options={NEIGHBORHOODS.map((n) => ({ value: n, label: n }))} />
          </Field>
          <Field label={t('contacts.address')} optional full><Input {...bind('address')} autoComplete="street-address" /></Field>
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section__title">{t('projects.form.scheduleBudget')}</h3>
        <div className="field-grid field-grid--2">
          <Field label={t('projects.form.start')} error={errors.startDate} required><DatePicker {...bind('startDate')} /></Field>
          <Field label={t('projects.form.end')} error={errors.endDate} required><DatePicker {...bind('endDate')} /></Field>
          <Field label={t('projects.form.budget')} error={errors.budget} required hint={t('projects.form.budgetHint')}><Input {...bind('budget')} inputMode="decimal" suffix="USD" /></Field>
          <Field label={t('projects.form.contract')} error={errors.contractValue} optional hint={t('projects.form.contractHint')}><Input {...bind('contractValue')} inputMode="decimal" suffix="USD" /></Field>
          <Field label={t('projects.form.progress')} error={errors.progress}><Input {...bind('progress')} inputMode="numeric" suffix="%" /></Field>
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section__title">{t('projects.form.partners')}</h3>
        <fieldset className="check-grid">
          <legend className="sr-only">{t('projects.form.partners')}</legend>
          {partnerOptions.map((o) => (
            <label key={o.value} className="check-row">
              <input type="checkbox" className="checkbox" checked={values.partnerIds.includes(o.value)} onChange={() => togglePartner(o.value)} />
              <span className="truncate">{o.label}</span>
            </label>
          ))}
        </fieldset>
      </div>

      <div className="form-section">
        <h3 className="form-section__title">{t('projects.form.notes')}</h3>
        <Field label={t('leads.fields.description')} optional><Textarea {...bind('description')} minRows={3} maxRows={10} /></Field>
      </div>
    </FormPage>
  );
}
