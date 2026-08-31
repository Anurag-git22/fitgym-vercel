import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

/**
 * Chart — Theme-Aware Recharts Wrapper (Dark / Light)
 */
const PALETTE = ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#a855f7'];

function useChartTheme() {
  const { theme } = useTheme();
  return useMemo(() => {
    const isDark = theme !== 'light';

    return {
      isDark,
      grid: {
        stroke: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)',
        strokeDasharray: '4 4',
      },
      axis: {
        tick: { fontSize: 11, fill: isDark ? '#64748b' : '#475569', fontWeight: 500 },
        stroke: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.12)',
      },
      tooltip: isDark
        ? {
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
            labelColor: '#f8fafc',
            valueColor: '#ffffff',
            dotBorder: '#0f172a',
          }
        : {
            background: '#ffffff',
            backdropFilter: 'none',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
            labelColor: '#0f172a',
            valueColor: '#0f172a',
            dotBorder: '#ffffff',
          },
      legend: {
        color: isDark ? '#94a3b8' : '#475569',
      },
    };
  }, [theme]);
}

const CustomTooltip = ({ active, payload, label }) => {
  const { tooltip } = useChartTheme();

  if (active && payload && payload.length) {
    return (
      <div style={{
        background: tooltip.background,
        backdropFilter: tooltip.backdropFilter,
        border: tooltip.border,
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1rem',
        boxShadow: tooltip.boxShadow,
        fontSize: '0.8125rem',
        color: tooltip.labelColor,
      }}>
        <p style={{ margin: '0 0 0.35rem', fontWeight: 700, color: tooltip.labelColor }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: entry.color || '#38bdf8' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, display: 'inline-block' }} />
            <span style={{ color: 'var(--text-secondary)' }}>{entry.name}:</span>
            <span style={{ fontWeight: 700, color: tooltip.valueColor }}>
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
  const chartTheme = useChartTheme();

  if (loading) {
    return (
      <div className="chart-skeleton" style={{ height, background: chartTheme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)', borderRadius: 12 }} aria-busy="true">
        <div className="spinner" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="chart-empty" style={{ height, background: chartTheme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)', borderRadius: 12 }}>
        <span style={{ color: 'var(--text-muted)' }}>No activity records found.</span>
      </div>
    );
  }

  const commonProps = {
    data,
    margin: { top: 12, right: 16, left: -10, bottom: 4 },
  };

  const { grid, axis, legend } = chartTheme;

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === 'line' ? (
        <LineChart {...commonProps}>
          <CartesianGrid {...grid} />
          <XAxis dataKey={xKey} tick={axis.tick} stroke={axis.stroke} />
          <YAxis tick={axis.tick} stroke={axis.stroke} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8, color: legend.color }} />
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? PALETTE[i % PALETTE.length]}
              strokeWidth={3}
              dot={{ r: 4, fill: s.color ?? PALETTE[i % PALETTE.length], strokeWidth: 2, stroke: chartTheme.tooltip.dotBorder }}
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
          <CartesianGrid {...grid} />
          <XAxis dataKey={xKey} tick={axis.tick} stroke={axis.stroke} />
          <YAxis tick={axis.tick} stroke={axis.stroke} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8, color: legend.color }} />
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
          <CartesianGrid {...grid} vertical={false} />
          <XAxis dataKey={xKey} tick={axis.tick} stroke={axis.stroke} />
          <YAxis tick={axis.tick} stroke={axis.stroke} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8, color: legend.color }} />
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
