import { Inbox } from 'lucide-react';

/**
 * EmptyState — Minimalist Dark Placeholder for Empty Lists/Queries
 */
export default function EmptyState({
  icon,
  title = 'No records found',
  message,
  action
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon ? (
          typeof icon === 'string' ? icon : icon
        ) : (
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            margin: '0 auto'
          }}>
            <Inbox size={26} />
          </div>
        )}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {message && <p className="empty-state-message">{message}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
