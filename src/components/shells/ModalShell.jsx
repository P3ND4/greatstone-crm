import { useCallback, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import useFocusTrap from '../../hooks/useFocusTrap.js';
import useScrollLock from '../../hooks/useScrollLock.js';
import cx from '../../lib/cx.js';
import ConfirmDialog from './ConfirmDialog.jsx';

/**
 * ModalShell — short, self-contained actions only (≤ ~6 fields, confirmations, pickers).
 * Fixed sizes: sm 480 · md 640 · lg 840, max-height min(90vh, 760px).
 * Esc / backdrop close (asks to discard if `dirty`), focus trap, background scroll lock.
 * Children receive `titleId` + `requestClose` via render prop or use the same props on FormShell.
 */
export default function ModalShell({ open, onClose, size = 'md', dirty = false, role = 'dialog', labelledBy, children }) {
  const panel = useRef(null);
  const autoId = useId();
  const titleId = labelledBy || `${autoId}-title`;
  const [confirming, setConfirming] = useState(false);

  useScrollLock(open);
  useFocusTrap(panel, open && !confirming);

  const requestClose = useCallback(() => {
    if (dirty) setConfirming(true);
    else onClose();
  }, [dirty, onClose]);

  if (!open) return null;

  const onKeyDown = (e) => {
    if (e.key === 'Escape' && !confirming) { e.stopPropagation(); requestClose(); }
  };

  return createPortal(
    <div className="modal-root" onKeyDown={onKeyDown}>
      <div className="modal-backdrop" onMouseDown={requestClose} aria-hidden="true" />
      <div ref={panel} className={cx('modal', `modal--${size}`)} role={role} aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        {typeof children === 'function' ? children({ titleId, requestClose }) : children}
      </div>
      <ConfirmDialog
        open={confirming}
        onCancel={() => setConfirming(false)}
        onConfirm={() => { setConfirming(false); onClose(); }}
      />
    </div>,
    document.body,
  );
}
