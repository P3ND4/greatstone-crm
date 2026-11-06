import { AlertTriangle, Lock } from 'lucide-react';
import { useT } from '../../i18n/index.jsx';
import Button from './Button.jsx';
import EmptyState from './EmptyState.jsx';

/**
 * Standard loading / error / forbidden / empty handling for any view.
 * <DataState loading={..} error={..} empty={..} skeleton={<SkeletonList/>} onRetry={refetch}>…content…</DataState>
 */
export default function DataState({ loading, error, empty, forbidden, skeleton = null, onRetry, emptyTitle, emptyBody, emptyIcon, emptyAction, compact, children }) {
  const t = useT();
  if (forbidden || error?.status === 403) {
    return <EmptyState compact={compact} icon={Lock} title={t('states.forbiddenTitle')} body={t('states.forbiddenBody')} />;
  }
  if (error) {
    return (
      <EmptyState
        compact={compact}
        tone="danger"
        icon={AlertTriangle}
        title={t('states.errorTitle')}
        body={t('states.errorBody')}
        action={onRetry && <Button size="sm" onClick={onRetry}>{t('common.retry')}</Button>}
      />
    );
  }
  if (loading) return skeleton;
  if (empty) {
    return <EmptyState compact={compact} icon={emptyIcon} title={emptyTitle ?? t('states.emptyTitle')} body={emptyBody ?? t('states.emptyBody')} action={emptyAction} />;
  }
  return children;
}
