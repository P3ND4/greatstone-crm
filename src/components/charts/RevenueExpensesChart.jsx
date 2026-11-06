import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useCssVars from '../../hooks/useCssVars.js';
import { money, moneyCompact } from '../../lib/format.js';

const VARS = ['--chart-1', '--chart-2', '--chart-grid', '--chart-axis', '--surface-2'];

function TooltipContent({ active, payload, labels, colors }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__title">{row.fullLabel}</div>
      {['revenue', 'expenses'].map((k) => (
        <div key={k} className="chart-tooltip__row"><i style={{ background: colors[k] }} />{labels[k]}<b>{money(row[k])}</b></div>
      ))}
    </div>
  );
}

/** Grouped columns: revenue vs expenses per month. One y-axis, compact ticks, hover tooltip. */
export default function RevenueExpensesChart({ data, labels }) {
  const v = useCssVars(VARS);
  const colors = { revenue: v['--chart-1'], expenses: v['--chart-2'] };
  return (
    <div className="chart-box" role="img" aria-label={`${labels.revenue} / ${labels.expenses}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2} barCategoryGap="28%" margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={v['--chart-grid']} />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: v['--chart-grid'] }} tick={{ fill: v['--chart-axis'], fontSize: 12 }} interval="preserveStartEnd" />
          <YAxis tickLine={false} axisLine={false} width={56} tick={{ fill: v['--chart-axis'], fontSize: 12 }} tickFormatter={moneyCompact} />
          <Tooltip content={<TooltipContent labels={labels} colors={colors} />} cursor={{ fill: v['--surface-2'] }} />
          <Bar dataKey="revenue" name={labels.revenue} fill={colors.revenue} radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false} />
          <Bar dataKey="expenses" name={labels.expenses} fill={colors.expenses} radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
