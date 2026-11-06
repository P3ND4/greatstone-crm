import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n/index.jsx';

/**
 * "← Back" — returns to exactly where the user clicked from (same scroll, filters, tab, page:
 * filters live in the URL and ScrollRestoration restores scroll on POP).
 * If the page was opened by direct link (no in-app history), goes to `fallback` (the parent list).
 */
export function useGoBack(fallback = '/') {
  const navigate = useNavigate();
  return () => {
    const idx = window.history.state?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  };
}

export default function BackButton({ fallback, onClick }) {
  const t = useT();
  const goBack = useGoBack(fallback);
  return (
    <button type="button" className="back-btn" onClick={onClick || goBack}>
      <ArrowLeft aria-hidden="true" />
      {t('common.back')}
    </button>
  );
}
