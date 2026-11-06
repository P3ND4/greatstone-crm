import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { Bot, Maximize2, X } from 'lucide-react';
import useFocusTrap from '../../hooks/useFocusTrap.js';
import { useT } from '../../i18n/index.jsx';
import Button, { IconButton } from '../ui/Button.jsx';
import AssistantChat from './AssistantChat.jsx';

/** Floating AI assistant (bottom-right) → side panel. Hidden on the full assistant page. */
export default function AssistantLauncher() {
  const t = useT();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const panel = useRef(null);
  useFocusTrap(panel, open);
  if (pathname.startsWith('/ai/assistant')) return null;
  return (
    <>
      {!open && (
        <button type="button" className="ai-fab" onClick={() => setOpen(true)} aria-label={t('ai.assistant.open')} title={t('ai.assistant.open')}>
          <Bot aria-hidden="true" />
        </button>
      )}
      {open && createPortal(
        <div className="ai-panel-root" onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}>
          <div className="ai-panel" ref={panel} role="dialog" aria-modal="false" aria-label={t('ai.nav.assistant')}>
            <header className="form-header">
              <span className="ai-card__icon" style={{ width: 32, height: 32, borderRadius: 10 }} aria-hidden="true"><Bot size={16} /></span>
              <div className="form-header__titles"><h2 className="form-title">{t('ai.nav.assistant')}</h2><p className="form-subtitle">{t('ai.assistant.panelSub')}</p></div>
              <Button size="sm" variant="ghost" plain icon={Maximize2} to="/ai/assistant" onClick={() => setOpen(false)} aria-label={t('comms.expand')} />
              <IconButton icon={X} label={t('common.close')} onClick={() => setOpen(false)} />
            </header>
            <AssistantChat compact onNavigate={() => setOpen(false)} />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
