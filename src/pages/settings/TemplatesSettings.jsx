import { useRef, useState } from 'react';
import { BadgeCheck, Copy, Mail, MessageCircle, Pencil, Plus, Trash2, MessageSquareText } from 'lucide-react';
import { RowMenu } from '../../components/crm/bits.jsx';
import { ConfirmDialog, FormShell, ModalShell } from '../../components/shells/index.js';
import { Badge, Button, DataState, Field, Input, SkeletonList, Tabs, Textarea, useToast } from '../../components/ui/index.js';
import useForm from '../../hooks/useForm.js';
import useResource from '../../hooks/useResource.js';
import useUrlState from '../../hooks/useUrlState.js';
import { useT } from '../../i18n/index.jsx';
import { settingsService } from '../../services/index.js';
import { smsInfo } from '../../lib/sms.js';
import { SettingsHeader, useSettingsAccess } from './shared.jsx';

const VARIABLES = ['first', 'date', 'number', 'project'];
const SAMPLE = { first: 'Sofia', date: 'Thu, Nov 12', number: 'INV-1042', project: 'Grove kitchen' };
const STATUS_TONE = { approved: 'success', pending: 'warning', rejected: 'danger' };
const WA_MAX = 1024;

const fill = (text) => String(text || '').replace(/\{(\w+)\}/g, (m, k) => SAMPLE[k] ?? m);

function smsHintText(t, text) {
  const i = smsInfo(text);
  return t('comms.sms.counter', { n: i.units, segments: i.segments, encoding: i.encoding === 'GSM-7' ? 'GSM-7' : 'Unicode' });
}

function TemplateModal({ channel, template, onClose, onSaved }) {
  const t = useT();
  const toast = useToast();
  const bodyRef = useRef(null);
  const isWa = channel === 'whatsapp';
  const isEmail = channel === 'email';
  const isSms = channel === 'sms';
  const form = useForm(
    { name: template?.name || '', subject: template?.subject || '', body: template?.body || '' },
    {
      validate: (v) => ({
        name: !v.name.trim() && t('validation.required'),
        subject: isEmail && !v.subject.trim() && t('validation.required'),
        body: !v.body.trim() ? t('validation.required') : isWa && v.body.length > WA_MAX && t('settings.templates.tooLong', { n: WA_MAX }),
      }),
      onSubmit: async (v) => {
        const saved = await settingsService.saveTemplate(channel, { ...(template?.id ? { id: template.id } : {}), name: v.name.trim(), body: v.body, ...(isEmail ? { subject: v.subject.trim() } : {}) });
        toast.show(isWa && saved.status === 'pending' ? t('settings.templates.submitted', { name: saved.name }) : t('settings.templates.saved', { name: saved.name }));
        onSaved();
        onClose();
      },
    },
  );
  const insert = (v) => {
    const el = bodyRef.current;
    const token = `{${v}}`;
    const body = form.values.body;
    const at = el && typeof el.selectionStart === 'number' ? el.selectionStart : body.length;
    form.set('body', body.slice(0, at) + token + body.slice(el?.selectionEnd ?? at));
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(at + token.length, at + token.length); });
  };
  return (
    <ModalShell open onClose={onClose} size="lg" dirty={form.dirty}>
      {({ titleId, requestClose }) => (
        <FormShell
          titleId={titleId}
          title={template ? t('settings.templates.editTitle') : t('settings.templates.newTitle')}
          subtitle={t(`settings.templates.${channel}Sub`)}
          onCancel={requestClose}
          onSubmit={form.submit}
          dirty={form.dirty}
          saving={form.saving}
          submitLabel={isWa && (!template || template.body !== form.values.body) ? t('settings.templates.submit') : t('common.save')}
        >
          <div className="tpl-editor">
            <div className="stack">
              <Field label={t('settings.templates.name')} error={form.errors.name} required><Input {...form.bind('name')} data-autofocus /></Field>
              {isEmail && <Field label={t('settings.templates.subject')} error={form.errors.subject} required><Input {...form.bind('subject')} /></Field>}
              <Field label={t('settings.templates.body')} error={form.errors.body} required hint={isWa ? t('settings.templates.count', { n: form.values.body.length, max: WA_MAX }) : isSms ? smsHintText(t, fill(form.values.body)) : undefined}>
                <Textarea ref={bodyRef} {...form.bind('body')} minRows={5} maxRows={14} />
              </Field>
              <div>
                <p className="field__label" id="vars-label">{t('settings.templates.variables')}</p>
                <div className="row wrap-row" role="group" aria-labelledby="vars-label">
                  {VARIABLES.map((v) => <Button key={v} size="sm" variant="ghost" className="var-chip" onClick={() => insert(v)}>{`{${v}}`}</Button>)}
                </div>
              </div>
              {isWa && <p className="field__hint">{t('settings.templates.waReview')}</p>}
              {isSms && <p className="field__hint">{t('settings.templates.smsNote')}</p>}
            </div>
            <div className="tpl-preview" aria-label={t('settings.templates.preview')}>
              <p className="field__label">{t('settings.templates.preview')}</p>
              {!isEmail
                ? <div className={isSms ? 'tpl-preview__wa tpl-preview__sms' : 'tpl-preview__wa'}><div className="bubble bubble--out"><p className="bubble__body">{fill(form.values.body) || "…"}</p></div></div>
                : (
                  <div className="tpl-preview__mail">
                    <p className="tpl-preview__subject">{fill(form.values.subject) || '…'}</p>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{fill(form.values.body) || '…'}</p>
                  </div>
                )}
              <p className="subtle" style={{ fontSize: 12, marginTop: 8 }}>{t('settings.templates.sampleNote')}</p>
            </div>
          </div>
        </FormShell>
      )}
    </ModalShell>
  );
}

