import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Paperclip, Save, X } from 'lucide-react';
import { FormPage } from '../../../components/shells/index.js';
import { Button, Field, Input, Select, useToast } from '../../../components/ui/index.js';
import RichTextEditor from '../../../components/ui/RichTextEditor.jsx';
import useForm, { isEmail } from '../../../hooks/useForm.js';
import { useT } from '../../../i18n/index.jsx';
import { communicationsService, lookupService } from '../../../services/index.js';
import { SIGNATURE, TEMPLATES } from '../../../services/communicationsService.js';

const splitEmails = (v) => v.split(/[,;]\s*/).map((x) => x.trim()).filter(Boolean);
const htmlToText = (html) => {
  const d = document.createElement('div');
  d.innerHTML = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li)>/gi, '\n');
  return d.textContent.replace(/\n{3,}/g, '\n\n').trim();
};
const textToHtml = (txt) => txt.split('\n').map((l) => (l ? l.replace(/</g, '&lt;') : '<br>')).map((l) => `<div>${l}</div>`).join('');

/** Email composer — full PAGE (To/Cc/Bcc, subject, rich text, templates, signature, attachments, draft). */
export default function ComposePage() {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const replyTo = params.get('reply') ? lookupService.conversation(params.get('reply')) : null;
  const replyContact = replyTo && lookupService.contact(replyTo.contactId);
  const presetContact = params.get('contact') ? lookupService.contact(params.get('contact')) : replyContact;
  const [showCc, setShowCc] = useState(false);
  const [files, setFiles] = useState([]);
  const [drafting, setDrafting] = useState(false);

  const form = useForm(
    {
      to: params.get('to') || replyContact?.email || '',
      cc: '', bcc: '',
      subject: replyTo ? `Re: ${replyTo.subject}` : '',
      body: '',
      signature: true,
      contactId: presetContact?.id || '',
      projectId: replyTo?.projectId || '',
    },
    {
      validate: (v) => ({
        to: !v.to.trim() ? t('validation.required') : splitEmails(v.to).some((e) => !isEmail(e)) && t('validation.email'),
        cc: v.cc && splitEmails(v.cc).some((e) => !isEmail(e)) && t('validation.email'),
        bcc: v.bcc && splitEmails(v.bcc).some((e) => !isEmail(e)) && t('validation.email'),
        subject: !v.subject.trim() && t('validation.required'),
        body: !htmlToText(v.body) && t('validation.required'),
      }),
      onSubmit: async (v) => {
        const body = htmlToText(v.body) + (v.signature ? SIGNATURE : '');
        if (replyTo) await communicationsService.send(replyTo.id, { body });
        else await communicationsService.compose({ ...v, body });
        toast.show(t('comms.emailSent'));
        navigate('/crm/communications/email?folder=sent', { replace: true });
      },
    },
  );

  const saveDraft = async () => {
    setDrafting(true);
    await communicationsService.compose({ ...form.values, body: htmlToText(form.values.body), subject: form.values.subject || t('comms.noSubject'), draft: true });
    setDrafting(false);
    form.reset();
    toast.show(t('comms.draftSaved'));
    navigate('/crm/communications/email?folder=drafts', { replace: true });
  };

  const applyTemplate = (id) => {
    const tpl = TEMPLATES.email.find((x) => x.id === id);
    if (!tpl) return;
    const first = lookupService.contact(form.values.contactId)?.firstName || '';
    if (!form.values.subject) form.set('subject', tpl.subject);
    form.set('body', textToHtml(tpl.body.replace('{first}', first)));
  };

  return (
    <FormPage
      fallback="/crm/communications/email"
      breadcrumbs={[{ label: t('nav.communications'), to: '/crm/communications/email' }, { label: t('channels.email'), to: '/crm/communications/email' }, { label: replyTo ? t('comms.reply') : t('comms.compose') }]}
      title={replyTo ? `${t('comms.reply')}: ${replyTo.subject}` : t('comms.newEmail')}
      dirty={form.dirty}
      saving={form.saving || drafting}
      onSubmit={form.submit}
      submitLabel={t('comms.send')}
      footerExtra={<Button icon={Save} onClick={saveDraft} disabled={form.saving || drafting}>{t('comms.saveDraft')}</Button>}
    >
      <div className="field-grid">
        <Field label={t('comms.to')} error={form.errors.to} required hint={t('comms.toHint')}>
          <Input {...form.bind('to')} type="text" inputMode="email" autoComplete="off" />
        </Field>
        {!showCc ? (
          <div><Button size="sm" variant="ghost" plain onClick={() => setShowCc(true)}>{t('comms.addCc')}</Button></div>
        ) : (
          <div className="field-grid field-grid--2">
            <Field label="Cc" error={form.errors.cc} optional><Input {...form.bind('cc')} /></Field>
            <Field label="Bcc" error={form.errors.bcc} optional><Input {...form.bind('bcc')} /></Field>
          </div>
        )}
        <Field label={t('comms.subject')} error={form.errors.subject} required><Input {...form.bind('subject')} /></Field>
        <div className="field-grid field-grid--2">
          <Field label={t('comms.template')} optional>
            <Select value="" onChange={(e) => applyTemplate(e.target.value)} placeholder="—" options={TEMPLATES.email.map((x) => ({ value: x.id, label: x.name }))} />
          </Field>
          <Field label={t('comms.linkContact')} optional>
            <Select {...form.bind('contactId')} placeholder="—" options={lookupService.contactOptions()} />
          </Field>
        </div>
        <Field label={t('comms.message')} error={form.errors.body} required>
          <RichTextEditor value={form.values.body} onChange={(html) => form.set('body', html)} />
        </Field>
        <label className="row" style={{ fontSize: 14 }}>
          <input type="checkbox" className="checkbox" checked={form.values.signature} onChange={(e) => form.set('signature', e.target.checked)} />
          {t('comms.includeSignature')}
        </label>
        {form.values.signature && <p className="prose subtle" style={{ fontSize: 13, borderLeft: '2px solid var(--border)', paddingLeft: 12 }}>{SIGNATURE.trim()}</p>}
        <div className="field-grid field-grid--2">
          <Field label={t('comms.attachments')} optional>
            <label className="btn btn--sm" style={{ alignSelf: 'flex-start' }}>
              <Paperclip aria-hidden="true" />{t('comms.attach')}
              <input type="file" multiple hidden onChange={(e) => setFiles((f) => [...f, ...e.target.files])} />
            </label>
          </Field>
          <Field label={t('comms.linkProject')} optional>
            <Select {...form.bind('projectId')} placeholder="—" options={lookupService.projectOptions()} />
          </Field>
        </div>
        {files.length > 0 && (
          <ul className="row wrap-row">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="attachment">
                <Paperclip aria-hidden="true" /><span className="truncate">{f.name}</span>
                <button type="button" className="icon-btn icon-btn--sm" aria-label={`${t('common.delete')} ${f.name}`} onClick={() => setFiles((list) => list.filter((_, k) => k !== i))}><X /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </FormPage>
  );
}
