import { useState } from 'react';
import { Clock, Lock, Paperclip, Send, ShieldAlert, Zap } from 'lucide-react';
import { useT } from '../../i18n/index.jsx';
import { time } from '../../lib/format.js';
import { composeSms, smsInfo } from '../../lib/sms.js';
import { TEMPLATES } from '../../services/communicationsService.js';
import { IconButton, Menu, Textarea, useToast } from '../ui/index.js';
import cx from '../../lib/cx.js';

const MMS_MAX = 5 * 1024 * 1024;

/**
 * Chat composer for WhatsApp and SMS: reply vs internal note, quick templates, attachments.
 * WhatsApp: outside the 24 h customer-service window only approved templates can be sent.
 * SMS: no texting after STOP, quiet hours hold the message until morning, first text gets brand + opt-out
 * footer, live GSM-7 / Unicode segment counter, MMS = images up to 5 MB.
 */
export default function WaComposer({ channel = 'whatsapp', windowOpen, sms, firstName, onSend }) {
  const t = useT();
  const toast = useToast();
  const [mode, setMode] = useState('reply');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState([]);
  const isSms = channel === 'sms';
  const reply = mode === 'reply';
  const optedOut = isSms && sms?.consent.status === 'opted_out';
  const restricted = reply && ((channel === 'whatsapp' && windowOpen === false) || optedOut || (isSms && sms && !sms.connected));
  const templates = (TEMPLATES[channel] || []).filter((x) => channel !== 'whatsapp' || x.status === 'approved');

  const delivered = isSms && reply ? composeSms(body.trim(), { first: sms?.firstMessage, prefix: sms?.prefix, footer: sms?.footer }) : '';
  const info = isSms ? smsInfo(delivered) : null;

  const submit = async (e) => {
    e?.preventDefault();
    if (optedOut && reply) return;
    if (!body.trim() && !files.length) return;
    const ok = await onSend({ body: body.trim(), isNote: mode === 'note', attachments: files.map((f) => ({ name: f.name, size: `${Math.max(1, Math.round(f.size / 1024))} KB`, type: f.name.split('.').pop() })) });
    if (ok === false) return;
    setBody('');
    setFiles([]);
  };
  const useTemplate = (tpl) => setBody(tpl.body.replace('{first}', firstName || '').replace('{date}', 'Thursday 2:30 PM').replace('{number}', 'INV-1046').replace('{project}', 'your project'));
  const pickFiles = (list) => {
    const picked = [...list];
    if (isSms) {
      const bad = picked.find((f) => !f.type.startsWith('image/') || f.size > MMS_MAX);
      if (bad) { toast.show(t('comms.sms.mmsLimit'), { tone: 'danger' }); return; }
    }
    setFiles(picked);
  };

  let warn = null;
  if (reply && channel === 'whatsapp' && windowOpen === false) warn = <p className="composer__warn">{t('comms.windowClosedHint')}</p>;
  if (reply && isSms && sms) {
    if (!sms.connected) warn = <p className="composer__warn">{t('comms.sms.notConnected')}</p>;
    else if (optedOut) warn = <p className="composer__warn composer__warn--danger"><ShieldAlert aria-hidden="true" />{t('comms.sms.optedOutHint')}</p>;
    else if (sms.consent.status === 'unknown') warn = <p className="composer__warn">{t('comms.sms.noConsentHint')}</p>;
    else if (sms.quietNow) warn = <p className="composer__warn"><Clock aria-hidden="true" />{t('comms.sms.quietHint', { time: time(sms.resumeAt) })}</p>;
  }

  return (
    <form className={cx('composer', mode === 'note' && 'composer--note')} onSubmit={submit}>
      <div className="composer__modes" role="radiogroup" aria-label={t('comms.composeMode')}>
        <button type="button" role="radio" aria-checked={reply} onClick={() => setMode('reply')}>{isSms ? t('comms.sms.text') : t('comms.reply')}</button>
        <button type="button" role="radio" aria-checked={mode === 'note'} onClick={() => setMode('note')}><Lock size={12} aria-hidden="true" />{t('comms.internalNote')}</button>
      </div>
      {warn}
      {files.length > 0 && <div className="composer__files">{files.map((f) => <span key={f.name} className="badge">{f.name}</span>)}</div>}
      <div className="composer__row">
        <Menu
          align="left"
          label={t('comms.templates')}
          trigger={(p) => <IconButton icon={Zap} label={t('comms.templates')} disabled={restricted && optedOut} {...p} />}
        >
          {(close) => (templates.length ? templates.map((tpl) => (
            <button key={tpl.id} role="menuitem" type="button" className="menu__item" onClick={() => { useTemplate(tpl); close(); }}>
              <span style={{ minWidth: 0 }}><strong style={{ display: 'block', fontWeight: 500 }}>{tpl.name}</strong><span className="muted truncate" style={{ display: 'block', fontSize: 12, maxWidth: 260 }}>{tpl.body}</span></span>
            </button>
          )) : <p className="menu__item muted">{t('settings.templates.emptyTitle')}</p>)}
        </Menu>
        {(!isSms || sms?.mms) && (
          <label className={cx('icon-btn', restricted && reply && 'is-disabled')} title={isSms ? t('comms.sms.attachImage') : t('comms.attach')}>
            <Paperclip aria-hidden="true" />
            <span className="sr-only">{isSms ? t('comms.sms.attachImage') : t('comms.attach')}</span>
            <input type="file" multiple={!isSms} accept={isSms ? 'image/*' : undefined} hidden onChange={(e) => { pickFiles(e.target.files); e.target.value = ''; }} disabled={restricted} />
          </label>
        )}
        <Textarea
          className="composer__input"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          minRows={1}
          maxRows={6}
          placeholder={mode === 'note' ? t('comms.notePlaceholder') : optedOut ? t('comms.sms.optedOutShort') : restricted ? t('comms.templateOnly') : isSms ? t('comms.sms.placeholder') : t('comms.messagePlaceholder')}
          aria-label={mode === 'note' ? t('comms.internalNote') : t('comms.message')}
          aria-describedby={info ? 'sms-counter' : undefined}
          readOnly={(restricted && !body) || (optedOut && reply)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
        />
        <IconButton icon={Send} label={mode === 'note' ? t('comms.addNote') : sms?.quietNow ? t('comms.sms.schedule') : t('comms.send')} className="composer__send" type="submit" disabled={optedOut && reply} />
      </div>
      {isSms && reply && !optedOut && info.units > 0 && (
        <p id="sms-counter" className="composer__meta" aria-live="polite">
          <span className="tnum">{t('comms.sms.counter', { n: info.units, segments: info.segments, encoding: info.encoding === 'GSM-7' ? 'GSM-7' : 'Unicode' })}</span>
          {sms?.firstMessage && sms.footer && <span>{t('comms.sms.footerNote', { footer: sms.footer })}</span>}
          {info.encoding !== 'GSM-7' && <span>{t('comms.sms.unicodeNote')}</span>}
        </p>
      )}
    </form>
  );
}
