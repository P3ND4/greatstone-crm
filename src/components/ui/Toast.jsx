import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useT } from '../../i18n/index.jsx';

const ToastContext = createContext(null);
const ICONS = { success: CheckCircle2, danger: AlertTriangle, info: Info };

export function ToastProvider({ children }) {
  const t = useT();
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((x) => x.id !== id)), []);
  const show = useCallback((message, { tone = 'success', duration = 3800 } = {}) => {
    const id = (seq.current += 1);
    setToasts((list) => [...list.slice(-3), { id, message, tone }]);
    if (duration) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tone] || Info;
          return (
            <div key={toast.id} className={`toast toast--${toast.tone}`}>
              <Icon aria-hidden="true" />
              <div className="toast__body">{toast.message}</div>
              <button type="button" className="toast__close" aria-label={t('common.close')} onClick={() => dismiss(toast.id)}><X size={16} /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
