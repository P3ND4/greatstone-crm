import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import cx from '../../lib/cx.js';
import Skeleton from './Skeleton.jsx';

/**
 * Table — columns: [{ key, header, render?, align?, sortable?, width?, hide?: 'md'|'lg'|'xl'|'xxl'|'3xl' (hidden below that width) }]
 * Sort is controlled ("field:asc|desc") so it can live in the URL. Header row is sticky.
 * Always paginate upstream (never render hundreds of rows).
 */
export default function Table({ columns, rows, loading, sort, onSort, onRowClick, rowClassName, rowKey = 'id', caption, skeletonRows = 8 }) {
  const [sortField, sortDir] = (sort || '').split(':');
  const toggle = (key) => onSort?.(sortField === key && sortDir === 'asc' ? `${key}:desc` : `${key}:asc`);
  return (
    <div className="table-wrap table-wrap--sticky">
      <table className="table">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sortField === c.key;
              const ariaSort = active ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined;
              return (
                <th key={c.key} scope="col" className={cx(c.align === 'right' && 'num', c.hide && `col-hide-${c.hide}`)} style={{ width: c.width }} aria-sort={ariaSort}>
                  {c.sortable && onSort ? (
                    <button type="button" onClick={() => toggle(c.key)}>
                      {c.header}
                      {active ? (sortDir === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />) : <ChevronsUpDown size={12} aria-hidden="true" />}
                    </button>
                  ) : c.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: skeletonRows }, (_, i) => (
              <tr key={`sk-${i}`} aria-hidden="true">
                {columns.map((c) => <td key={c.key} className={cx(c.hide && `col-hide-${c.hide}`)}><Skeleton width={c.align === 'right' ? 64 : `${50 + ((i * 17) % 40)}%`} /></td>)}
              </tr>
            ))
            : rows.map((row) => (
              <tr
                key={row[rowKey]}
                className={cx(onRowClick && 'is-clickable', rowClassName?.(row))}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' && e.target === e.currentTarget) onRowClick(row); } : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cx(c.align === 'right' && 'num', c.hide && `col-hide-${c.hide}`)}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
