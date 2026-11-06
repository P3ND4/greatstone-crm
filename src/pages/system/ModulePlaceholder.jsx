import { NavLink, useLocation } from 'react-router-dom';
import { Construction, Plus } from 'lucide-react';
import { NAV } from '../../app/navigation.js';
import { Button, Card, EmptyState } from '../../components/ui/index.js';
import { useT } from '../../i18n/index.jsx';

/** Section sub-navigation (CRM, Finance). */
export function SubNav({ section }) {
  const t = useT();
  const item = NAV.find((n) => n.id === section);
  if (!item?.children) return null;
  return (
    <nav className="subnav" aria-label={t(item.labelKey)}>
      {item.children.map((c) => <NavLink key={c.id} to={c.to}>{t(c.labelKey)}</NavLink>)}
    </nav>
  );
}

/** Temporary screen for modules not yet built in this phase — keeps every route navigable. */
export default function ModulePlaceholder({ section, titleKey, action }) {
  const t = useT();
  const { pathname } = useLocation();
  const name = t(titleKey);
  return (
    <>
      <div className="page-head">
        <div>
          {section && <p className="page-head__eyebrow">{t(`nav.${section}`)}</p>}
          <h1 className="page-title">{name}</h1>
        </div>
        {action && <div className="page-head__actions"><Button variant="primary" icon={Plus} to={action.to}>{t(action.labelKey)}</Button></div>}
      </div>
      {section && <SubNav section={section} />}
      <Card>
        <EmptyState icon={Construction} title={t('common.comingSoonTitle', { name })} body={`${t('common.comingSoon')} (${pathname})`} />
      </Card>
    </>
  );
}
