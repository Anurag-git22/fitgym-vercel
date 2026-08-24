/**
 * StatCard  — single KPI tile used in dashboards
 *
 * Props:
 *   label      string    — metric label
 *   value      string|number
 *   icon       string    — emoji or text icon
 *   trend      number?   — signed %; positive = green, negative = red
 *   color      'blue'|'green'|'orange'|'red'|'purple'   default 'blue'
 *   loading    boolean?
 */
export default function StatCard({ label, value, icon, trend, color = 'blue', loading = false }) {
  const trendSign = trend > 0 ? '+' : '';
  const trendClass = trend > 0 ? 'trend--up' : trend < 0 ? 'trend--down' : 'trend--neutral';

  if (loading) {
    return (
      <div className={`stat-card stat-card--${color} stat-card--loading`}>
        <div className="stat-skeleton stat-skeleton--label" />
        <div className="stat-skeleton stat-skeleton--value" />
      </div>
    );
  }

  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card-top">
        <span className="stat-card-icon">{icon}</span>
        {trend !== undefined && (
          <span className={`stat-trend ${trendClass}`}>
            {trendSign}{trend}%
          </span>
        )}
      </div>
      <div className="stat-card-value">{value ?? '—'}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}
