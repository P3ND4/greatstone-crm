import { useEffect, useId, useRef, useState } from 'react';
import cx from '../../lib/cx.js';

/**
 * Dropdown menu with keyboard support (↑↓, Home/End, Esc, click-outside).
 * trigger: (props) => <button {...props}>…</button>
 * children: (close) => menu items (use .menu__item buttons/links with role="menuitem")
 */
export default function Menu({ trigger, children, align = 'right', label }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const panel = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!root.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    const first = panel.current?.querySelector('[role="menuitem"]');
    first?.focus();
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const onKeyDown = (e) => {
    const items = [...(panel.current?.querySelectorAll('[role="menuitem"]') || [])];
    const idx = items.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); root.current?.querySelector('[aria-haspopup]')?.focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); items[(idx + 1) % items.length]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus(); }
    else if (e.key === 'Home') { e.preventDefault(); items[0]?.focus(); }
    else if (e.key === 'End') { e.preventDefault(); items[items.length - 1]?.focus(); }
    else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div className="menu" ref={root} onKeyDown={open ? onKeyDown : undefined}>
      {trigger({ 'aria-haspopup': 'menu', 'aria-expanded': open, 'aria-controls': id, onClick: () => setOpen((o) => !o) })}
      {open && (
        <div id={id} ref={panel} role="menu" aria-label={label} className={cx('menu__panel', align === 'left' && 'menu__panel--left')}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
