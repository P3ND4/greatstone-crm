import { useState } from 'react';
import { Lock, Paperclip, Send, Zap } from 'lucide-react';
import { useT } from '../../i18n/index.jsx';
import { TEMPLATES } from '../../services/communicationsService.js';
import { IconButton, Menu, Textarea } from '../ui/index.js';
import cx from '../../lib/cx.js';

/**
 * WhatsApp composer: reply vs internal note, quick templates, attach (mock).
 * Outside the 24h customer-service window only approved templates can be sent (WhatsApp Business rule).
 */
export default function WaComposer({ windowOpen, firstName, onSend }) {
  const t = useT();
  const [mode, setMode] = useState('reply');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState([]);
  const restricted = mode === 'reply' && windowOpen === false;

  const submit = (e) => {
    e?.preventDefault();
    if (!body.trim() && !files.length) return;
    onSend({ body: body.trim(), isNote: mode === 'note', attachments: files.map((f) => ({ name: f.name, size: `${Math.max(1, Math.round(f.size / 1024))} KB`, type: f.name.split('.').pop() })) });
    setBody('');
    setFiles([]);
  };
  const useTemplate = (tpl) => setBody(tpl.body.replace('{first}', firstName || '').replace('{date}', 'Thursday 2:30 PM'));

  return (
    <form className={cx('composer', mode === 'note' && 'composer--note')} onSubmit={submit}>
      <div className="composer__modes" role="radiogroup" aria-label={t('comms.composeMode')}>
        <button type="button" role="radio" aria-checked={mode === 'reply'} onClick={() => setMode('reply')}>{t('comms.reply')}</button>
        <button type="button" role="radio" aria-checked={mode === 'note'} onClick={() => setMode('note')}><Lock size={12} aria-hidden="true" />{t('comms.internalNote')}</button>
      </div>
      {restricted && <p className="composer__warn">{t('comms.windowClosedHint')}</p>}
      {files.length > 0 && <div className="composer__files">{files.map((f) => <span key={f.name} className="badge">{f.name}</span>)}</div>}
      <div className="composer__row">
        <Menu
          align="left"
          label={t('comms.templates')}
          trigger={(p) => <IconButton icon={Zap} label={t('comms.templates')} {...p} />}
        >
          {(close) => TEMPLATES.whatsapp.filter((x) => x.status === 'approved').map((tpl) => (
            <button key={tpl.id} role="menuitem" type="button" className="menu__item" onClick={() => { useTemplate(tpl); close(); }}>
              <span style={{ minWidth: 0 }}><strong style={{ display: 'block', fontWeight: 500 }}>{tpl.name}</strong><span className="muted truncate" style={{ display: 'block', fontSize: 12, maxWidth: 260 }}>{tpl.body}</span></span>
            </button>
          ))}
        </Menu>
        <label className="icon-btn" title={t('comms.attach')}>
          <Paperclip aria-hidden="true" />
          <span className="sr-only">{t('comms.attach')}</span>
          <input type="file" multiple hidden onChange={(e) => setFiles([...e.target.files])} disabled={restricted} />
        </label>
        <Textarea
          className="composer__input"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          minRows={1}
          maxRows={6}
          placeholder={mode === 'note' ? t('comms.notePlaceholder') : restricted ? t('comms.templateOnly') : t('comms.messagePlaceholder')}
          aria-label={mode === 'note' ? t('comms.internalNote') : t('comms.message')}
          readOnly={restricted && !body}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
        />
        <IconButton icon={Send} label={mode === 'note' ? t('comms.addNote') : t('comms.send')} className="composer__send" type="submit" />
      </div>
    </form>
  );
}
