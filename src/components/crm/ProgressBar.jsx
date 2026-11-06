import cx from '../../lib/cx.js';
import { percent } from '../../lib/format.js';

/** Thin progress / budget bar with the value as text (never color alone). tone: progress | budget */
export default function ProgressBar({ value, tone = 'progress', showLabel = true, label }) {
  const v = value == null ? 0 : value;
  const over = tone === 'budget' && v > 1;
  return (
    <span className="pbar" aria-label={label ? `${label}: ${percent(value)}` : undefined}>
      <span className="pbar__track" aria-hidden="true">
        <span className={cx('pbar__fill', `pbar__fill--${tone}`, over && 'is-over')} style={{ width: `${Math.min(v, 1) * 100}%` }} />
      </span>
      {showLabel && <span className={cx('pbar__val', over && 'is-over')}>{percent(value)}</span>}
    </span>
  );
}
