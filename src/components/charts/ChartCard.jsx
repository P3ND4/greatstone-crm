import { useId, useState } from 'react';
import { useT } from '../../i18n/index.jsx';
import Card from '../ui/Card.jsx';

/**
 * Card wrapper for every chart: title/subtitle, legend slot, and an accessible data-table view
 * (so identity/values are never conveyed by color alone).
 * table: { columns: [{ key, header, align }], rows: [...] }
 */
export default function ChartCard({ title, subtitle, legend, table, children, className, actions }) {
  const t = useT();
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();
  return (
    <Card
      className={className}
      title={title}
      subtitle={subtitle}
      actions={actions}
      footer={table && (
        <div className="stack-sm">
          <button type="button" className="chart-table-toggle" aria-expanded={showTable} aria-controls={tableId} onClick={() => setShowTable((s) => !s)}>
            {showTable ? t('dashboard.charts.hideTable') : t('dashboard.charts.showTable')}
          </button>
          {showTable && (
            <div className="table-wrap" id={tableId}>
              <table className="chart-table">
                <caption className="sr-only">{title}</caption>
                <thead><tr>{table.columns.map((c) => <th key={c.key} scope="col" className={c.align === 'right' ? 'num' : undefined}>{c.header}</th>)}</tr></thead>
                <tbody>
                  {table.rows.map((r, i) => (
                    <tr key={i}>{table.columns.map((c) => <td key={c.key} className={c.align === 'right' ? 'num' : undefined}>{c.format ? c.format(r[c.key], r) : r[c.key]}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    >
      {legend && <div className="chart-legend" style={{ marginBottom: 12 }}>{legend}</div>}
      {children}
    </Card>
  );
}

export function LegendItem({ color, children }) {
  return <span><i style={{ background: color }} aria-hidden="true" />{children}</span>;
}
