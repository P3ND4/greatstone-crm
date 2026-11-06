import cx from '../../lib/cx.js';

/** tone: neutral | success | warning | danger | info | accent */
export default function Badge({ tone = 'neutral', dot, icon: Icon, className, children }) {
  return (
    <span className={cx('badge', tone !== 'neutral' && `badge--${tone}`, dot && 'badge--dot', className)}>
      {Icon && <Icon aria-hidden="true" />}
      {children}
    </span>
  );
}
