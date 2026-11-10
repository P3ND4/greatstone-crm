/*
 * Auth service (mock). Same shape the real one will have — see docs/API_INTEGRATION.md → "Auth".
 *   restore()            → session | null      (sync, on app start: reads the stored session)
 *   signIn({ email, password, remember }) → { user, session }   throws { code }
 *   signOut()            → { ok }
 *   requestPasswordReset(email) → { ok }       (always ok: never reveals whether an email exists)
 * Phase 2: replace the bodies with Supabase Auth (signInWithPassword / signOut / resetPasswordForEmail)
 * or your API (POST /auth/login …). Components only use SessionProvider, never this file directly.
 */
import { auth, delay, table } from './client.js';

const KEY = 'gs.auth';
// Demo only: every fictional user signs in with this password (accounts listed in docs/DEMO_ACCOUNTS.md).
// No real credentials exist in phase 1.
export const DEMO_PASSWORD = 'greatstone';
const SHORT = 12 * 60 * 60 * 1000; // 12 h
const LONG = 30 * 24 * 60 * 60 * 1000; // 30 days ("Keep me signed in")
const MAX_ATTEMPTS = 5;
const LOCK_MS = 30 * 1000;

let failures = 0;
let lockedUntil = 0;

const store = (name) => { try { return window[name]; } catch { return null; } };
const fail = (code, extra = {}) => Object.assign(new Error(code), { code, ...extra });

function readStored() {
  for (const name of ['localStorage', 'sessionStorage']) {
    try {
      const raw = store(name)?.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* corrupted or blocked storage → treat as signed out */ }
  }
  return null;
}
function clearStored() {
  ['localStorage', 'sessionStorage'].forEach((name) => { try { store(name)?.removeItem(KEY); } catch { /* ignore */ } });
}

const findUser = (id) => table('users').find((u) => u.id === id);

export const authService = {
  restore() {
    const s = readStored();
    const user = s && findUser(s.userId);
    if (!s || !user || user.status === 'inactive' || !(s.expiresAt > Date.now())) {
      clearStored();
      auth.userId = null;
      return null;
    }
    auth.userId = user.id;
    return s;
  },

  async signIn({ email, password, remember = false }) {
    if (Date.now() < lockedUntil) throw fail('too_many_attempts', { retryIn: Math.ceil((lockedUntil - Date.now()) / 1000) });
    await delay(null);
    const user = table('users').find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!user || password !== DEMO_PASSWORD) {
      failures += 1;
      if (failures >= MAX_ATTEMPTS) { failures = 0; lockedUntil = Date.now() + LOCK_MS; throw fail('too_many_attempts', { retryIn: LOCK_MS / 1000 }); }
      throw fail('invalid_credentials');
    }
    if (user.status === 'inactive') throw fail('user_inactive');
    failures = 0;
    const session = { userId: user.id, token: `demo.${Math.random().toString(36).slice(2)}`, expiresAt: Date.now() + (remember ? LONG : SHORT) };
    clearStored();
    try { store(remember ? 'localStorage' : 'sessionStorage')?.setItem(KEY, JSON.stringify(session)); } catch { /* private mode: session lives in memory */ }
    auth.userId = user.id;
    return { user: structuredClone(user), session };
  },

  async signOut() {
    clearStored();
    auth.userId = null;
    return delay({ ok: true });
  },

  async requestPasswordReset(email) {
    void email;
    return delay({ ok: true });
  },
};
