import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import cx from '../../lib/cx.js';

/** Button — variants: primary | secondary | dark | ghost | danger. Pass `to` to render a router Link. */
const Button = forwardRef(function Button(
  { variant = 'secondary', size = 'md', icon: Icon, iconRight: IconRight, block, plain, to, className, children, type = 'button', ...rest },
  ref,
) {
  const classes = cx('btn', `btn--${variant}`, size === 'sm' && 'btn--sm', block && 'btn--block', plain && 'btn--plain', className);
  const content = (
    <>
      {Icon && <Icon aria-hidden="true" />}
      {children}
      {IconRight && <IconRight aria-hidden="true" />}
    </>
  );
  if (to) return <Link ref={ref} to={to} className={classes} {...rest}>{content}</Link>;
  return <button ref={ref} type={type} className={classes} {...rest}>{content}</button>;
});

export default Button;

export const IconButton = forwardRef(function IconButton({ icon: Icon, label, size, dot, className, ...rest }, ref) {
  return (
    <button ref={ref} type="button" aria-label={label} title={label} className={cx('icon-btn', size === 'sm' && 'icon-btn--sm', className)} {...rest}>
      <Icon aria-hidden="true" />
      {dot && <span className="dot" aria-hidden="true" />}
    </button>
  );
});
