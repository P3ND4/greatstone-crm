import { useId, useRef } from 'react';

/**
 * Accessible tabs (WAI-ARIA): arrow keys / Home / End move between tabs.
 * Controlled: <Tabs tabs={[{id,label,count}]} value={tab} onChange={setTab} />  then render <TabPanel>.
 */
export default function Tabs({ tabs, value, onChange, label }) {
  const base = useId();
  const refs = useRef([]);
  const onKeyDown = (e, i) => {
    const last = tabs.length - 1;
    const map = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last };
    if (!(e.key in map)) return;
    e.preventDefault();
    const next = map[e.key];
    refs.current[next]?.focus();
    onChange(tabs[next].id);
  };
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          ref={(el) => { refs.current[i] = el; }}
          role="tab"
          type="button"
          id={`${base}-${tab.id}`}
          className="tab"
          aria-selected={value === tab.id}
          aria-controls={`${base}-${tab.id}-panel`}
          tabIndex={value === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(e) => onKeyDown(e, i)}
        >
          {tab.label}
          {tab.count != null && <span className="count">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function SegmentedControl({ options, value, onChange, label }) {
  const refs = useRef([]);
  const onKeyDown = (e, i) => {
    const last = options.length - 1;
    const map = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    refs.current[map[e.key]]?.focus();
    onChange(options[map[e.key]].value);
  };
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => { refs.current[i] = el; }}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          tabIndex={value === o.value ? 0 : -1}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => onKeyDown(e, i)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
