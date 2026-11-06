import { useCallback, useEffect, useState } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import useHotkey from '../../hooks/useHotkey.js';
import useResource from '../../hooks/useResource.js';
import { conversationsService, lookupService } from '../../services/index.js';
import { QuickActionsProvider } from '../quick/QuickActionsProvider.jsx';
import CommandPalette from './CommandPalette.jsx';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { useActiveModule } from './ModuleNav.jsx';
import cx from '../../lib/cx.js';

const COLLAPSE_KEY = 'gs.sidebarCollapsed';
const readCollapsed = () => { try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; } };

export default function AppLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setNavOpen(false); }, [location.pathname]);
  useEffect(() => { try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch { /* ignore */ } }, [collapsed]);
  useHotkey('mod+k', () => setSearchOpen((o) => !o));
  // Ctrl/⌘+B toggles the sidebar — ignored while typing (inputs, text areas, rich text).
  useHotkey('mod+b', () => setCollapsed((c) => !c), { allowInInputs: false });

  const { data: unreadData } = useResource(() => conversationsService.list({ filter: (c) => c.unread > 0, pageSize: 50 }), []);
  const unread = (unreadData?.items || []).map((c) => ({ ...c, contactName: lookupService.contact(c.contactId)?.name }));
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const counts = { unread: unread.reduce((a, c) => a + c.unread, 0) };
  const hasSubmodules = Boolean(useActiveModule()?.children);

  return (
    <QuickActionsProvider>
      <div className={cx('app', collapsed && 'is-collapsed', hasSubmodules && 'has-subbar')}>
        <a className="sr-only" href="#main">Skip to content</a>
        <Sidebar
          open={navOpen}
          collapsed={collapsed}
          onClose={() => setNavOpen(false)}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          counts={counts}
        />
        <div className="main">
          <Topbar
            onOpenNav={() => setNavOpen(true)}
            onOpenSearch={() => setSearchOpen(true)}
            unread={unread}
            counts={counts}
          />
          <main id="main" className="content" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
        <CommandPalette open={searchOpen} onClose={closeSearch} />
        <ScrollRestoration />
      </div>
    </QuickActionsProvider>
  );
}
