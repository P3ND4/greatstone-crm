import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { DEFAULT_ACCENT } from './theme.js';
import { accentVars } from '../lib/color.js';
import { authService, lookupService, settingsSnapshot } from '../services/index.js';

/*
 * Session = who is signed in (authService), the role being previewed ("View as"), module access,
 * theme and brand accent. Phase 2: user + role come from the real auth session; access is enforced
 * by the backend (RLS), this provider only drives the UI (login redirect, no-access page, read-only settings).
 */
const VIEW_AS_KEY = 'gs.viewAs';
const THEME_KEY = 'gs.theme';

const SessionContext = createContext(null);
const read = (store, key) => { try { return window[store].getItem(key); } catch { return null; } };
const write = (store, key, value) => { try { if (value == null) window[store].removeItem(key); else window[store].setItem(key, value); } catch { /* ignore */ } };

function systemDark() {
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; }
}

export function SessionProvider({ children }) {
  const [version, refresh] = useReducer((x) => x + 1, 0);
  const [viewAs, setViewAsState] = useState(() => read('sessionStorage', VIEW_AS_KEY));
  const [theme, setThemeState] = useState(() => read('localStorage', THEME_KEY) || 'light');
  const [sysDark, setSysDark] = useState(systemDark);

  const [userId, setUserId] = useState(() => authService.restore()?.userId ?? null);
  const [signedOut, setSignedOut] = useState(null); // { email } right after an explicit sign-out
  const user = userId ? lookupService.user(userId) : null;
  const realRole = user?.role || 'viewer';
  const role = viewAs && viewAs !== realRole ? viewAs : realRole;

  const setViewAs = useCallback((r) => {
    const next = r && r !== realRole ? r : null;
    write('sessionStorage', VIEW_AS_KEY, next);
    setViewAsState(next);
  }, [realRole]);

  const setTheme = useCallback((value) => {
    write('localStorage', THEME_KEY, value);
    setThemeState(value);
  }, []);

  // Follow the OS setting when theme = system.
  useEffect(() => {
    let mq;
    try { mq = window.matchMedia('(prefers-color-scheme: dark)'); } catch { return undefined; }
    const on = (e) => setSysDark(e.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);

  const resolvedTheme = theme === 'system' ? (sysDark ? 'dark' : 'light') : theme;
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    // theme-color paints the browser / app title bar. When the installed desktop app draws its content
    // in the title bar (Window Controls Overlay), match the topbar so min/max/close blend in.
    let wco = null;
    try { wco = window.matchMedia('(display-mode: window-controls-overlay)'); } catch { /* old browsers */ }
    const apply = () => {
      const color = wco?.matches ? (resolvedTheme === 'dark' ? '#12100A' : '#FBFAF2') : (resolvedTheme === 'dark' ? '#0C0A04' : '#171200');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
    };
    apply();
    wco?.addEventListener?.('change', apply);
    return () => wco?.removeEventListener?.('change', apply);
  }, [resolvedTheme]);

  // Brand accent from Settings → Organization (default = tokens.css, so nothing is overridden).
  const accent = settingsSnapshot.accent();
  useEffect(() => {
    const root = document.documentElement;
    const vars = accentVars(accent || DEFAULT_ACCENT, resolvedTheme === 'dark');
    Object.keys(vars).forEach((k) => {
      if (!accent || accent.toUpperCase() === DEFAULT_ACCENT) root.style.removeProperty(k);
      else root.style.setProperty(k, vars[k]);
    });
  }, [accent, version, resolvedTheme]);

  const signIn = useCallback(async (credentials) => {
    const { user: u } = await authService.signIn(credentials);
    write('sessionStorage', VIEW_AS_KEY, null);
    setViewAsState(null);
    setSignedOut(null);
    setUserId(u.id);
    return u;
  }, []);

  const signOut = useCallback(async () => {
    const email = userId ? lookupService.user(userId)?.email : '';
    await authService.signOut();
    write('sessionStorage', VIEW_AS_KEY, null);
    setViewAsState(null);
    setSignedOut({ email });
    setUserId(null);
  }, [userId]);

  const value = useMemo(() => ({
    isAuthenticated: Boolean(user),
    signedOut,
    clearSignedOut: () => setSignedOut(null),
    signIn,
    signOut,
    user,
    realRole,
    role,
    viewAs: role !== realRole ? role : null,
    setViewAs,
    access: (moduleId) => (moduleId ? settingsSnapshot.access(role, moduleId) : 'full'),
    assistantEnabled: settingsSnapshot.assistantEnabled(),
    theme,
    resolvedTheme,
    setTheme,
    refresh,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, realRole, role, setViewAs, theme, resolvedTheme, setTheme, version, signIn, signOut, signedOut]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
