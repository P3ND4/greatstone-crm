import { useEffect, useRef } from 'react';

/** useHotkey('mod+k', handler) — 'mod' = Ctrl on Windows/Linux, ⌘ on macOS. */
export default function useHotkey(combo, handler, { enabled = true, allowInInputs = true } = {}) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!enabled) return undefined;
    const parts = combo.toLowerCase().split('+');
    const key = parts.pop();
    const needMod = parts.includes('mod');
    const needShift = parts.includes('shift');
    const onKey = (e) => {
      if (!allowInInputs && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (needMod !== mod || needShift !== e.shiftKey) return;
      if (e.key.toLowerCase() !== key) return;
      e.preventDefault();
      ref.current(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [combo, enabled, allowInInputs]);
}
