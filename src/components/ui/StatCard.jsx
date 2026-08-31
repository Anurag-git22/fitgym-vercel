import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * StatCard — Premium KPI tile with glowing icon wraps, trend badges & glass depth
 */
export default function StatCard({
  label,
  value,
  icon,
  trend,
  hint,
  color = 'blue',
  loading = false,
  onClick
}) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;
  const isNeutral = trend === 0 || trend === undefined;

  if (loading) {
    return (
      <div className={`stat-card stat-card--${color} stat-card--loading`}>
        <div className="stat-card-top">
          <div className="stat-skeleton" style={{ width: 42, height: 42, borderRadius: 12 }} />
          <div className="stat-skeleton" style={{ width: 60, height: 22, borderRadius: 99 }} />
        </div>
        <div className="stat-skeleton stat-skeleton--value" />
        <div className="stat-skeleton stat-skeleton--label" />
      </div>
    );
  }

  return (
    <div
      className={`stat-card stat-card--${color}${onClick ? ' table-row--clickable' : ''}`}
      onClick={onClick}
    >
      <div className="stat-card-top">
        <div className="stat-card-icon-wrap">
          {typeof icon === 'string' ? (
            <span style={{ fontSize: '1.25rem' }}>{icon}</span>
          ) : (
            icon
          )}
        </div>

        {trend !== undefined && (
          <div className="stat-trend" style={{
            color: isPositive ? 'var(--emerald)' : isNegative ? 'var(--rose)' : 'var(--text-muted)',
            background: isPositive ? 'rgba(16, 185, 129, 0.12)' : isNegative ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 255, 255, 0.05)',
            borderColor: isPositive ? 'rgba(16, 185, 129, 0.25)' : isNegative ? 'rgba(244, 63, 94, 0.25)' : 'rgba(255, 255, 255, 0.1)'
          }}>
            {isPositive && <TrendingUp size={12} />}
            {isNegative && <TrendingDown size={12} />}
            {isNeutral && <Minus size={12} />}
            <span>{isPositive ? `+${trend}%` : `${trend}%`}</span>
          </div>
        )}
      </div>

      <div className="stat-card-value">{value ?? '—'}</div>
      <div className="stat-card-label">{label}</div>
      {hint && <div className="stat-card-hint">{hint}</div>}
    </div>
  );
}
