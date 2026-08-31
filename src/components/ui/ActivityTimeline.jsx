import { Bell, CreditCard, Dumbbell, UserPlus, AlertTriangle, Activity } from 'lucide-react';
import EmptyState from './EmptyState';

const ICONS = {
  notification: Bell,
  payment: CreditCard,
  workout: Dumbbell,
  trainee: UserPlus,
  warning: AlertTriangle,
  default: Activity,
};

const TONE = {
  notification: 'timeline-item--info',
  payment: 'timeline-item--success',
  workout: 'timeline-item--purple',
  trainee: 'timeline-item--info',
  warning: 'timeline-item--warning',
};

function formatWhen(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ActivityTimeline({ items = [], loading = false, emptyMsg = 'No recent activity.' }) {
  if (loading) {
    return (
      <div className="timeline" aria-busy="true">
        {[0, 1, 2].map(i => (
          <div key={i} className="timeline-item">
            <div className="timeline-marker skeleton-cell" style={{ width: 32, height: 32, borderRadius: 999 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton-cell" style={{ width: '70%', height: 12, marginBottom: 8 }} />
              <div className="skeleton-cell" style={{ width: '40%', height: 10 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return <EmptyState title={emptyMsg} message="New events will show up here as they happen." />;
  }

  return (
    <ol className="timeline">
      {items.map((item, i) => {
        const type = item.type || 'default';
        const Icon = ICONS[type] ?? ICONS.default;
        return (
          <li key={item.id ?? i} className={`timeline-item ${TONE[type] ?? ''}`.trim()}>
            <div className="timeline-marker">
              <Icon size={14} />
            </div>
            <div className="timeline-body">
              <p className="timeline-message">{item.message}</p>
              <time className="timeline-time">{formatWhen(item.date ?? item.created_at)}</time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
