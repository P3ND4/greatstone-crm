import { useBlocker } from 'react-router-dom';
import ConfirmDialog from './ConfirmDialog.jsx';
import FormShell from './FormShell.jsx';
import PageShell from './PageShell.jsx';
import { useGoBack } from './BackButton.jsx';

/**
 * FormPage = PageShell + FormShell(variant="page"). Same form anatomy as modals,
 * with a guard that asks before leaving with unsaved changes (Back, links, browser back).
 */
export default function FormPage({ fallback, breadcrumbs, dirty, saving, onSubmit, children, ...shellProps }) {
  const goBack = useGoBack(fallback);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !saving && currentLocation.pathname !== nextLocation.pathname);
  return (
    <PageShell fallback={fallback} breadcrumbs={breadcrumbs}>
      <FormShell variant="page" dirty={dirty} saving={saving} onSubmit={onSubmit} onCancel={goBack} {...shellProps}>
        {children}
      </FormShell>
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onCancel={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
      />
    </PageShell>
  );
}
