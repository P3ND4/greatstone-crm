import { forwardRef } from 'react';
import cx from '../../lib/cx.js';

/** Native select (accessible, mobile-friendly). options: [{ value, label }] */
const Select = forwardRef(function Select({ options = [], placeholder, className, ...rest }, ref) {
  return (
    <select ref={ref} className={cx('select', className)} {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
});
export default Select;
