import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Eye, PencilLine } from 'lucide-react';
import DocPreview from '../../components/finance/DocPreview.jsx';
import LineEditor, { newLine } from '../../components/finance/LineEditor.jsx';
import TotalsBox from '../../components/finance/TotalsBox.jsx';
import { FormPage, PageShell } from '../../components/shells/index.js';
import { Button, Card, DataState, DatePicker, Field, Select, Skeleton, Textarea, useToast } from '../../components/ui/index.js';
import useForm from '../../hooks/useForm.js';
import useResource from '../../hooks/useResource.js';
import { useT } from '../../i18n/index.jsx';
import { documentTotals } from '../../lib/money.js';
import { money } from '../../lib/format.js';
import { financeService, lookupService } from '../../services/index.js';
import { API, BASE } from './DocsListPage.jsx';

const toDate = (iso) => (iso ? format(new Date(iso), 'yyyy-MM-dd') : '');
const fromDate = (d) => new Date(`${d}T12:00:00`).toISOString();

/** /finance/{estimates|invoices}/new and /:id/edit — long form with line builder → PAGE. */
export default function DocBuilderRoute({ kind }) {
  const t = useT();
  const { id } = useParams();
  const [params] = useSearchParams();
  const api = API[kind];
  const { data, loading, error, refetch } = useResource(() => (id ? api.get(id) : Promise.resolve(null)), [id, kind]);
  if (id && (loading || error)) {
    return (
      <PageShell fallback={BASE[kind]} breadcrumbs={[{ label: t(`nav.${kind}s`), to: BASE[kind] }, { label: t('common.edit') }]}>
        <Card><DataState loading={loading} error={error} onRetry={refetch} skeleton={<Skeleton height={360} />} /></Card>
      </PageShell>
    );
  }
  const initial = data?.doc || api.draft({ projectId: params.get('project') || '', clientId: params.get('client') || '' });
  return <DocBuilder key={id || 'new'} kind={kind} doc={initial} editing={Boolean(id)} />;
}

