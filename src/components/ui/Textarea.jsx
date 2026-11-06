import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import cx from '../../lib/cx.js';

/**
 * Auto-growing textarea: starts at `minRows`, grows vertically while typing up to `maxRows`,
 * then scrolls internally. Long words wrap — never widens the layout.
 */
const Textarea = forwardRef(function Textarea({ minRows = 3, maxRows = 10, className, onChange, value, ...rest }, ref) {
  const inner = useRef(null);
  useImperativeHandle(ref, () => inner.current);

  const resize = useCallback(() => {
    const el = inner.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const line = parseFloat(cs.lineHeight) || 20;
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    const min = line * minRows + pad;
    const max = line * maxRows + pad;
    el.style.height = 'auto';
    const next = Math.min(Math.max(el.scrollHeight + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth), min), max);
    el.style.height = `${next}px`;
    el.classList.toggle('is-capped', el.scrollHeight > max - pad + 1);
  }, [minRows, maxRows]);

  useEffect(resize, [value, resize]);

  return (
    <textarea
      ref={inner}
      rows={minRows}
      className={cx('textarea', className)}
      value={value}
      onChange={(e) => { onChange?.(e); resize(); }}
      {...rest}
    />
  );
});
export default Textarea;
