import cx from '../../lib/cx.js';
import { initials } from '../../lib/format.js';

export default function Avatar({ name = '', size = 'md', dark, className, title }) {
  return (
    <span className={cx('avatar', size !== 'md' && `avatar--${size}`, dark && 'avatar--dark', className)} title={title ?? name} aria-hidden={title === '' ? true : undefined}>
      {initials(name)}
    </span>
  );
}
