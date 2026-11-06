import { useEffect } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Traps Tab focus inside `ref`, focuses the first field on open and restores focus on close. */
export default function useFocusTrap(ref, active) {
  useEffect(() => {
    if (!active || !ref.current) return undefined;
    const root = ref.current;
    const previous = document.activeElement;
    const first = root.querySelector('[data-autofocus]')
      || root.querySelector('.form-body')?.querySelector(FOCUSABLE)
      || root.querySelector(FOCUSABLE);
    (first || root).focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      const items = [...root.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    };
    root.addEventListener('keydown', onKey);
    return () => {
      root.removeEventListener('keydown', onKey);
      if (previous && previous.focus) previous.focus({ preventScroll: true });
    };
  }, [ref, active]);
}
