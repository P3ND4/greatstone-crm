import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronsUpDown, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { NAV, NAV_FOOTER } from '../../app/navigation.js';
import { useT } from '../../i18n/index.jsx';
import { IconButton } from '../ui/Button.jsx';
import cx from '../../lib/cx.js';

function NavItem({ item, collapsed, counts, onNavigate }) {
  const t = useT();
  const { pathname } = useLocation();
  const inSection = item.children && pathname.startsWith(item.to);
  const [open, setOpen] = useState(inSection);
  useEffect(() => { if (inSection) setOpen(true); }, [inSection]);
  const Icon = item.icon;

  if (!item.children) {
    return (
      <NavLink to={item.to} end={item.end} className="nav__link" title={collapsed ? t(item.labelKey) : undefined} onClick={onNavigate}>
        <Icon aria-hidden="true" /><span className="nav__label">{t(item.labelKey)}</span>
      </NavLink>
    );
  }
  const subId = `nav-sub-${item.id}`;
  return (
    <div className="nav__group">
      {collapsed ? (
        <NavLink to={item.children[0].to} className={cx('nav__link', inSection && 'active')} title={t(item.labelKey)} onClick={onNavigate}>
          <Icon aria-hidden="true" /><span className="nav__label">{t(item.labelKey)}</span>
        </NavLink>
      ) : (
        <button type="button" className={cx('nav__link', inSection && 'active')} aria-expanded={open} aria-controls={subId} onClick={() => setOpen((o) => !o)}>
          <Icon aria-hidden="true" /><span className="nav__label">{t(item.labelKey)}</span><ChevronRight className="chev" aria-hidden="true" />
        </button>
      )}
      {open && !collapsed && (
        <div className="nav__sub" id={subId}>
          {item.children.map((c) => (
            <NavLink key={c.id} to={c.to} className="nav__link" onClick={onNavigate}>
              <span className="nav__label">{t(c.labelKey)}</span>
              {c.badge && counts[c.badge] > 0 && <span className="nav__badge" aria-label={`${counts[c.badge]} unread`}>{counts[c.badge]}</span>}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ open, collapsed, onClose, onToggleCollapse, counts = {} }) {
  const t = useT();
  return (
    <>
      {open && <div className="sidebar-scrim" onClick={onClose} aria-hidden="true" />}
      <aside className={cx('sidebar', open && 'is-open')} aria-label={t('nav.main')}>
        <div className="sidebar__brand">
          <NavLink to="/" className="wordmark" aria-label="Greatstone CRM — Dashboard" onClick={onClose}>
            G<span className="wm-rest" style={{ color: 'inherit' }}>reatstone</span><span>.</span><small>CRM</small>
          </NavLink>
          <IconButton className="show-mobile" icon={X} label={t('nav.closeMenu')} onClick={onClose} style={{ color: 'var(--brand-muted)' }} />
        </div>
        <button type="button" className="org-switch" title={t('topbar.switchOrg')}>
          <span className="avatar avatar--sm avatar--dark" aria-hidden="true">G</span>
          <span className="grow" style={{ minWidth: 0 }}>
            <span className="org-switch__name" style={{ display: 'block' }}>{t('app.org')}</span>
            <span className="org-switch__plan">{t('app.demoData')}</span>
          </span>
          <ChevronsUpDown aria-hidden="true" />
        </button>
        <nav className="nav" aria-label={t('nav.main')}>
          {NAV.map((item) => <NavItem key={item.id} item={item} collapsed={collapsed} counts={counts} onNavigate={onClose} />)}
        </nav>
        <div className="sidebar__foot">
          {NAV_FOOTER.map((item) => <NavItem key={item.id} item={item} collapsed={collapsed} counts={counts} onNavigate={onClose} />)}
          {/* Desktop only: one toggle that both collapses and expands (always visible in both states). */}
          <button
            type="button"
            className="nav__link sidebar__toggle"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
            title={`${collapsed ? t('nav.expand') : t('nav.collapse')} (Ctrl/⌘ + B)`}
          >
            {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
            <span className="nav__label">{t('nav.collapse')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
