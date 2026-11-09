import { useEffect } from 'react';

const THRESHOLD = 72; // px of (damped) pull needed to refresh
const MAX = 120;
const DAMPING = 0.45;
const RELOAD = () => window.location.reload();

/** True when the touch started inside something that scrolls on its own and isn't at its top (lists, threads, tables, modals). */
function insideScrolled(el) {
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    if (n.closest?.('.modal-root, .ai-panel-root, .palette, .sidebar.is-open, [data-no-ptr]')) return true;
    if (n.scrollTop > 0) return true;
  }
  return false;
}

/**
 * App-style pull-to-refresh for touch screens. The document itself never bounces
 * (`overscroll-behavior-y: none` in base.css), so the sticky topbar stays put on iPhone Safari;
 * instead the page content slides down under the topbar and a spinner appears. Release past the
 * threshold → `onRefresh()` (default: reload the page, like the browser gesture).
 *
 * Drives CSS through `--ptr` (px) and the classes `is-pulling` / `is-ptr-ready` / `is-ptr-refreshing`
 * on `rootRef.current` — no React re-render per touchmove.
 */
export default function usePullToRefresh(rootRef, { onRefresh = RELOAD, enabled = true } = {}) {
  useEffect(() => {
    const root = rootRef.current;
    let coarse = false;
    try { coarse = window.matchMedia('(pointer: coarse)').matches; } catch { /* old browsers */ }
    if (!root || !enabled || !coarse) return undefined;

    let startX = 0;
    let startY = 0;
    let pull = 0;
    let tracking = false;
    let decided = false;
    let frame = 0;

    const paint = () => {
      frame = 0;
      root.style.setProperty('--ptr', `${pull}px`);
      root.classList.toggle('is-ptr-ready', pull >= THRESHOLD);
    };
    const reset = () => {
      tracking = false;
      decided = false;
      pull = 0;
      root.classList.remove('is-pulling', 'is-ptr-ready');
      root.classList.add('is-ptr-release');
      root.style.setProperty('--ptr', '0px');
      window.setTimeout(() => root.classList.remove('is-ptr-release'), 220);
    };

    const onStart = (e) => {
      if (e.touches.length !== 1 || window.scrollY > 0 || document.body.classList.contains('scroll-locked')) return;
      if (root.classList.contains('is-ptr-refreshing') || insideScrolled(e.target)) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
      decided = false;
      pull = 0;
    };
    const onMove = (e) => {
      if (!tracking) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (!decided) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        // Only a clear downward drag at the very top of the page starts a pull (sideways swipes scroll tabs/tables).
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy) || window.scrollY > 0) { tracking = false; return; }
        decided = true;
        root.classList.add('is-pulling');
      }
      pull = Math.max(0, Math.min(MAX, dy * DAMPING));
      if (!frame) frame = window.requestAnimationFrame(paint);
    };
    const onEnd = () => {
      if (!tracking) return;
      if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
      if (decided && pull >= THRESHOLD) {
        tracking = false;
        root.classList.remove('is-pulling', 'is-ptr-ready');
        root.classList.add('is-ptr-refreshing', 'is-ptr-release');
        root.style.setProperty('--ptr', '56px');
        window.setTimeout(() => {
          Promise.resolve(onRefresh()).finally(() => { root.classList.remove('is-ptr-refreshing'); reset(); });
        }, 350);
        return;
      }
      reset();
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [rootRef, onRefresh, enabled]);
}
