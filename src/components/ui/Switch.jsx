import { useId } from 'react';
import cx from '../../lib/cx.js';

/**
 * On/off switch (role="switch"). The whole row is clickable through the <label>.
 * <Switch checked={on} onChange={setOn} label="Daily digest" description="…" />
 */
export default function Switch({ checked, onChange, label, description, disabled, name, className }) {
  const id = useId();
  return (
    <div className={cx('switch-row', disabled && 'is-disabled', className)}>
      <label className="switch-row__text" htmlFor={id}>
        <span className="switch-row__label">{label}</span>
        {description && <span id={`${id}-d`} className="switch-row__desc">{description}</span>}
      </label>
      <button
        id={id}
        name={name}
        type="button"
        role="switch"
        aria-checked={Boolean(checked)}
        aria-describedby={description ? `${id}-d` : undefined}
        className="switch"
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="switch__thumb" aria-hidden="true" />
      </button>
    </div>
  );
}
