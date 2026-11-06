/**
 * Single-series horizontal bar chart in plain HTML (no legend needed: the card title names the series).
 * Bars ≤ 14px, 4px rounded data-end, value labelled at the tip in text ink (never the series color).
 * data: [{ key, label, value, meta? }]
 */
export default function HBarChart({ data, format = (v) => v, color = 'var(--chart-1)', ariaLabel }) {
  const max = Math.max(...data.map((d) => d.value), 0) || 1;
  return (
    <div className="hbar" role="list" aria-label={ariaLabel}>
      {data.map((d) => (
        <div key={d.key} className="hbar__row" role="listitem" title={`${d.label}: ${format(d.value)}${d.meta ? ` · ${d.meta}` : ''}`}>
          <span className="hbar__label">{d.label}</span>
          <span className="hbar__track" aria-hidden="true">
            <span className="hbar__fill" style={{ width: `${(d.value / max) * 100}%`, background: color, opacity: d.value === 0 ? 0 : 1 }} />
          </span>
          <span className="hbar__value">
            {format(d.value)}
            {d.meta && <span className="subtle" style={{ fontWeight: 400 }}> · {d.meta}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
