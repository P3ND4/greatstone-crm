import cx from '../../lib/cx.js';

export default function Card({ title, subtitle, actions, footer, flush, className, children, as: Tag = 'section', ...rest }) {
  const headingId = rest.id ? `${rest.id}-title` : undefined;
  return (
    <Tag className={cx('card', className)} aria-labelledby={title ? headingId : undefined} {...rest}>
      {(title || actions) && (
        <header className="card__header">
          <div className="grow">
            {title && <h2 id={headingId} className="card__title">{title}</h2>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="row">{actions}</div>}
        </header>
      )}
      <div className={cx('card__body', flush && 'card__body--flush')}>{children}</div>
      {footer && <footer className="card__footer">{footer}</footer>}
    </Tag>
  );
}
