import { useT } from '../../../i18n/index.jsx';
import { money, percent } from '../../../lib/format.js';
import cx from '../../../lib/cx.js';

/** Budget vs actual per category: paired bars + values (legend + text, never color alone). */
export default function BudgetBreakdown({ lines }) {
  const t = useT();
  const max = Math.max(...lines.flatMap((l) => [l.budget, l.actual]), 1);
  return (
    <div className="bb">
      <div className="chart-legend" style={{ marginBottom: 12 }}>
        <span><i style={{ background: 'var(--chart-1)' }} aria-hidden="true" />{t('projects.form.budget')}</span>
        <span><i style={{ background: 'var(--chart-2)' }} aria-hidden="true" />{t('projects.actual')}</span>
      </div>
      <ul className="bb__rows">
        {lines.map((l) => {
          const over = l.actual > l.budget;
          return (
            <li key={l.category} className="bb__row" title={`${t(`budgetCategories.${l.category}`)}: ${money(l.actual)} / ${money(l.budget)}`}>
              <span className="bb__label">{t(`budgetCategories.${l.category}`)}</span>
              <span className="bb__bars" aria-hidden="true">
                <span className="bb__bar bb__bar--budget" style={{ width: `${(l.budget / max) * 100}%` }} />
                <span className={cx('bb__bar', 'bb__bar--actual', over && 'is-over')} style={{ width: `${(l.actual / max) * 100}%` }} />
              </span>
              <span className={cx('bb__val', over && 'is-over')}>{percent(l.budget ? l.actual / l.budget : null)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
