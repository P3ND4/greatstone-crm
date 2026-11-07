import { Eye, Lock } from 'lucide-react';
import { useSession } from '../../app/SessionProvider.jsx';
import { useT } from '../../i18n/index.jsx';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';

/** Full-page "no access" state for a module the current role can't open. */
export function NoAccess({ module }) {
  const t = useT();
  const { role, viewAs, setViewAs } = useSession();
  return (
    <div className="no-access">
      <EmptyState
        icon={Lock}
        title={t('states.forbiddenTitle')}
        body={t('settings.noAccess.body', { role: t(`roles.${role}`), module: module ? t(module.labelKey) : '' })}
        action={(
          <div className="row wrap-row" style={{ justifyContent: 'center' }}>
            <Button to="/">{t('states.goHome')}</Button>
            {viewAs && <Button variant="primary" onClick={() => setViewAs(null)}>{t('settings.viewAs.exit')}</Button>}
          </div>
        )}
      />
    </div>
  );
}

/** Thin banner while previewing the app as another role. */
export function ViewAsBanner() {
  const t = useT();
  const { viewAs, setViewAs } = useSession();
  if (!viewAs) return null;
  return (
    <div className="viewas-banner" role="status">
      <Eye aria-hidden="true" />
      <span className="grow">{t('settings.viewAs.banner', { role: t(`roles.${viewAs}`) })}</span>
      <Button size="sm" onClick={() => setViewAs(null)}>{t('settings.viewAs.exit')}</Button>
    </div>
  );
}
