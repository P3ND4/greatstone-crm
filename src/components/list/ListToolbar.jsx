import { useEffect, useState } from 'react';
import { LayoutGrid, List, Search, X } from 'lucide-react';
import { useT } from '../../i18n/index.jsx';
import cx from '../../lib/cx.js';

/** Debounced search bound to URL state. */
export function SearchInput({ value, onChange, placeholder, label }) {
  const t = useT();
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    if (draft === value) return undefined;
    const h = setTimeout(() => onChange(draft), 250);
    return () => clearTimeout(h);
  }, [draft]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="input-group toolbar__search">
      <span className="input-group__icon"><Search aria-hidden="true" /></span>
      <input
        className="input"
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder ?? t('common.search')}
        aria-label={label ?? placeholder ?? t('common.search')}
      />
    </div>
  );
}

/** Compact select used as a filter chip. */
export function FilterSelect({ label, value, onChange, options, allLabel }) {
  const t = useT();
  return (
    <label className={cx('filter', value && 'is-active')}>
      <span className="sr-only">{label}</span>
      <select className="select select--sm" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        <option value="">{allLabel ?? `${label}: ${t('common.all')}`}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function ViewToggle({ value, onChange }) {
  const t = useT();
  return (
    <div className="segmented segmented--icons" role="radiogroup" aria-label={t('list.view')}>
      {[['table', List, t('list.table')], ['cards', LayoutGrid, t('list.cards')]].map(([v, Icon, label]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} aria-label={label} title={label} onClick={() => onChange(v)}>
          <Icon size={16} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

/** Toolbar row: search · filters · clear · right-side slot. Wraps on narrow widths. */
export default function ListToolbar({ search, filters, activeFilters, onClear, end }) {
  const t = useT();
  return (
    <div className="toolbar">
      {search}
      <div className="toolbar__filters">
        {filters}
        {activeFilters > 0 && (
          <button type="button" className="btn btn--ghost btn--sm btn--plain" onClick={onClear}>
            <X aria-hidden="true" />{t('common.clear')}
          </button>
        )}
      </div>
      {end && <div className="toolbar__end">{end}</div>}
    </div>
  );
}
