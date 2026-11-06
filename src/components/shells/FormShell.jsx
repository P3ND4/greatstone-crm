import { X } from 'lucide-react';
import cx from '../../lib/cx.js';
import { useT } from '../../i18n/index.jsx';
import Button, { IconButton } from '../ui/Button.jsx';

/**
 * FormShell — the ONE form structure used everywhere (modal and page).
 * Fixed header (title + close/back) · scrolling body · fixed footer (Cancel / Save + save state).
 * Ctrl/⌘+Enter submits. Never scrolls horizontally.
 */
export default function FormShell({
  variant = 'modal', title, subtitle, titleId, headerStart, headerEnd, onCancel, onSubmit, dirty, saving,
  submitLabel, cancelLabel, footerExtra, children, className,
}) {
  const t = useT();
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      e.currentTarget.requestSubmit();
    }
  };
  return (
    <form className={cx('form-shell', `form-shell--${variant}`, className)} onSubmit={onSubmit} onKeyDown={onKeyDown} noValidate>
      <header className="form-header">
        {headerStart}
        <div className="form-header__titles">
          <h2 className="form-title" id={titleId}>{title}</h2>
          {subtitle && <p className="form-subtitle">{subtitle}</p>}
        </div>
        {headerEnd}
        {variant === 'modal' && <IconButton icon={X} label={t('common.close')} onClick={onCancel} />}
      </header>
      <div className="form-body">{children}</div>
      <footer className="form-footer">
        <div className="form-footer__status" aria-live="polite">
          {saving ? t('common.saving') : dirty ? (<><span className="dot" aria-hidden="true" />{t('common.unsaved')}</>) : null}
          {!saving && <span className="hint subtle">{dirty ? ' · ' : ''}{t('common.shortcutSave')}</span>}
        </div>
        {footerExtra}
        <Button onClick={onCancel} disabled={saving}>{cancelLabel ?? t('common.cancel')}</Button>
        <Button type="submit" variant="primary" disabled={saving}>{saving ? t('common.saving') : submitLabel ?? t('common.save')}</Button>
      </footer>
    </form>
  );
}
