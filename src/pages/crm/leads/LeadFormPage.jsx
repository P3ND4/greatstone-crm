import { useNavigate, useParams } from 'react-router-dom';
import { FormPage, PageShell } from '../../../components/shells/index.js';
import { Card, DataState, Field, Input, Select, Skeleton, Textarea, useToast } from '../../../components/ui/index.js';
import useResource from '../../../hooks/useResource.js';
import { useT } from '../../../i18n/index.jsx';
import useForm, { isEmail, isPhone } from '../../../hooks/useForm.js';
import { leadsService, lookupService } from '../../../services/index.js';

const SERVICES = ['design', 'remodel', 'kitchen', 'bath', 'closet', 'flooring', 'staging', 'planning', 'furnishing'];
const SOURCES = ['referral', 'instagram', 'website', 'google', 'houzz', 'facebook', 'partner', 'event'];
const STARTS = ['asap', '1-3m', '3-6m', '6m+', 'unsure'];
const NEIGHBORHOODS = ['Coconut Grove', 'Brickell', 'Coral Gables', 'Miami Beach', 'Key Biscayne', 'Edgewater', 'Pinecrest', 'Bal Harbour', 'Sunny Isles', 'Design District'];

/**
 * New Lead — full form on its own route (> 6 fields, sections) → PAGE pattern.
 * Base fields mirror the client's website quote form: first/last name, email, phone, start, description.
 */
const EMPTY = {
  firstName: '', lastName: '', email: '', phone: '', startWhen: '', description: '',
  source: 'referral', referredById: '', budget: '', serviceType: 'design', neighborhood: '', score: 50, assigneeId: 'u_1',
};

/** Route entry: /crm/leads/new (create) and /crm/leads/:id/edit (edit, loads the lead first). */
export default function LeadFormRoute() {
  const t = useT();
  const { id } = useParams();
  const { data, loading, error, refetch } = useResource(() => (id ? leadsService.get(id) : Promise.resolve(null)), [id]);
  if (id && (loading || error)) {
    return (
      <PageShell fallback="/crm/leads" breadcrumbs={[{ label: t('leads.title'), to: '/crm/leads' }, { label: t('common.edit') }]}>
        <Card><DataState error={error} onRetry={refetch} loading={loading} skeleton={<div className="stack"><Skeleton height={28} width="40%" /><Skeleton height={200} /></div>} /></Card>
      </PageShell>
    );
  }
  const initial = data
    ? Object.fromEntries(Object.keys(EMPTY).map((k) => [k, data[k] ?? EMPTY[k]]))
    : EMPTY;
  if (initial.budget == null) initial.budget = '';
  return <LeadFormPage key={id || 'new'} lead={data} initial={{ ...initial, budget: initial.budget === '' ? '' : String(initial.budget), referredById: initial.referredById || '' }} />;
}

