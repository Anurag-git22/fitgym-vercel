import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';

/**
 * Chart  — thin wrapper around Recharts for consistent styling
 *
 * Props:
 *   type      'line' | 'bar'          default 'bar'
 *   data      Array<object>
 *   series    Array<{ key, label, color? }>
 *             key   — the data field name
 *             label — legend label
 *             color — hex/css color (optional, falls back to palette)
 *   xKey      string  — field used for X axis
 *   height    number  — default 300
 *   loading   boolean?
 */

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

export default function Chart({
  type = 'bar',
  data = [],
  series = [],
  xKey = 'name',
  height = 300,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="chart-skeleton" style={{ height }} aria-busy="true">
        <div className="spinner" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="chart-empty" style={{ height }}>
        <span>No data to display</span>
      </div>
    );
  }

  const commonProps = {
    data,
    margin: { top: 8, right: 16, left: 0, bottom: 4 },
  };

  const axisStyle   = { fontSize: 12, fill: '#64748b' };
  const gridStyle   = { stroke: '#e2e8f0', strokeDasharray: '3 3' };
  const tooltipStyle = {
    contentStyle: {
      borderRadius: 8,
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      fontSize: 13,
    },
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === 'line' ? (
        <LineChart {...commonProps}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey={xKey} tick={axisStyle} />
          <YAxis tick={axisStyle} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? PALETTE[i % PALETTE.length]}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      ) : (
        <BarChart {...commonProps}>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={xKey} tick={axisStyle} />
          <YAxis tick={axisStyle} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color ?? PALETTE[i % PALETTE.length]}
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          ))}
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