export default function TemplatesSettings() {
  const t = useT();
  const toast = useToast();
  const { readOnly } = useSettingsAccess();
  const [tab, setTab] = useUrlState('channel', 'whatsapp');
  const [editing, setEditing] = useState(null); // { template } | { template: null } for new
  const [removing, setRemoving] = useState(null);
  const { data, loading, error, refetch } = useResource(() => settingsService.templates(), []);
  const list = data?.[tab] || [];
  const isWa = tab === 'whatsapp';
  const isEmail = tab === 'email';

  const duplicate = async (tpl) => {
    await settingsService.saveTemplate(tab, { name: t('settings.templates.copyOf', { name: tpl.name }), body: tpl.body, ...(isEmail ? { subject: tpl.subject } : {}) });
    toast.show(t('settings.templates.duplicated'));
    refetch();
  };
  const approve = async (tpl) => {
    await settingsService.setTemplateStatus(tpl.id, 'approved');
    toast.show(t('settings.templates.approved', { name: tpl.name }));
    refetch();
  };

  return (
    <>
      <SettingsHeader section="templates" actions={<Button variant="primary" icon={Plus} onClick={() => setEditing({ template: null })} disabled={readOnly}>{t('settings.templates.new')}</Button>} />
      <Tabs
        label={t('settings.nav.templates')}
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'whatsapp', label: t('settings.channels.whatsapp'), count: data?.whatsapp.length },
          { id: 'sms', label: t('settings.channels.sms'), count: data?.sms.length },
          { id: 'email', label: t('settings.channels.email'), count: data?.email.length },
        ]}
      />
      <div className="tab-panel" role="tabpanel">
        <DataState
          loading={loading}
          error={error}
          onRetry={refetch}
          skeleton={<SkeletonList rows={4} />}
          empty={!list.length}
          emptyIcon={isWa ? MessageCircle : isEmail ? Mail : MessageSquareText}
          emptyTitle={t('settings.templates.emptyTitle')}
          emptyBody={t('settings.templates.emptyBody')}
          emptyAction={!readOnly && <Button variant="primary" icon={Plus} onClick={() => setEditing({ template: null })}>{t('settings.templates.new')}</Button>}
        >
          {isWa && <p className="insight" style={{ marginBottom: 16 }}><BadgeCheck aria-hidden="true" /><span>{t('settings.templates.waInfo')}</span></p>}
          <ul className="tpl-grid">
            {list.map((tpl) => (
              <li key={tpl.id} className="card tpl-card">
                <div className="tpl-card__head">
                  <span className="grow" style={{ minWidth: 0 }}>
                    <h3 className="tpl-card__name truncate">{tpl.name}</h3>
                    {isEmail && <span className="subtle truncate" style={{ display: 'block', fontSize: 13 }}>{tpl.subject}</span>}
                    {tab === 'sms' && <span className="subtle" style={{ display: 'block', fontSize: 12 }}>{smsHintText(t, fill(tpl.body))}</span>}
                  </span>
                  {isWa && <Badge tone={STATUS_TONE[tpl.status]} dot>{t(`settings.templates.status.${tpl.status}`)}</Badge>}
                  {!readOnly && (
                    <RowMenu label={t('settings.templates.actionsFor', { name: tpl.name })} items={[
                      { label: t('common.edit'), icon: Pencil, onClick: () => setEditing({ template: tpl }) },
                      { label: t('settings.templates.duplicate'), icon: Copy, onClick: () => duplicate(tpl) },
                      ...(isWa && tpl.status !== 'approved' ? [{ label: t('settings.templates.markApproved'), icon: BadgeCheck, onClick: () => approve(tpl) }] : []),
                      { label: t('common.delete'), icon: Trash2, onClick: () => setRemoving(tpl) },
                    ]} />
                  )}
                </div>
                <p className="tpl-card__body">{tpl.body}</p>
                {!readOnly && <Button size="sm" variant="ghost" icon={Pencil} className="tpl-card__edit" onClick={() => setEditing({ template: tpl })}>{t('common.edit')}</Button>}
              </li>
            ))}
          </ul>
        </DataState>
      </div>
      {editing && <TemplateModal key={editing.template?.id || 'new'} channel={tab} template={editing.template} onClose={() => setEditing(null)} onSaved={refetch} />}
      <ConfirmDialog
        open={Boolean(removing)}
        title={t('settings.templates.deleteTitle')}
        body={removing && t('settings.templates.deleteBody', { name: removing.name })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setRemoving(null)}
        onConfirm={async () => { const r = removing; setRemoving(null); await settingsService.removeTemplate(tab, r.id); toast.show(t('settings.templates.deleted', { name: r.name })); refetch(); }}
      />
    </>
  );
}
