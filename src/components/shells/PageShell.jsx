import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import BackButton from './BackButton.jsx';

/**
 * PageShell — long flows on their own route: Back button (top-left) + discreet breadcrumb.
 * breadcrumbs: [{ label, to? }] — last item is the current page.
 */
export default function PageShell({ fallback, breadcrumbs = [], onBack, children }) {
  return (
    <div className="page-shell">
      <div className="page-shell__nav">
        <BackButton fallback={fallback} onClick={onBack} />
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb">
            <ol className="breadcrumb">
              {breadcrumbs.map((b, i) => {
                const last = i === breadcrumbs.length - 1;
                return (
                  <li key={b.label} className="row" style={{ gap: 6 }}>
                    {b.to && !last ? <Link to={b.to}>{b.label}</Link> : <span aria-current={last ? 'page' : undefined}>{b.label}</span>}
                    {!last && <ChevronRight aria-hidden="true" />}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
      </div>
      {children}
    </div>
  );
}
