import { forwardRef } from 'react';
import cx from '../../lib/cx.js';

const Input = forwardRef(function Input({ icon: Icon, suffix, className, ...rest }, ref) {
  const input = <input ref={ref} className={cx('input', Icon && 'input--icon', suffix && 'input--suffix', className)} {...rest} />;
  if (!Icon && !suffix) return input;
  return (
    <div className="input-group">
      {Icon && <span className="input-group__icon"><Icon aria-hidden="true" /></span>}
      {input}
      {suffix && <span className="input-group__suffix">{suffix}</span>}
    </div>
  );
});
export default Input;