function DocBuilder({ kind, doc, editing }) {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const api = API[kind];
  const isInvoice = kind === 'invoice';
  const [mode, setMode] = useState('edit');
  const [lineErrors, setLineErrors] = useState({});
  const s = financeService.settings();

  const form = useForm(
    {
      clientId: doc.clientId || '',
      projectId: doc.projectId || '',
      date: toDate(isInvoice ? doc.issuedAt : doc.createdAt),
      until: toDate(isInvoice ? doc.dueAt : doc.expiresAt),
      lines: doc.lines?.length ? doc.lines : [newLine()],
      terms: doc.terms ?? s.defaultTerms,
      notes: doc.notes ?? '',
    },
    {
      validate: (v) => {
        const le = {};
        v.lines.forEach((l) => {
          const e = {};
          if (!String(l.description).trim()) e.description = t('validation.required');
          if (!(Number(l.qty) > 0)) e.qty = t('finance.errors.qty');
          if (l.unitPrice === '' || Number.isNaN(Number(l.unitPrice)) || Number(l.unitPrice) < 0) e.unitPrice = t('validation.number');
          if (Number.isNaN(Number(l.discountPct)) || Number(l.discountPct) < 0 || Number(l.discountPct) > 100) e.discountPct = t('finance.errors.discount');
          if (Object.keys(e).length) le[l.id] = e;
        });
        setLineErrors(le);
        const firstLine = Object.keys(le)[0];
        const idx = v.lines.findIndex((l) => l.id === firstLine);
        return {
          clientId: !v.clientId && t('validation.required'),
          date: !v.date && t('validation.required'),
          until: !v.until ? t('validation.required') : v.until < v.date && t('finance.errors.until'),
          lines: !v.lines.length && t('finance.errors.noLines'),
          ...(firstLine ? { [`line-${idx}-${Object.keys(le[firstLine])[0] === 'unitPrice' ? 'price' : Object.keys(le[firstLine])[0]}`]: true } : {}),
        };
      },
      onSubmit: async (v) => {
        const payload = {
          ...doc,
          clientId: v.clientId,
          projectId: v.projectId,
          lines: v.lines.map((l) => ({ ...l, qty: Number(l.qty), unitPrice: Number(l.unitPrice), discountPct: Number(l.discountPct) || 0 })),
          terms: v.terms,
          notes: v.notes,
          ...(isInvoice ? { issuedAt: fromDate(v.date), dueAt: fromDate(v.until) } : { createdAt: fromDate(v.date), expiresAt: fromDate(v.until) }),
        };
        const saved = await api.save(payload);
        toast.show(editing ? t('finance.savedToast', { number: saved.number }) : t('finance.createdToast', { number: saved.number }));
        navigate(`${BASE[kind]}/${saved.id}`, { replace: true });
      },
    },
  );
  const { values, errors, bind } = form;
  const rate = doc.taxRate ?? s.taxRate;
  const totals = useMemo(() => documentTotals(values.lines, rate), [values.lines, rate]);
  const preview = { ...doc, kind, client: lookupService.contact(values.clientId), project: lookupService.project(values.projectId), lines: values.lines, taxRate: rate, totals, terms: values.terms, notes: values.notes,
    ...(isInvoice ? { issuedAt: fromDate(values.date || toDate(new Date().toISOString())), dueAt: values.until && fromDate(values.until), paid: doc.paid || 0 } : { createdAt: values.date && fromDate(values.date), expiresAt: values.until && fromDate(values.until) }) };

  const onProject = (e) => {
    const pid = e.target.value;
    form.set('projectId', pid);
    const p = lookupService.project(pid);
    if (p && !values.clientId) form.set('clientId', p.clientId);
  };

  return (
    <FormPage
      fallback={editing ? `${BASE[kind]}/${doc.id}` : BASE[kind]}
      breadcrumbs={[{ label: t('nav.finance'), to: BASE[kind] }, { label: t(`nav.${kind}s`), to: BASE[kind] }, { label: editing ? `${doc.number} · ${t('common.edit')}` : t(`finance.new.${kind}`) }]}
      title={editing ? `${t('common.edit')} ${doc.number}` : `${t(`finance.new.${kind}`)} · ${doc.number}`}
      subtitle={t('finance.builderSubtitle')}
      dirty={form.dirty}
      saving={form.saving}
      onSubmit={form.submit}
      submitLabel={editing ? t('common.save') : t('finance.saveDraft')}
      className="form-shell--wide"
      headerEnd={(
        <div className="segmented" role="radiogroup" aria-label={t('finance.mode')}>
          <button type="button" role="radio" aria-checked={mode === 'edit'} onClick={() => setMode('edit')}><PencilLine size={14} aria-hidden="true" /> {t('common.edit')}</button>
          <button type="button" role="radio" aria-checked={mode === 'preview'} onClick={() => setMode('preview')}><Eye size={14} aria-hidden="true" /> {t('projects.preview')}</button>
        </div>
      )}
      footerExtra={<span className="builder-total tnum">{t('contacts.total')}: <strong>{money(totals.total)}</strong></span>}
    >
      {mode === 'preview' ? <DocPreview doc={preview} /> : (
        <>
          <div className="form-section">
            <h3 className="form-section__title">{t('finance.sections.details')}</h3>
            <div className="field-grid field-grid--2">
              <Field label={t('finance.project')} optional>
                <Select value={values.projectId} name="projectId" onChange={onProject} placeholder="—" options={lookupService.projectOptions()} />
              </Field>
              <Field label={t('projects.columns.client')} error={errors.clientId} required>
                <Select {...bind('clientId')} placeholder="—" options={lookupService.contactOptions(['client'])} />
              </Field>
              <Field label={isInvoice ? t('contacts.issued') : t('finance.date')} error={errors.date} required><DatePicker {...bind('date')} /></Field>
              <Field label={isInvoice ? t('contacts.due') : t('finance.validUntil')} error={errors.until} required hint={isInvoice ? t('finance.dueHint', { n: s.invoiceDueDays }) : t('finance.validHint', { n: s.estimateValidDays })}><DatePicker {...bind('until')} /></Field>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section__title">{t('finance.sections.lines')}</h3>
            {errors.lines && <p className="field__error" role="alert">{errors.lines}</p>}
            <LineEditor lines={values.lines} taxRate={rate} errors={lineErrors} onChange={(lines) => form.set('lines', lines)} />
            <div className="builder-totals"><TotalsBox totals={totals} rate={rate} paid={isInvoice && doc.paid ? doc.paid : null} /></div>
          </div>

          <div className="form-section">
            <h3 className="form-section__title">{t('finance.sections.terms')}</h3>
            <div className="field-grid">
              <Field label={t('finance.terms')} optional><Textarea {...bind('terms')} minRows={3} maxRows={10} /></Field>
              <Field label={t('finance.notes')} optional hint={t('finance.notesHint')}><Textarea {...bind('notes')} minRows={2} maxRows={8} /></Field>
            </div>
            <div><Button size="sm" variant="ghost" plain onClick={() => form.set('terms', s.defaultTerms)}>{t('finance.resetTerms')}</Button></div>
          </div>
        </>
      )}
    </FormPage>
  );
}