function LeadFormPage({ lead, initial }) {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const editing = Boolean(lead);
  const form = useForm(
    initial,
    {
      validate: (v) => ({
        firstName: !v.firstName.trim() && t('validation.required'),
        lastName: !v.lastName.trim() && t('validation.required'),
        email: !v.email.trim() ? t('validation.required') : !isEmail(v.email) && t('validation.email'),
        phone: !v.phone.trim() ? t('validation.required') : !isPhone(v.phone) && t('validation.phone'),
        startWhen: !v.startWhen && t('validation.required'),
        description: !v.description.trim() && t('validation.required'),
        budget: v.budget !== '' && (Number.isNaN(Number(v.budget)) || Number(v.budget) < 0) && t('validation.number'),
      }),
      onSubmit: async (v) => {
        const payload = {
          ...v,
          name: `${v.firstName.trim()} ${v.lastName.trim()}`,
          budget: v.budget === '' ? null : Number(v.budget),
          score: Number(v.score),
          referredById: v.referredById || null,
        };
        if (editing) {
          await leadsService.update(lead.id, payload);
          toast.show(t('leads.updated'));
          navigate(`/crm/leads/${lead.id}`, { replace: true });
        } else {
          const created = await leadsService.create({ ...payload, status: 'new' });
          toast.show(t('leads.created'));
          navigate('/crm/leads', { replace: true, state: { highlight: created.id } });
        }
      },
    },
  );
  const { bind, errors } = form;
  const users = lookupService.users().map((u) => ({ value: u.id, label: u.name }));

  return (
    <FormPage
      fallback={editing ? `/crm/leads/${lead.id}` : '/crm/leads'}
      breadcrumbs={[
        { label: t('nav.crm'), to: '/crm/leads' },
        { label: t('leads.title'), to: '/crm/leads' },
        ...(editing ? [{ label: lead.name, to: `/crm/leads/${lead.id}` }, { label: t('common.edit') }] : [{ label: t('leads.new') }]),
      ]}
      title={editing ? `${t('common.edit')}: ${lead.name}` : t('leads.new')}
      subtitle={t('leads.newSubtitle')}
      dirty={form.dirty}
      saving={form.saving}
      onSubmit={form.submit}
      submitLabel={editing ? t('common.save') : t('common.create')}
    >
      <div className="form-section">
        <h3 className="form-section__title">{t('leads.sections.contact')}</h3>
        <div className="field-grid field-grid--2">
          <Field label={t('leads.fields.firstName')} error={errors.firstName} required><Input {...bind('firstName')} autoComplete="given-name" /></Field>
          <Field label={t('leads.fields.lastName')} error={errors.lastName} required><Input {...bind('lastName')} autoComplete="family-name" /></Field>
          <Field label={t('leads.fields.email')} error={errors.email} required><Input type="email" {...bind('email')} autoComplete="email" inputMode="email" /></Field>
          <Field label={t('leads.fields.phone')} error={errors.phone} required><Input type="tel" {...bind('phone')} autoComplete="tel" placeholder="(305) 555-0100" /></Field>
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section__title">{t('leads.sections.project')}</h3>
        <div className="field-grid field-grid--2">
          <Field label={t('leads.fields.startWhen')} error={errors.startWhen} required>
            <Select {...bind('startWhen')} placeholder="—" options={STARTS.map((s) => ({ value: s, label: t(`leads.startOptions.${s}`) }))} />
          </Field>
          <Field label={t('leads.fields.serviceType')}>
            <Select {...bind('serviceType')} options={SERVICES.map((s) => ({ value: s, label: t(`services.${s}`) }))} />
          </Field>
          <Field label={t('leads.fields.neighborhood')} optional>
            <Select {...bind('neighborhood')} placeholder="—" options={NEIGHBORHOODS.map((n) => ({ value: n, label: n }))} />
          </Field>
          <Field label={t('leads.fields.budget')} error={errors.budget} optional>
            <Input {...bind('budget')} inputMode="decimal" placeholder="75000" suffix="USD" />
          </Field>
          <Field label={t('leads.fields.description')} hint={t('leads.fields.descriptionHint')} error={errors.description} required full>
            <Textarea {...bind('description')} minRows={3} maxRows={12} />
          </Field>
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section__title">{t('leads.sections.qualification')}</h3>
        <div className="field-grid field-grid--2">
          <Field label={t('leads.fields.source')}>
            <Select {...bind('source')} options={SOURCES.map((s) => ({ value: s, label: t(`sources.${s}`) }))} />
          </Field>
          <Field label={t('leads.fields.referredBy')} optional>
            <Select {...bind('referredById')} placeholder="—" options={lookupService.contactOptions(['client', 'referrer', 'partner', 'architect'])} disabled={form.values.source !== 'referral' && form.values.source !== 'partner'} />
          </Field>
          <Field label={t('leads.fields.assignee')}>
            <Select {...bind('assigneeId')} options={users} />
          </Field>
          <Field label={t('leads.fields.score')}>
            <div className="score-input">
              <input type="range" min="0" max="100" step="1" {...bind('score')} aria-label={t('leads.fields.score')} />
              <output className="tnum">{form.values.score}</output>
            </div>
          </Field>
        </div>
      </div>
    </FormPage>
  );
}
