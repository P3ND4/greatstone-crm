import { useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useT } from '../../i18n/index.jsx';
import Button, { IconButton } from '../ui/Button.jsx';
import { useToast } from '../ui/Toast.jsx';

const HOUR = 60 * 60 * 1000;

/**
 * Registers the service worker and surfaces its two events:
 * "ready to work offline" (toast, once) and "new version available" (card with Reload — never forced).
 */
export default function PwaStatus() {
  const t = useT();
  const toast = useToast();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Long-lived tabs (the CRM stays open all day) check for a new deploy every hour.
      if (registration) setInterval(() => { registration.update().catch(() => {}); }, HOUR);
    },
  });

  useEffect(() => {
    if (!offlineReady) return;
    toast.show(t('pwa.offlineReady'));
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady, toast, t]);

  const reload = () => {
    updateServiceWorker(true);
    // A tab opened before the service worker existed isn't controlled by it, so no "controlling" event
    // fires; reload anyway once the new worker has had time to activate.
    setTimeout(() => window.location.reload(), 2500);
  };

  if (!needRefresh) return null;
  return (
    <div className="pwa-update" role="status" aria-live="polite">
      <span className="pwa-update__icon" aria-hidden="true"><RefreshCw /></span>
      <div className="grow" style={{ minWidth: 0 }}>
        <p className="pwa-update__title">{t('pwa.updateTitle')}</p>
        <p className="pwa-update__body">{t('pwa.updateBody')}</p>
      </div>
      <Button size="sm" variant="primary" onClick={reload}>{t('pwa.reload')}</Button>
      <IconButton icon={X} size="sm" label={t('pwa.later')} onClick={() => setNeedRefresh(false)} />
    </div>
  );
}
