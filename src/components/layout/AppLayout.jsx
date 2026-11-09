import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import useHotkey from '../../hooks/useHotkey.js';
import useResource from '../../hooks/useResource.js';
import { conversationsService, lookupService } from '../../services/index.js';
import { QuickActionsProvider } from '../quick/QuickActionsProvider.jsx';
import CommandPalette from './CommandPalette.jsx';
import AssistantLauncher from '../ai/AssistantLauncher.jsx';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { useActiveModule } from './ModuleNav.jsx';
import cx from '../../lib/cx.js';
import { NoAccess, ViewAsBanner } from './Access.jsx';
import PwaStatus from './PwaStatus.jsx';
import { useSession } from '../../app/SessionProvider.jsx';

const COLLAPSE_KEY = 'gs.sidebarCollapsed';
const readCollapsed = () => { try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; } };

export default function AppLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [searchOpen, setSearchOpen] = useState(false);
  // Animations run only after the user toggles (not on first paint with a remembered state).
  const [navAnim, setNavAnim] = useState(false);
  const collapsedRef = useRef(collapsed);
  collapsedRef.current = collapsed;
  const toggleCollapsed = useCallback(() => {
    const wasCollapsed = collapsedRef.current;
    const hadFocus = document.activeElement?.closest?.('.sidebar__toggle, .topbar__expand');
    setNavAnim(true);
    setCollapsed(!wasCollapsed);
    // Keep keyboard focus on the control that undoes the action (the old one disappears).
    if (hadFocus) requestAnimationFrame(() => document.querySelector(wasCollapsed ? '.sidebar__toggle' : '.topbar__expand')?.focus());
  }, []);
  const location = useLocation();

  useEffect(() => { setNavOpen(false); }, [location.pathname]);
  useEffect(() => { try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch { /* ignore */ } }, [collapsed]);
  useHotkey('mod+k', () => setSearchOpen((o) => !o));
  // Ctrl/⌘+B toggles the sidebar — ignored while typing (inputs, text areas, rich text).
  useHotkey('mod+b', () => toggleCollapsed(), { allowInInputs: false });

  const { data: unreadData } = useResource(() => conversationsService.list({ where: { unread: { gt: 0 } }, pageSize: 50 }), []);
  const unread = (unreadData?.items || []).map((c) => ({ ...c, contactName: lookupService.contact(c.contactId)?.name }));
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const closeNav = useCallback(() => setNavOpen(false), []);
  const counts = { unread: unread.reduce((a, c) => a + c.unread, 0) };
  const activeModule = useActiveModule();
  const hasSubmodules = Boolean(activeModule?.children);
  const { access } = useSession();
  // Module-level permission gate (role preview in Settings → Users & roles).
  const blocked = access(activeModule?.id ?? (location.pathname === '/' ? 'dashboard' : null)) === 'none';

  return (
    <QuickActionsProvider>
      <div className={cx('app', collapsed && 'is-collapsed', hasSubmodules && 'has-subbar', navAnim && 'nav-anim')}>
        <a className="sr-only" href="#main">Skip to content</a>
        <Sidebar
          open={navOpen}
          collapsed={collapsed}
          onClose={closeNav}
          onToggleCollapse={toggleCollapsed}
          counts={counts}
        />
        <div className="main">
          <Topbar
            onOpenNav={() => setNavOpen(true)}
            onToggleCollapse={toggleCollapsed}
            onOpenSearch={() => setSearchOpen(true)}
            unread={unread}
            counts={counts}
          />
          <main id="main" className="content" tabIndex={-1}>
            <ViewAsBanner />
            {blocked ? <NoAccess module={activeModule} /> : <Outlet />}
          </main>
        </div>
        <CommandPalette open={searchOpen} onClose={closeSearch} />
        <AssistantLauncher />
        <PwaStatus />
        <ScrollRestoration />
      </div>
    </QuickActionsProvider>
  );
}
