import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import useFocusTrap from '../../hooks/useFocusTrap.js';
import { useT } from '../../i18n/index.jsx';
import Button from '../ui/Button.jsx';

/** Small confirmation (role="alertdialog"). Defaults to the "discard unsaved changes" copy. */
export default function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel, tone = 'danger', onConfirm, onCancel }) {
  const t = useT();
  const panel = useRef(null);
  const id = useId();
  useFocusTrap(panel, open);
  if (!open) return null;
  return createPortal(
    <div className="modal-root" style={{ zIndex: 'calc(var(--z-modal) + 1)' }} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onCancel(); } }}>
      <div className="modal-backdrop" onMouseDown={onCancel} aria-hidden="true" />
      <div ref={panel} className="modal modal--sm" role="alertdialog" aria-modal="true" aria-labelledby={`${id}-t`} aria-describedby={`${id}-b`}>
        <div className="confirm__body">
          <span className="confirm__icon" aria-hidden="true"><AlertTriangle /></span>
          <div className="stack-sm">
            <h2 id={`${id}-t`} className="form-title">{title ?? t('common.discardTitle')}</h2>
            <p id={`${id}-b`} className="muted">{body ?? t('common.discardBody')}</p>
          </div>
        </div>
        <div className="form-footer" style={{ justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} data-autofocus>{cancelLabel ?? t('common.keepEditing')}</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel ?? t('common.discard')}</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
