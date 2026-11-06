import { cloneElement, isValidElement, useId } from 'react';
import { AlertCircle } from 'lucide-react';
import cx from '../../lib/cx.js';
import { useT } from '../../i18n/index.jsx';

/**
 * Field — label + control + hint + inline error. Wires id / aria-describedby / aria-invalid automatically.
 * Usage: <Field label="Email" error={errors.email} required><Input .../></Field>
 */
export default function Field({ label, hint, error, required, optional, full, className, children }) {
  const t = useT();
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
  const control = isValidElement(children)
    ? cloneElement(children, { id, 'aria-describedby': describedBy, 'aria-invalid': error ? 'true' : undefined, 'aria-required': required || undefined })
    : children;
  return (
    <div className={cx('field', full && 'field--full', className)}>
      {label && (
        <label className="field__label" htmlFor={id}>
          {label}
          {required && <span className="req" aria-hidden="true">*</span>}
          {optional && <span className="opt">({t('common.optional')})</span>}
        </label>
      )}
      {control}
      {hint && !error && <p id={hintId} className="field__hint">{hint}</p>}
      {error && <p id={errId} className="field__error" role="alert"><AlertCircle aria-hidden="true" />{error}</p>}
    </div>
  );
}
