import { Inbox } from 'lucide-react';

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
          typeof icon === 'string' ? <span>{icon}</span> : icon
        ) : (
          <div className="empty-state-icon-box">
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
