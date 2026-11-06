import { forwardRef } from 'react';
import Input from './Input.jsx';

/** DatePicker — native date/time input styled with tokens (keyboard + screen-reader friendly). */
const DatePicker = forwardRef(function DatePicker({ withTime = false, ...rest }, ref) {
  return <Input ref={ref} type={withTime ? 'datetime-local' : 'date'} {...rest} />;
});
export default DatePicker;
