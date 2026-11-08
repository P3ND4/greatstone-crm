/*
 * PWA helpers: install prompt + display mode + online state as tiny external stores
 * (read with useSyncExternalStore). Imported first thing in main.jsx so the browser's
 * one-time `beforeinstallprompt` event is never missed.
 */
import { useSyncExternalStore } from 'react';

const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

let deferredPrompt = null;
let installedNow = false;
const isBrowser = typeof window !== 'undefined';

if (isBrowser) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // we show our own "Install app" button instead of the mini-infobar
    deferredPrompt = e;
    emit();
  });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; installedNow = true; emit(); });
  window.addEventListener('online', emit);
  window.addEventListener('offline', emit);
  try { window.matchMedia('(display-mode: standalone)').addEventListener('change', emit); } catch { /* old browsers */ }
}

function standalone() {
  if (!isBrowser) return false;
  try {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  } catch { return false; }
}

const ua = isBrowser ? window.navigator.userAgent : '';
export const IS_IOS = /iPad|iPhone|iPod/.test(ua) || (isBrowser && window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

let snap = null;
function snapshot() {
  const next = {
    canInstall: Boolean(deferredPrompt),
    installed: installedNow || standalone(),
    online: isBrowser ? window.navigator.onLine : true,
  };
  if (!snap || snap.canInstall !== next.canInstall || snap.installed !== next.installed || snap.online !== next.online) snap = next;
  return snap;
}

/** { canInstall, installed, online, isIOS, install() } — install() resolves to 'accepted' | 'dismissed' | 'unavailable'. */
export function usePwa() {
  const s = useSyncExternalStore(subscribe, snapshot, snapshot);
  return {
    ...s,
    isIOS: IS_IOS,
    async install() {
      if (!deferredPrompt) return 'unavailable';
      const e = deferredPrompt;
      deferredPrompt = null;
      emit();
      await e.prompt();
      const { outcome } = await e.userChoice;
      return outcome;
    },
  };
}

/** Notification permission helpers (local notifications only — no push server in phase 1). */
export const notificationsSupported = () => isBrowser && 'Notification' in window;
export const notificationPermission = () => (notificationsSupported() ? Notification.permission : 'unsupported');

export async function showLocalNotification(title, body) {
  const options = { body, icon: '/icons/icon-192.png', badge: '/icons/favicon-32.png', tag: 'gs-test' };
  const reg = await navigator.serviceWorker?.getRegistration?.();
  if (reg) return reg.showNotification(title, options);
  return new Notification(title, options);
}
