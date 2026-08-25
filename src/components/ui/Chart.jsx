import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';

/**
 * Chart — Premium Dark-Themed Recharts Wrapper with Custom Gradients & Glass Tooltips
 */
const PALETTE = ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#a855f7'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1rem',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
        fontSize: '0.8125rem',
      }}>
        <p style={{ margin: '0 0 0.35rem', fontWeight: 700, color: '#f8fafc' }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: entry.color || '#38bdf8' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, display: 'inline-block' }} />
            <span style={{ color: 'var(--text-secondary)' }}>{entry.name}:</span>
            <span style={{ fontWeight: 700, color: '#ffffff' }}>
              {typeof entry.value === 'number' && entry.name.toLowerCase().includes('revenue')
                ? `₹${entry.value.toLocaleString('en-IN')}`
                : entry.value?.toLocaleString() ?? entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Chart({
  type = 'bar',
  data = [],
  series = [],
  xKey = 'name',
  height = 280,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="chart-skeleton" style={{ height, background: 'rgba(255,255,255,0.02)', borderRadius: 12 }} aria-busy="true">
        <div className="spinner" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="chart-empty" style={{ height, background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
        <span style={{ color: 'var(--text-muted)' }}>No activity records found.</span>
      </div>
    );
  }

  const commonProps = {
    data,
    margin: { top: 12, right: 16, left: -10, bottom: 4 },
  };

  const axisStyle = { fontSize: 11, fill: '#64748b', fontWeight: 500 };
  const gridStyle = { stroke: 'rgba(255, 255, 255, 0.05)', strokeDasharray: '4 4' };

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === 'line' ? (
        <LineChart {...commonProps}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey={xKey} tick={axisStyle} stroke="rgba(255, 255, 255, 0.08)" />
          <YAxis tick={axisStyle} stroke="rgba(255, 255, 255, 0.08)" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8, color: '#94a3b8' }} />
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? PALETTE[i % PALETTE.length]}
              strokeWidth={3}
              dot={{ r: 4, fill: s.color ?? PALETTE[i % PALETTE.length], strokeWidth: 2, stroke: '#0f172a' }}
              activeDot={{ r: 6, fill: '#ffffff', stroke: s.color ?? PALETTE[i % PALETTE.length], strokeWidth: 3 }}
            />
          ))}
        </LineChart>
      ) : type === 'area' ? (
        <AreaChart {...commonProps}>
          <defs>
            {series.map((s, i) => {
              const color = s.color ?? PALETTE[i % PALETTE.length];
              return (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey={xKey} tick={axisStyle} stroke="rgba(255, 255, 255, 0.08)" />
          <YAxis tick={axisStyle} stroke="rgba(255, 255, 255, 0.08)" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8, color: '#94a3b8' }} />
          {series.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? PALETTE[i % PALETTE.length]}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#grad-${s.key})`}
            />
          ))}
        </AreaChart>
      ) : (
        <BarChart {...commonProps}>
          <defs>
            {series.map((s, i) => {
              const color = s.color ?? PALETTE[i % PALETTE.length];
              return (
                <linearGradient key={s.key} id={`bar-grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={1} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.65} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey={xKey} tick={axisStyle} stroke="rgba(255, 255, 255, 0.08)" />
          <YAxis tick={axisStyle} stroke="rgba(255, 255, 255, 0.08)" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8, color: '#94a3b8' }} />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={`url(#bar-grad-${s.key})`}
              radius={[6, 6, 0, 0]}
              maxBarSize={44}
            />
          ))}
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
