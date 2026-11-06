import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NAV, NAV_FOOTER } from '../../app/navigation.js';
import { useT } from '../../i18n/index.jsx';
import cx from '../../lib/cx.js';

const ALL = [...NAV, ...NAV_FOOTER];

/** The module that owns the current URL (Dashboard only matches "/"). */
export function useActiveModule() {
  const { pathname } = useLocation();
  return ALL.find((m) => (m.end ? pathname === m.to : pathname === m.to || pathname.startsWith(`${m.to}/`))) || null;
}

/** Keeps the active tab visible when a row scrolls horizontally (phones / narrow windows). */
function useScrollActiveIntoView(ref, key) {
  useEffect(() => {
    // Scroll only the row itself (scrollIntoView would also scroll the page sideways).
    const row = ref.current;
    const el = row?.querySelector('[aria-current="page"], .active');
    if (!row || !el || row.scrollWidth <= row.clientWidth) return;
    row.scrollLeft = el.offsetLeft - (row.clientWidth - el.offsetWidth) / 2;
  }, [ref, key]);
}

/** Row 1 of the topbar: same modules as the sidebar. */
export function ModuleRow() {
  const t = useT();
  const active = useActiveModule();
  const ref = useRef(null);
  useScrollActiveIntoView(ref, active?.id);
  return (
    <nav ref={ref} className="modnav" aria-label={t('nav.modules')}>
      {ALL.map((m) => {
        const Icon = m.icon;
        const isActive = active?.id === m.id;
        return (
          <NavLink
            key={m.id}
            to={m.children ? m.children[0].to : m.to}
            end={m.end}
            className={cx('modnav__link', isActive && 'active')}
            aria-current={isActive ? 'page' : undefined}
            title={t(m.labelKey)}
          >
            <Icon aria-hidden="true" />
            <span>{t(m.labelKey)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

/** Row 2 of the topbar: submodules of the active module (hidden when it has none). */
export function SubmoduleRow({ counts = {} }) {
  const t = useT();
  const active = useActiveModule();
  const ref = useRef(null);
  const { pathname } = useLocation();
  useScrollActiveIntoView(ref, pathname);
  if (!active?.children) return null;
  return (
    <nav ref={ref} className="subbar" aria-label={t('nav.submodules', { name: t(active.labelKey) })}>
      {active.children.map((c) => {
        const Icon = c.icon;
        return (
          <NavLink key={c.id} to={c.to} className="subbar__link">
            {Icon && <Icon aria-hidden="true" />}
            <span>{t(c.labelKey)}</span>
            {c.badge && counts[c.badge] > 0 && <span className="nav__badge">{counts[c.badge]}</span>}
          </NavLink>
        );
      })}
    </nav>
  );
}
